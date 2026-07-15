# StadiumOS 🏟️

**StadiumOS** is an agentic GenAI control tower for FIFA World Cup 2026 stadium operations. It acts as an autonomous operational brain that monitors live stadium telemetry (crowd density, gate queue wait times, and shuttle/train transit statuses) and takes proactive, real-time actions using Gemini API's native function calling.

## 🎯 The Chosen Vertical: Real-time Operational Intelligence
In high-stakes sports operations like the FIFA World Cup, traditional dashboards are passive and depend entirely on human operators reading metrics and manual coordination. **StadiumOS** addresses this by introducing an autonomous orchestrator. The agent reasons over IoT/CCTV sensor telemetry, identifies issues (e.g. gate bottlenecks, accessibility requests, transit delays), and executes tools in real-time while streaming its full decision trace to a central command dashboard.

---

## 🏗️ Architectural Choice: Orchestrator + Tools vs. Plain Chatbot

| Feature | Plain Chatbot | StadiumOS Agentic Orchestrator |
|:---|:---|:---|
| **Interaction** | Passive (only responds when spoken to). | Active (evaluates telemetry ticks autonomously). |
| **Data Access** | Static or limited to user chat context. | Direct access to stadium and transport data feeds via tools. |
| **Actionability**| Cannot affect the real world. | Takes concrete actions (rerouting fans, dispatching assistance, logging sustainability measures). |
| **Multilingual** | Translates chat messages on the fly. | Translates public stadium displays and coordinates localized broadcasts. |

### System Architecture Diagram
```mermaid
graph TD
    subgraph Frontend [React + Tailwind CSS]
        UI[Dashboard / Control Tower]
        Fan[Fan Chat Portal]
    end

    subgraph Backend [Python FastAPI]
        API[FastAPI Endpoints]
        WS[WebSocket Log Streamer]
        Tele[Simulated Telemetry Thread]
        Agent[Commander Agent / Gemini API]
        Tools[Single-Responsibility Tools]
        DB[(In-Memory JSON Mock DB)]
    end

    Tele -- Updates -- DB
    Tele -- Telemetry Trigger -- Agent
    Agent -- Calls -- Tools
    Tools -- Modifies -- DB
    Agent -- Logs Decision -- WS
    WS -- Real-time Stream -- UI
    Fan -- REST -- API
    API -- Reads -- DB
```

---

## 🛠️ Project Setup

### Prerequisites
- Python 3.9+
- Node.js v18+
- A Gemini API Key (Optional: falling back to rule-based mock agent mode if not provided).

### 1. Environment Configuration
Copy the `.env.example` file to `.env` in the root folder:
```bash
cp .env.example .env
```
Open `.env` and fill in your Gemini API key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
TELEMETRY_TICK_RATE=10
```

### 2. Backend Installation & Start
```bash
# Create python virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install requirements
pip install -r backend/requirements.txt

# Start backend server
python3 backend/run.py
```
The backend API server will run at `http://localhost:8000`.

### 3. Frontend Installation & Start
Open a new terminal tab:
```bash
# Navigate to frontend folder
cd frontend

# Install node dependencies
npm install

# Start Vite React dev server
npm run dev
```
The React dashboard will run at `http://localhost:5173`. Open your browser and navigate to:
- Control Tower: [http://localhost:5173/control-tower](http://localhost:5173/control-tower)
- Fan Portal: [http://localhost:5173/fan](http://localhost:5173/fan)

### 4. Running Backend Tests
Execute the unit test suite inside the root directory:
```bash
./venv/bin/python3 -m pytest backend/tests/
```

---

## ⚡ Worked Example: Telemetry Spike -> Agent Decision Trace

1. **Telemetry Spike**: The background simulation tick increases the crowd density in `Gate B (South Entrance)` to **82%**, crossing the **75% warning threshold**.
2. **Trigger Detected**: The background task registers the condition and issues a trigger to the Commander agent:
   > *"Occupancy Alert: Gate B (South Entrance) crowd density at 82% (exceeds threshold 75%)"*
3. **Agent Reasoning**: The agent receives the alert, runs its routine `get_all_zones_summary()` to identify safe routing destinations (finding `Concourse East` at 35% density), and formulates its plan.
4. **Tool Execution**: The Commander agent executes:
   - `reroute_fans(from_zone="zone_2", to_zone="zone_4", reason="Overcrowding at Gate B")`
   - `send_multilingual_alert(zone_id="zone_2", message="Crowd congestion warning. Please check nearby screens.", languages=["es", "fr"])`
5. **UI Update**: The database updates. In the UI, the heatmap colors for Gate B drop down, and the terminal log streams the trace via WebSockets:
   ```json
   {
     "trigger": "Occupancy Alert: Gate B (South Entrance) crowd density at 82%",
     "reasoning": "Detected crowd density crossing 75% in Gate B. I have initiated crowd diversion to Concourse East and broadcasted multilingual safety warnings to Gate B.",
     "tools_called": [
       { "name": "reroute_fans", "args": { "from_zone": "zone_2", "to_zone": "zone_4" } },
       { "name": "send_multilingual_alert", "args": { "zone_id": "zone_2", "languages": ["es", "fr"] } }
     ]
   }
   ```

---

## 🔍 Assumptions Made
1. **Telemetry Streams**: The simulated telemetry loop stands in for real-time CCTV crowd counting software and IoT gate sensors.
2. **Databases**: Simple file-locked JSON files under `backend/data/` act as an in-memory database suitable for prototyping.
3. **Languages**: Translations for standard safety broadcasts are mapped inside the `send_multilingual_alert` tool, representing a connection to an enterprise translation localization dictionary.
4. **Mock Agent Mode**: If `GEMINI_API_KEY` is not present, the system defaults to local heuristic logic to allow immediate out-of-the-box evaluation.
