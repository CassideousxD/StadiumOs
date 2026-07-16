import datetime
from typing import List, Dict, Any, Callable
import asyncio

# In-memory log storage
_decision_logs: List[Dict[str, Any]] = []

# In-memory pending actions storage
_pending_actions: Dict[str, Dict[str, Any]] = {}

# Active WebSocket broadcast listeners
_listeners: List[Callable[[Dict[str, Any]], Any]] = []

def add_log(trigger: str, reasoning: str, tools_called: List[Dict[str, Any]], result: str, category: str = "reactive") -> Dict[str, Any]:
    """
    Appends a new decision log entry and notifies all listeners.
    """
    entry = {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "trigger": trigger,
        "reasoning": reasoning,
        "tools_called": tools_called,
        "result": result,
        "category": category
    }
    _decision_logs.append(entry)
    
    # Keep the log size bounded (e.g. last 100 entries)
    if len(_decision_logs) > 100:
        _decision_logs.pop(0)
        
    # Notify listeners (e.g., WebSockets) with structured event type
    notify_listeners({"type": "new_log", "log": entry})
            
    return entry

def get_logs() -> List[Dict[str, Any]]:
    """
    Returns all logged decisions.
    """
    return list(_decision_logs)

def clear_logs() -> None:
    """
    Clears all stored logs.
    """
    global _decision_logs
    _decision_logs = []

# --- PENDING ACTIONS MANAGEMENT (Human-in-the-Loop) ---

def add_pending_action(action: Dict[str, Any]) -> None:
    """
    Caches a pending action proposal and broadcasts it to listeners.
    """
    _pending_actions[action["id"]] = action
    notify_listeners({"type": "new_pending", "action": action})

def get_pending_actions() -> List[Dict[str, Any]]:
    """
    Retrieves all pending actions that are currently active.
    """
    return [act for act in _pending_actions.values() if act["status"] == "pending"]

def get_pending_action(action_id: str) -> Dict[str, Any]:
    """
    Fetch a single pending action by its ID.
    """
    return _pending_actions.get(action_id)

def resolve_pending_action(action_id: str, status: str) -> None:
    """
    Updates status and broadcasts the resolution event to WebSocket listeners.
    """
    if action_id in _pending_actions:
        _pending_actions[action_id]["status"] = status
        notify_listeners({"type": "resolved_pending", "id": action_id, "status": status})

def clear_pending_actions() -> None:
    """
    Resets all pending actions in memory.
    """
    global _pending_actions
    _pending_actions = {}

# --- LISTENER SYSTEM ---

def notify_listeners(event: Dict[str, Any]) -> None:
    """
    Helper to broadcast events to all active websocket callbacks.
    """
    for listener in _listeners:
        try:
            if asyncio.iscoroutinefunction(listener):
                asyncio.create_task(listener(event))
            else:
                listener(event)
        except Exception as e:
            print(f"Error calling log listener: {e}")

def register_listener(callback: Callable[[Dict[str, Any]], Any]) -> None:
    """
    Registers a callback to receive logs/events in real-time.
    """
    if callback not in _listeners:
        _listeners.append(callback)

def unregister_listener(callback: Callable[[Dict[str, Any]], Any]) -> None:
    """
    Unregisters a callback.
    """
    if callback in _listeners:
        _listeners.remove(callback)
