import os
import json
import datetime
from .db_helper import DATA_DIR, _file_lock

SUSTAINABILITY_FILE = os.path.join(DATA_DIR, "sustainability_log.json")

def log_sustainability_action(action: str, impact_estimate: str) -> dict:
    """
    Log a stadium sustainability action (e.g., HVAC temperature adjustments, solar grid optimization, water recycling).
    
    Args:
        action (str): Description of the sustainability action taken.
        impact_estimate (str): Estimated impact of the action (e.g., '15% energy reduction', '20kg CO2 saved').
        
    Returns:
        dict: A summary of the sustainability log entry.
    """
    if not action or not impact_estimate:
        return {"error": "Both action and impact_estimate must be provided."}
        
    entry = {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "action": action,
        "impact_estimate": impact_estimate
    }
    
    with _file_lock:
        logs = []
        if os.path.exists(SUSTAINABILITY_FILE):
            try:
                with open(SUSTAINABILITY_FILE, "r") as f:
                    logs = json.load(f)
            except Exception:
                logs = []
                
        logs.append(entry)
        
        try:
            with open(SUSTAINABILITY_FILE, "w") as f:
                json.dump(logs, f, indent=2)
        except Exception as e:
            return {"error": f"Failed to write sustainability log: {e}"}
            
    return {
        "status": "Success",
        "message": f"Sustainability action logged successfully: {action}.",
        "logged_entry": entry
    }
