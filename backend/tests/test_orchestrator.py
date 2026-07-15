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
