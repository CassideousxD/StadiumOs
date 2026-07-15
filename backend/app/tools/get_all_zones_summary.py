from .db_helper import read_stadium_status

def get_all_zones_summary() -> dict:
    """
    Get a high-level summary of all zones in the stadium, listing their crowd densities and queue times.
    
    Returns:
        dict: A dictionary mapping zone IDs to their names, crowd densities, and queue times.
    """
    stadium = read_stadium_status()
    summary = {}
    for zone_id, zone_data in stadium.items():
        summary[zone_id] = {
            "name": zone_data["name"],
            "crowd_density": zone_data["crowd_density"],
            "gate_queue_time_mins": zone_data.get("gate_queue_time_mins", 0),
            "alert_count": len(zone_data.get("alerts", [])),
            "incident_count": len(zone_data.get("incident_reports", []))
        }
    return summary
