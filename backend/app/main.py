import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os

from . import telemetry
from . import logger
from . import config
from .agent import run_fan_agent, is_api_key_valid
from .tools.db_helper import read_stadium_status, read_transport_status, write_stadium_status, write_transport_status

app = FastAPI(title="StadiumOS API", description="Control Tower & Fan Assistant Telemetry API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For hackathon/development convenience
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request bodies
class IncidentRequest(BaseModel):
    description: str

class FanQueryRequest(BaseModel):
    question: str

class SimulationToggleRequest(BaseModel):
    paused: bool

# Active WebSocket connections list
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        # Send initial logs history on connection
        logs = logger.get_logs()
        await websocket.send_json({"type": "history", "logs": logs})

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # Handle dead connections gracefully
                pass

manager = ConnectionManager()

# Hook the logger callback to WebSocket broadcast
async def websocket_log_listener(new_log_entry: dict):
    await manager.broadcast({"type": "new_log", "log": new_log_entry})

@app.on_event("startup")
async def startup_event():
    # Register the logger listener
    logger.register_listener(websocket_log_listener)
    # Start the simulation background loop
    asyncio.create_task(telemetry.telemetry_simulation_loop())

@app.on_event("shutdown")
def shutdown_event():
    logger.unregister_listener(websocket_log_listener)

# --- REST ENDPOINTS ---

@app.get("/api/status")
def get_stadium_status():
    """
    Fetch the live telemetry status of all zones and transport systems.
    """
    stadium = read_stadium_status()
    transport = read_transport_status()
    return {
        "stadium": stadium,
        "transport": transport,
        "simulation_paused": telemetry.is_paused,
        "api_key_configured": is_api_key_valid()
    }

@app.post("/api/incident")
def report_incident(req: IncidentRequest):
    """
    Inject a free-text incident report into the telemetry feed.
    """
    desc = req.description.strip()
    if not desc:
        raise HTTPException(status_code=400, detail="Incident description cannot be empty.")
    
    telemetry.inject_incident(desc)
    return {"status": "Success", "message": f"Incident queued: '{desc}'."}

@app.get("/api/logs")
def get_decision_logs():
    """
    Fetch all cached decision logs.
    """
    return logger.get_logs()

@app.post("/api/fan/chat")
def fan_chat(req: FanQueryRequest):
    """
    Process a fan query and return a response in the query's language.
    """
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
        
    reply = run_fan_agent(question)
    return {"reply": reply}

@app.post("/api/simulation/toggle")
def toggle_simulation(req: SimulationToggleRequest):
    """
    Pause or resume the telemetry simulation.
    """
    telemetry.is_paused = req.paused
    return {"status": "Success", "paused": telemetry.is_paused}

@app.post("/api/reset")
def reset_simulation_data():
    """
    Reset stadium and transport telemetry to default starting states.
    """
    # Define defaults
    default_stadium = {
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
            "crowd_density": 50,
            "gate_queue_time_mins": 15,
            "weather": {"temp_c": 24, "condition": "Sunny", "humidity_percent": 60},
            "accessibility_alerts": [],
            "alerts": [],
            "incident_reports": []
        },
        "zone_3": {
            "id": "zone_3",
            "name": "Concourse West (Food & Drinks)",
            "crowd_density": 65,
            "gate_queue_time_mins": 0,
            "weather": {"temp_c": 22, "condition": "Air Conditioned", "humidity_percent": 50},
            "accessibility_alerts": [],
            "alerts": [],
            "incident_reports": []
        },
        "zone_4": {
            "id": "zone_4",
            "name": "Concourse East (Merchandise)",
            "crowd_density": 35,
            "gate_queue_time_mins": 0,
            "weather": {"temp_c": 22, "condition": "Air Conditioned", "humidity_percent": 50},
            "accessibility_alerts": [],
            "alerts": [],
            "incident_reports": []
        },
        "zone_5": {
            "id": "zone_5",
            "name": "Grandstand North",
            "crowd_density": 55,
            "gate_queue_time_mins": 0,
            "weather": {"temp_c": 24, "condition": "Sunny", "humidity_percent": 60},
            "accessibility_alerts": [],
            "alerts": [],
            "incident_reports": []
        },
        "zone_6": {
            "id": "zone_6",
            "name": "Grandstand South",
            "crowd_density": 60,
            "gate_queue_time_mins": 0,
            "weather": {"temp_c": 24, "condition": "Sunny", "humidity_percent": 60},
            "accessibility_alerts": [],
            "alerts": [],
            "incident_reports": []
        }
    }
    
    default_transport = {
        "shuttle_a": {
            "route_id": "shuttle_a",
            "name": "Shuttle Bus A (West Terminal)",
            "status": "Normal",
            "load_percentage": 40,
            "estimated_wait_time_mins": 5
        },
        "shuttle_b": {
            "route_id": "shuttle_b",
            "name": "Shuttle Bus B (East Terminal)",
            "status": "Normal",
            "load_percentage": 50,
            "estimated_wait_time_mins": 7
        },
        "metro_line_1": {
            "route_id": "metro_line_1",
            "name": "Metro Line 1 (Express Train)",
            "status": "Normal",
            "load_percentage": 65,
            "estimated_wait_time_mins": 3
        },
        "park_ride_express": {
            "route_id": "park_ride_express",
            "name": "Park & Ride Express",
            "status": "Normal",
            "load_percentage": 30,
            "estimated_wait_time_mins": 10
        }
    }
    
    write_stadium_status(default_stadium)
    write_transport_status(default_transport)
    logger.clear_logs()
    
    # Remove sustainability log if exists
    sustain_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "sustainability_log.json")
    if os.path.exists(sustain_path):
        try:
            os.remove(sustain_path)
        except Exception:
            pass
            
    return {"status": "Success", "message": "Simulation states reset successfully."}

# --- WEBSOCKET ENDPOINT ---

@app.websocket("/ws/logs")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time log streaming.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; discard any client input messages
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
