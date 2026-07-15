from .db_helper import read_stadium_status

def get_zone_status(zone_id: str) -> dict:
    """
    Get the current telemetry status (crowd density, queue time, weather, active alerts, incidents) of a specific stadium zone.
    
    Args:
        zone_id (str): The unique identifier of the zone (e.g. 'zone_1', 'zone_2')
        
    Returns:
        dict: A dictionary containing the status metrics of the zone, or an error dictionary.
    """
    stadium = read_stadium_status()
    if not zone_id:
        return {"error": "zone_id must be provided"}
    
    if zone_id not in stadium:
        return {
            "error": f"Zone '{zone_id}' not found.",
            "available_zones": list(stadium.keys())
        }
    return stadium[zone_id]
