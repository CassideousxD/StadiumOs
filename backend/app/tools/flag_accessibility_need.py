import datetime
from .db_helper import read_stadium_status, write_stadium_status

def flag_accessibility_need(zone_id: str, need_type: str) -> dict:
    """
    Flags an accessibility need (e.g., wheelchair assistance, elevator priority, sensory room guide) in a specific zone.
    
    Args:
        zone_id (str): The ID of the zone (e.g. 'zone_1')
        need_type (str): Type of assistance required (e.g. 'wheelchair_escalation', 'elevator_dispatch', 'medical_shuttle')
        
    Returns:
        dict: Success confirmation with dispatch details.
    """
    if not zone_id or not need_type:
        return {"error": "zone_id and need_type must be provided."}
        
    stadium = read_stadium_status()
    if zone_id not in stadium:
        return {"error": f"Zone '{zone_id}' not found."}
        
    need_entry = {
        "need_id": f"need_{int(datetime.datetime.now(datetime.timezone.utc).timestamp())}",
        "need_type": need_type,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "resolved": False
    }
    
    stadium[zone_id]["accessibility_alerts"].append(need_entry)
    write_stadium_status(stadium)
    
    return {
        "status": "Success",
        "message": f"Accessibility alert '{need_type}' flagged for {stadium[zone_id]['name']}. Dispatching stadium assistance team.",
        "details": need_entry
    }
