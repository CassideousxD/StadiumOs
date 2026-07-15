from .db_helper import read_transport_status

def get_transport_status() -> dict:
    """
    Get the status of all stadium shuttle buses and trains.
    
    Returns:
        dict: A dictionary mapping route IDs to route names, delay statuses, loads, and wait times.
    """
    return read_transport_status()
