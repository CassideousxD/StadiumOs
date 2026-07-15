import os
import json
import threading

# Paths to the mock JSON databases
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
STADIUM_FILE = os.path.join(DATA_DIR, "stadium_status.json")
TRANSPORT_FILE = os.path.join(DATA_DIR, "transport_status.json")

# Ensure directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# Lock for simple concurrency handling
_file_lock = threading.Lock()

def read_stadium_status() -> dict:
    with _file_lock:
        if not os.path.exists(STADIUM_FILE):
            return {}
        try:
            with open(STADIUM_FILE, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error reading stadium file: {e}")
            return {}

def write_stadium_status(data: dict) -> None:
    with _file_lock:
        try:
            with open(STADIUM_FILE, "w") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Error writing stadium file: {e}")

def read_transport_status() -> dict:
    with _file_lock:
        if not os.path.exists(TRANSPORT_FILE):
            return {}
        try:
            with open(TRANSPORT_FILE, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error reading transport file: {e}")
            return {}

def write_transport_status(data: dict) -> None:
    with _file_lock:
        try:
            with open(TRANSPORT_FILE, "w") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Error writing transport file: {e}")
