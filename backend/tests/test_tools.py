import pytest
from unittest import mock
import sys

# Ensure all tool modules are loaded into sys.modules by importing app.tools
import app.tools

# Fetch the actual module objects directly from sys.modules
get_zone_status_mod = sys.modules["app.tools.get_zone_status"]
get_all_zones_summary_mod = sys.modules["app.tools.get_all_zones_summary"]
get_transport_status_mod = sys.modules["app.tools.get_transport_status"]
reroute_fans_mod = sys.modules["app.tools.reroute_fans"]
send_multilingual_alert_mod = sys.modules["app.tools.send_multilingual_alert"]
flag_accessibility_need_mod = sys.modules["app.tools.flag_accessibility_need"]
log_sustainability_action_mod = sys.modules["app.tools.log_sustainability_action"]

# Sample test data
MOCK_STADIUM = {
    "zone_1": {
        "id": "zone_1",
        "name": "Gate A (North Entrance)",
        "crowd_density": 45,
        "gate_queue_time_mins": 12,
        "weather": {"temp_c": 24, "condition": "Sunny", "humidity_percent": 60},
        "accessibility_alerts": [],
        "alerts": [],
        "incident_reports": []
    },
    "zone_2": {
        "id": "zone_2",
        "name": "Gate B (South Entrance)",
        "crowd_density": 80,
        "gate_queue_time_mins": 30,
        "weather": {"temp_c": 24, "condition": "Sunny", "humidity_percent": 60},
        "accessibility_alerts": [],
        "alerts": [],
        "incident_reports": []
    }
}

MOCK_TRANSPORT = {
    "shuttle_a": {
        "route_id": "shuttle_a",
        "name": "Shuttle Bus A",
        "status": "Normal",
        "load_percentage": 40,
        "estimated_wait_time_mins": 5
    }
}

# 1. Test get_zone_status
@mock.patch.object(get_zone_status_mod, "read_stadium_status", return_value=MOCK_STADIUM)
def test_get_zone_status(mock_read):
    # Valid zone
    res = get_zone_status_mod.get_zone_status("zone_1")
    assert "error" not in res
    assert res["name"] == "Gate A (North Entrance)"
    assert res["crowd_density"] == 45

    # Invalid zone
    res_err = get_zone_status_mod.get_zone_status("invalid_zone")
    assert "error" in res_err
    assert "invalid_zone" in res_err["error"]

# 2. Test get_all_zones_summary
@mock.patch.object(get_all_zones_summary_mod, "read_stadium_status", return_value=MOCK_STADIUM)
def test_get_all_zones_summary(mock_read):
    res = get_all_zones_summary_mod.get_all_zones_summary()
    assert "zone_1" in res
    assert "zone_2" in res
    assert res["zone_1"]["crowd_density"] == 45
    assert res["zone_2"]["gate_queue_time_mins"] == 30

# 3. Test get_transport_status
@mock.patch.object(get_transport_status_mod, "read_transport_status", return_value=MOCK_TRANSPORT)
def test_get_transport_status(mock_read):
    res = get_transport_status_mod.get_transport_status()
    assert "shuttle_a" in res
    assert res["shuttle_a"]["load_percentage"] == 40

# 4. Test reroute_fans
@mock.patch.object(reroute_fans_mod, "write_stadium_status")
@mock.patch.object(reroute_fans_mod, "read_stadium_status")
def test_reroute_fans(mock_read, mock_write):
    mock_read.return_value = MOCK_STADIUM.copy()
    res = reroute_fans_mod.reroute_fans(from_zone="zone_2", to_zone="zone_1", reason="Gate B crowding relief")
    assert res["status"] == "Success"
    assert res["from_zone"]["new_density"] == 65  # 80 - 15
    assert res["to_zone"]["new_density"] == 60    # 45 + 15
    mock_write.assert_called_once()

# 5. Test send_multilingual_alert
@mock.patch.object(send_multilingual_alert_mod, "write_stadium_status")
@mock.patch.object(send_multilingual_alert_mod, "read_stadium_status")
def test_send_multilingual_alert(mock_read, mock_write):
    mock_read.return_value = MOCK_STADIUM.copy()
    res = send_multilingual_alert_mod.send_multilingual_alert(zone_id="zone_1", message="Caution: High crowd density.", languages=["es", "fr"])
    assert res["status"] == "Success"
    alert = res["alert"]
    assert alert["original_message"] == "Caution: High crowd density."
    assert alert["translations"]["es"] == "Precaución: Alta densidad de multitud."
    assert alert["translations"]["fr"] == "Attention: Forte densité de foule."
    mock_write.assert_called_once()

# 6. Test flag_accessibility_need
@mock.patch.object(flag_accessibility_need_mod, "write_stadium_status")
@mock.patch.object(flag_accessibility_need_mod, "read_stadium_status")
def test_flag_accessibility_need(mock_read, mock_write):
    mock_read.return_value = MOCK_STADIUM.copy()
    res = flag_accessibility_need_mod.flag_accessibility_need(zone_id="zone_1", need_type="wheelchair_escalation")
    assert res["status"] == "Success"
    assert res["details"]["need_type"] == "wheelchair_escalation"
    mock_write.assert_called_once()

# 7. Test log_sustainability_action
@mock.patch.object(log_sustainability_action_mod, "SUSTAINABILITY_FILE", "/tmp/sustainability_log_test.json")
@mock.patch.object(log_sustainability_action_mod, "open", new_callable=mock.mock_open)
def test_log_sustainability_action(mock_open):
    # Mock exists check to avoid looking up actual file
    with mock.patch("os.path.exists", return_value=False):
        res = log_sustainability_action_mod.log_sustainability_action(action="Reduced concourse lighting", impact_estimate="Saved 5kW")
        assert res["status"] == "Success"
        assert res["logged_entry"]["action"] == "Reduced concourse lighting"
        mock_open.assert_called_once()
