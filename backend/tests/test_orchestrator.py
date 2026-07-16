import pytest
from unittest import mock
from google.genai import types

from app.agent import run_commander_agent

# Mock stadium status showing overcrowding in zone_2
MOCK_OVERCROWDED_STADIUM = {
    "zone_1": {
        "id": "zone_1",
        "name": "Gate A",
        "crowd_density": 30,
        "gate_queue_time_mins": 5,
        "weather": {"temp_c": 22, "condition": "Sunny", "humidity_percent": 50},
        "accessibility_alerts": [],
        "alerts": [],
        "incident_reports": []
    },
    "zone_2": {
        "id": "zone_2",
        "name": "Gate B",
        "crowd_density": 85,  # Overcrowded (>75%)
        "gate_queue_time_mins": 45,
        "weather": {"temp_c": 22, "condition": "Sunny", "humidity_percent": 50},
        "accessibility_alerts": [],
        "alerts": [],
        "incident_reports": []
    }
}

MOCK_TRANSPORT = {
    "shuttle_a": {
        "route_id": "shuttle_a",
        "name": "Shuttle A",
        "status": "Normal",
        "load_percentage": 20,
        "estimated_wait_time_mins": 2
    }
}

# Test 1: Verify local Mock Agent logic picks the right tools (reroute_fans + send_multilingual_alert)
# when a high-density alert trigger is processed.
@mock.patch("app.agent.is_api_key_valid", return_value=False)
@mock.patch("app.agent.get_all_zones_summary")
@mock.patch("app.agent.get_transport_status", return_value=MOCK_TRANSPORT)
@mock.patch("app.agent.reroute_fans")
@mock.patch("app.agent.send_multilingual_alert")
def test_mock_agent_orchestration_high_density(
    mock_send_alert, mock_reroute, mock_transport, mock_summary, mock_key_valid
):
    # Setup mock stadium summary where zone_2 has 85% density
    mock_summary.return_value = {
        "zone_1": {"name": "Gate A", "crowd_density": 30, "gate_queue_time_mins": 5, "alert_count": 0, "incident_count": 0},
        "zone_2": {"name": "Gate B", "crowd_density": 85, "gate_queue_time_mins": 45, "alert_count": 0, "incident_count": 0}
    }
    
    mock_reroute.return_value = {"status": "Success", "message": "Rerouted fans to Gate A"}
    mock_send_alert.return_value = {"status": "Success", "message": "Alert sent"}
    
    trigger = "Occupancy Alert: Gate B crowd density at 85%"
    reasoning, tools_called, status = run_commander_agent(trigger)
    
    assert status == "MOCK_SUCCESS"
    assert len(tools_called) == 2
    
    # Check that reroute_fans was called with correct parameters
    tool_names = [t["name"] for t in tools_called]
    assert "reroute_fans" in tool_names
    assert "send_multilingual_alert" in tool_names
    
    # Ensure correct arguments were passed
    reroute_arg = next(t for t in tools_called if t["name"] == "reroute_fans")["args"]
    assert reroute_arg["from_zone"] == "zone_2"
    assert reroute_arg["to_zone"] == "zone_1"


# Test 2: Verify real GenAI agent manual loop handling when LLM triggers a tool call.
@mock.patch("app.agent.is_api_key_valid", return_value=True)
@mock.patch("app.agent.genai.Client")
@mock.patch("app.agent.TOOL_MAP")
def test_genai_agent_orchestration_tool_execution(mock_tool_map, mock_client_class, mock_key_valid):
    # Setup mock Client
    mock_client = mock.MagicMock()
    mock_client_class.return_value = mock_client
    
    # We simulate 2 turns:
    # Turn 0: LLM decides to call get_zone_status
    # Turn 1: LLM outputs reasoning and finishes
    
    # Mock response 1 (calls get_zone_status)
    mock_call = mock.MagicMock()
    mock_call.name = "get_zone_status"
    mock_call.args = {"zone_id": "zone_2"}
    
    mock_candidate_1 = mock.MagicMock()
    mock_candidate_1.content = types.Content(role="model", parts=[])
    
    mock_response_1 = mock.MagicMock()
    mock_response_1.function_calls = [mock_call]
    mock_response_1.candidates = [mock_candidate_1]
    
    # Mock response 2 (finishes)
    mock_response_2 = mock.MagicMock()
    mock_response_2.function_calls = []
    mock_response_2.text = "Gate B density is critical. I have evaluated its status."
    
    mock_client.models.generate_content.side_effect = [mock_response_1, mock_response_2]
    
    # Mock actual tool function in the tool map
    mock_get_zone_status = mock.MagicMock(return_value={"crowd_density": 85})
    mock_tool_map.__getitem__.side_effect = lambda key: mock_get_zone_status if key == "get_zone_status" else None
    mock_tool_map.__contains__.side_effect = lambda key: key == "get_zone_status"
    
    trigger = "Occupancy Warning"
    reasoning, tools_called, status = run_commander_agent(trigger)
    
    assert status == "SUCCESS"
    assert reasoning == "Gate B density is critical. I have evaluated its status."
    assert len(tools_called) == 1
    assert tools_called[0]["name"] == "get_zone_status"
    assert tools_called[0]["args"] == {"zone_id": "zone_2"}
    assert tools_called[0]["result"] == {"crowd_density": 85}
    
    # Verify generate_content was called twice
    assert mock_client.models.generate_content.call_count == 2


# Test 3: Verify human-in-the-loop pending action creation, execution on approval, and prevention on dismissal.
@mock.patch("app.agent.is_api_key_valid", return_value=True)
@mock.patch("app.agent.genai.Client")
def test_human_in_the_loop_pending_flow(mock_client_class, mock_key_valid):
    from app import logger
    
    # Reset logger pending actions
    logger.clear_pending_actions()
    
    mock_client = mock.MagicMock()
    mock_client_class.return_value = mock_client
    
    # Mock LLM calls: proposes reroute_fans (ACTION tool)
    mock_call = mock.MagicMock()
    mock_call.name = "reroute_fans"
    mock_call.args = {"from_zone": "zone_2", "to_zone": "zone_1", "reason": "Test congestion"}
    
    mock_candidate = mock.MagicMock()
    mock_candidate.content = types.Content(role="model", parts=[])
    
    mock_response = mock.MagicMock()
    mock_response.function_calls = [mock_call]
    mock_response.candidates = [mock_candidate]
    
    mock_client.models.generate_content.return_value = mock_response
    
    # Trigger the agent
    trigger = "Test Trigger"
    reasoning, tools_called, status = run_commander_agent(trigger)
    
    # Assert it gets intercepted and marked PENDING_APPROVAL
    assert status == "PENDING_APPROVAL"
    assert len(tools_called) == 1
    assert tools_called[0]["result"] == "AWAITING_APPROVAL"
    
    # Assert pending action record exists in logger
    pending_list = logger.get_pending_actions()
    assert len(pending_list) == 1
    pending_action = pending_list[0]
    assert pending_action["tool_name"] == "reroute_fans"
    assert pending_action["args"] == {"from_zone": "zone_2", "to_zone": "zone_1", "reason": "Test congestion"}
    assert pending_action["status"] == "pending"
    
    # Mock the tool call execution
    from app.agent import TOOL_MAP
    with mock.patch.dict(TOOL_MAP, {"reroute_fans": mock.MagicMock(return_value={"status": "Success"})}):
        # Now simulate approving the pending action via main.py code path
        action_id = pending_action["id"]
        from app.main import approve_pending_action, ResolvePendingRequest
        req = ResolvePendingRequest(id=action_id)
        res = approve_pending_action(req)
        
        assert res["status"] == "success"
        # Verify the mock tool was executed
        assert TOOL_MAP["reroute_fans"].call_count == 1
        TOOL_MAP["reroute_fans"].assert_called_with(from_zone="zone_2", to_zone="zone_1", reason="Test congestion")
        
        # Verify pending action is resolved (status updated, no longer returned by get_pending_actions)
        assert len(logger.get_pending_actions()) == 0


# Test 4: Verify trend-based predictive alerts are triggered before crossing the 75% threshold
import asyncio

@mock.patch("app.telemetry.read_stadium_status")
@mock.patch("app.telemetry.write_stadium_status")
@mock.patch("app.telemetry.read_transport_status", return_value=MOCK_TRANSPORT)
@mock.patch("app.telemetry.write_transport_status")
@mock.patch("app.telemetry.run_commander_agent")
def test_predictive_alert_on_rising_trend(
    mock_run_agent, mock_write_trans, mock_read_trans, mock_write_stadium, mock_read_stadium
):
    from app import telemetry
    
    # Reset history & seed with a synthetic rising trend under 75% (50% -> 58% -> 66%)
    telemetry._density_history = {"zone_1": [50, 58, 66]}
    
    # Current reading is 74% (still under 75%), but rising +8% per tick.
    # Projected next tick is 82% (crosses 75% critical threshold)
    mock_read_stadium.return_value = {
        "zone_1": {
            "id": "zone_1",
            "name": "Gate A (North Entrance)",
            "crowd_density": 74,
            "gate_queue_time_mins": 0,
            "weather": {"temp_c": 24, "condition": "Sunny", "humidity_percent": 60},
            "incident_reports": [],
            "alerts": []
        }
    }
    
    mock_run_agent.return_value = ("Proposed action", [], "SUCCESS")
    
    # We patch random.choice to return 0 so the density stays exactly at 74% on this simulated tick
    with mock.patch("random.choice", return_value=0):
        # We also patch asyncio.sleep to break the infinite loop after 1 tick
        async def mock_sleep(seconds):
            raise GeneratorExit()
            
        with mock.patch("asyncio.sleep", side_effect=mock_sleep):
            try:
                # Run the loop (it will run exactly 1 iteration and then exit when sleep is called)
                asyncio.run(telemetry.telemetry_simulation_loop())
            except GeneratorExit:
                pass
                
    # Verify that run_commander_agent was called
    assert mock_run_agent.call_count == 1
    call_args = mock_run_agent.call_args[0][0]
    
    # Verify that the trigger is indeed predictive and contains trajectory trend text
    assert "Predictive Occupancy Alert" in call_args
    assert "rising at an average of +8.0% per tick" in call_args
    assert "Projected to cross critical threshold" in call_args
