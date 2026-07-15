import datetime
from .db_helper import read_stadium_status, write_stadium_status

def reroute_fans(from_zone: str, to_zone: str, reason: str) -> dict:
    """
    Reroute fans from a congested zone to a less crowded zone.
    
    Args:
        from_zone (str): The ID of the zone to divert fans from (e.g., 'zone_1')
        to_zone (str): The ID of the destination zone (e.g., 'zone_2')
        reason (str): The reason for rerouting (e.g., 'Gate B overflow, redirect to Gate A')
        
    Returns:
        dict: A success message with updated crowd densities, or an error if zones are not found.
    """
    if not from_zone or not to_zone:
        return {"error": "Both from_zone and to_zone must be provided."}
        
    if from_zone == to_zone:
        return {"error": "Source and destination zones must be different."}
        
    stadium = read_stadium_status()
    if from_zone not in stadium:
        return {"error": f"Source zone '{from_zone}' not found."}
    if to_zone not in stadium:
        return {"error": f"Destination zone '{to_zone}' not found."}
        
    old_from = stadium[from_zone]["crowd_density"]
    old_to = stadium[to_zone]["crowd_density"]
    
    # Calculate amount to shift (e.g., 15 points, capped by current load)
    shift = min(15, old_from)
    
    stadium[from_zone]["crowd_density"] = max(0, old_from - shift)
    stadium[to_zone]["crowd_density"] = min(100, old_to + shift)
    
    # Record the alert on the source zone
    alert_msg = f"Crowd diversion in effect. Please proceed to {stadium[to_zone]['name']}. Reason: {reason}"
    stadium[from_zone]["alerts"].append({
        "type": "reroute",
        "message": alert_msg,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    })
    
    write_stadium_status(stadium)
    
    return {
        "status": "Success",
        "message": f"Successfully rerouted fans from {stadium[from_zone]['name']} to {stadium[to_zone]['name']}.",
        "reason": reason,
        "from_zone": {
            "id": from_zone,
            "name": stadium[from_zone]["name"],
            "previous_density": old_from,
            "new_density": stadium[from_zone]["crowd_density"]
        },
        "to_zone": {
            "id": to_zone,
            "name": stadium[to_zone]["name"],
            "previous_density": old_to,
            "new_density": stadium[to_zone]["crowd_density"]
        }
    }
