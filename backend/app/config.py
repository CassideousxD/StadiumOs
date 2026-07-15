import os
from dotenv import load_dotenv

# Load local .env file
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
TELEMETRY_TICK_RATE = int(os.getenv("TELEMETRY_TICK_RATE", "10"))

# Check for API key and print a warning if missing
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is not set. The GenAI features will not work properly.")
