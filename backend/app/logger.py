import datetime
from typing import List, Dict, Any, Callable
import asyncio

# In-memory log storage
_decision_logs: List[Dict[str, Any]] = []

# Active WebSocket broadcast listeners
_listeners: List[Callable[[Dict[str, Any]], Any]] = []

def add_log(trigger: str, reasoning: str, tools_called: List[Dict[str, Any]], result: str) -> Dict[str, Any]:
    """
    Appends a new decision log entry and notifies all listeners.
    """
    entry = {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "trigger": trigger,
        "reasoning": reasoning,
        "tools_called": tools_called,
        "result": result
    }
    _decision_logs.append(entry)
    
    # Keep the log size bounded (e.g. last 100 entries)
    if len(_decision_logs) > 100:
        _decision_logs.pop(0)
        
    # Notify listeners (e.g., WebSockets)
    for listener in _listeners:
        try:
            # If it's a coroutine, we run it in the event loop; otherwise call it directly
            if asyncio.iscoroutinefunction(listener):
                asyncio.create_task(listener(entry))
            else:
                listener(entry)
        except Exception as e:
            print(f"Error calling log listener: {e}")
            
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

def register_listener(callback: Callable[[Dict[str, Any]], Any]) -> None:
    """
    Registers a callback to receive logs in real-time.
    """
    if callback not in _listeners:
        _listeners.append(callback)

def unregister_listener(callback: Callable[[Dict[str, Any]], Any]) -> None:
    """
    Unregisters a callback.
    """
    if callback in _listeners:
        _listeners.remove(callback)
