import os
import datetime
from google import genai
from google.genai import types
from . import config
from .tools import (
    get_zone_status,
    get_all_zones_summary,
    get_transport_status,
    reroute_fans,
    send_multilingual_alert,
    flag_accessibility_need,
    log_sustainability_action
)

# Tool Map for manual execution in the Commander Agent
TOOL_MAP = {
    "get_zone_status": get_zone_status,
    "get_all_zones_summary": get_all_zones_summary,
    "get_transport_status": get_transport_status,
    "reroute_fans": reroute_fans,
    "send_multilingual_alert": send_multilingual_alert,
    "flag_accessibility_need": flag_accessibility_need,
    "log_sustainability_action": log_sustainability_action
}

COMMANDER_SYSTEM_INSTRUCTION = """
You are the "Commander" agent, the central brain of StadiumOS, the real-time AI control tower for the FIFA World Cup 2026 stadium operations.
Your job is to monitor stadium zones and transport status, identify operational issues (like bottlenecks, overcrowding, accessibility requests, or high energy waste), and take immediate action using your available tools.

Operational Rules:
1. If any zone's crowd density exceeds 75%, it is considered overcrowded. You MUST reroute fans from that zone to a less crowded zone (density < 50%) using `reroute_fans` and send a multilingual safety alert to the congested zone using `send_multilingual_alert` in English, Spanish (es), and French (fr).
2. If there is a free-text incident report, read it and take corresponding action. E.g., if a fan needs accessibility help, call `flag_accessibility_need`. If there is a crowd issue, reroute or alert.
3. If you take a sustainability action (like adjusting cooling, optimizing power, or recycling due to calm conditions), log it using `log_sustainability_action`.
4. You must always run `get_all_zones_summary` first to check the current stadium state before making routing decisions, unless the trigger already contains all necessary information.
5. Keep your final response clear and professional, detailing:
   - What triggered your action
   - What your reasoning was
   - What tools you called and their outcomes.
"""

FAN_SYSTEM_INSTRUCTION = """
You are the friendly, multilingual "Fan Assistant" for StadiumOS.
Your job is to answer questions from fans visiting the stadium.
You have access to read-only tools to retrieve live information:
- `get_zone_status`
- `get_all_zones_summary`
- `get_transport_status`

Rules:
1. You MUST ONLY use the read-only tools listed above. Never make up data.
2. DO NOT call any action tools (like `reroute_fans`, `send_multilingual_alert`, `flag_accessibility_need`, or `log_sustainability_action`). If you need to suggest a rerouting, just explain it in words, do not call the tool.
3. Identify the fan's language and respond in that exact language. E.g., if they ask in Spanish, reply in Spanish. If they ask in French, reply in French.
4. Be helpful, welcoming, and concise.
"""

def is_api_key_valid() -> bool:
    return bool(config.GEMINI_API_KEY) and config.GEMINI_API_KEY != "your_gemini_api_key_here"

def run_commander_agent(trigger: str) -> tuple[str, list[dict], str]:
    """
    Executes the Commander agent decision loop.
    
    Args:
        trigger: The event that triggered this execution (e.g. telemetry tick or incident report)
        
    Returns:
        tuple: (reasoning/response, tools_called_log, status)
    """
    if not is_api_key_valid():
        return run_mock_commander_agent(trigger)
        
    client = genai.Client()
    
    # Initialize history with the trigger
    contents = [types.Content(role="user", parts=[types.Part.from_text(text=trigger)])]
    tools_called = []
    reasoning = ""
    
    # Manual tool calling loop (max 5 turns)
    for turn in range(5):
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=COMMANDER_SYSTEM_INSTRUCTION,
                    tools=[
                        get_zone_status, get_all_zones_summary, get_transport_status,
                        reroute_fans, send_multilingual_alert, flag_accessibility_need,
                        log_sustainability_action
                    ],
                    automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True)
                )
            )
        except Exception as e:
            print(f"GenAI API Error: {e}")
            reasoning = f"GenAI API Error encountered: {e}"
            return reasoning, tools_called, "API_ERROR"
            
        # Check if the model wants to call tools
        if not response.function_calls:
            reasoning = response.text or ""
            break
            
        # Append model's response (tool call requests) to conversation history
        contents.append(response.candidates[0].content)
        
        # Execute the requested tools
        tool_response_parts = []
        for call in response.function_calls:
            name = call.name
            args = dict(call.args) if call.args else {}
            
            # Execute python tool function
            if name in TOOL_MAP:
                try:
                    result = TOOL_MAP[name](**args)
                except Exception as err:
                    result = {"error": f"Tool execution failed: {err}"}
            else:
                result = {"error": f"Tool '{name}' not found."}
                
            tools_called.append({
                "name": name,
                "args": args,
                "result": result
            })
            
            # Create a Part representing the function response
            tool_response_parts.append(
                types.Part.from_function_response(
                    name=name,
                    response={"result": result}
                )
            )
            
        # Append the tool results as a user turn
        contents.append(types.Content(role="user", parts=tool_response_parts))
        
    return reasoning, tools_called, "SUCCESS"

def run_fan_agent(question: str) -> str:
    """
    Answers a fan query using read-only tools and automatic function calling.
    Replies in the language of the query.
    """
    if not is_api_key_valid():
        return run_mock_fan_agent(question)
        
    client = genai.Client()
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=question,
            config=types.GenerateContentConfig(
                system_instruction=FAN_SYSTEM_INSTRUCTION,
                tools=[get_zone_status, get_all_zones_summary, get_transport_status],
            )
        )
        return response.text or "I apologize, but I could not formulate an answer."
    except Exception as e:
        return f"Error connecting to AI: {e}"

# --- MOCK FALLBACK AGENTS ---

def run_mock_commander_agent(trigger: str) -> tuple[str, list[dict], str]:
    """
    Fallback rule-based commander agent for testing when Gemini API key is missing.
    """
    tools_called = []
    reasoning = ""
    
    # Read stadium and transport data
    stadium = get_all_zones_summary()
    transport = get_transport_status()
    
    # 1. Check for accessibility incident triggers
    if "wheelchair" in trigger.lower() or "assistance" in trigger.lower() or "accessibility" in trigger.lower():
        # Find which zone
        target_zone = "zone_3"
        for z_id in stadium:
            if z_id in trigger:
                target_zone = z_id
                break
        res = flag_accessibility_need(zone_id=target_zone, need_type="wheelchair_escalation")
        tools_called.append({"name": "flag_accessibility_need", "args": {"zone_id": target_zone, "need_type": "wheelchair_escalation"}, "result": res})
        reasoning = f"[Mock AI] Identified accessibility request in {stadium[target_zone]['name']}. Dispatched the wheelchair assistance team immediately."
        
    # 2. Check for high density triggers
    else:
        overcrowded_zone = None
        for z_id, data in stadium.items():
            if data["crowd_density"] > 75:
                overcrowded_zone = z_id
                break
                
        if overcrowded_zone:
            # Find a cold zone
            cold_zone = "zone_4"
            for z_id, data in stadium.items():
                if data["crowd_density"] < 50 and z_id != overcrowded_zone:
                    cold_zone = z_id
                    break
            
            # Execute tools
            res_reroute = reroute_fans(from_zone=overcrowded_zone, to_zone=cold_zone, reason="Congestion relief")
            tools_called.append({"name": "reroute_fans", "args": {"from_zone": overcrowded_zone, "to_zone": cold_zone, "reason": "Congestion relief"}, "result": res_reroute})
            
            msg = "Crowd congestion warning. Please check nearby screens."
            res_alert = send_multilingual_alert(zone_id=overcrowded_zone, message=msg, languages=["es", "fr"])
            tools_called.append({"name": "send_multilingual_alert", "args": {"zone_id": overcrowded_zone, "message": msg, "languages": ["es", "fr"]}, "result": res_alert})
            
            reasoning = f"[Mock AI] Detected crowd density crossing 75% in {stadium[overcrowded_zone]['name']} ({stadium[overcrowded_zone]['crowd_density']}%). Initiated crowd diversion to {stadium[cold_zone]['name']} and broadcasted multilingual safety warnings."
        else:
            # Calm scenario - Sustainability action
            res_sus = log_sustainability_action(action="Optimized HVAC cooling cycles in Concourses", impact_estimate="Reduced carbon footprint by 15kg CO2")
            tools_called.append({"name": "log_sustainability_action", "args": {"action": "Optimized HVAC cooling cycles in Concourses", "impact_estimate": "Reduced carbon footprint by 15kg CO2"}, "result": res_sus})
            reasoning = "[Mock AI] All stadium zones are within safe occupancy limits. Logged energy conservation adjustments for environmental efficiency."
            
    return reasoning, tools_called, "MOCK_SUCCESS"

def run_mock_fan_agent(question: str) -> str:
    """
    Fallback fan agent when Gemini API key is missing.
    """
    q_lower = question.lower()
    stadium = get_all_zones_summary()
    transport = get_transport_status()
    
    # Simple language detection
    is_spanish = any(w in q_lower for w in ["hola", "transporte", "autobus", "metro", "donde", "estacion"])
    is_french = any(w in q_lower for w in ["bonjour", "transport", "bus", "metro", "où", "gare"])
    
    if is_spanish:
        if "transporte" in q_lower or "bus" in q_lower or "metro" in q_lower:
            shuttle = transport.get("shuttle_a", {})
            return f"Hola. Los transportes están funcionando normalmente. La línea Shuttle Bus A tiene un tiempo de espera de {shuttle.get('estimated_wait_time_mins', 5)} minutos."
        else:
            zone1 = stadium.get("zone_1", {})
            return f"Hola. La entrada norte ({zone1.get('name', 'Gate A')}) tiene un tiempo de espera de cola de {zone1.get('gate_queue_time_mins', 10)} minutos."
            
    elif is_french:
        if "transport" in q_lower or "bus" in q_lower or "metro" in q_lower:
            shuttle = transport.get("shuttle_a", {})
            return f"Bonjour. Les transports fonctionnent normalement. La navette A (Shuttle Bus A) a un temps d'attente de {shuttle.get('estimated_wait_time_mins', 5)} minutes."
        else:
            zone1 = stadium.get("zone_1", {})
            return f"Bonjour. L'entrée nord ({zone1.get('name', 'Gate A')}) a une file d'attente d'environ {zone1.get('gate_queue_time_mins', 10)} minutes."
            
    else:
        # English default
        if "transport" in q_lower or "bus" in q_lower or "shuttle" in q_lower or "train" in q_lower:
            shuttle = transport.get("shuttle_a", {})
            return f"Hello! Stadium transit routes are running smoothly. {shuttle.get('name', 'Shuttle A')} is currently at {shuttle.get('load_percentage', 40)}% load with a {shuttle.get('estimated_wait_time_mins', 5)} mins wait."
        else:
            zone1 = stadium.get("zone_1", {})
            return f"Hello! The North Entrance ({zone1.get('name', 'Gate A')}) has a queue time of {zone1.get('gate_queue_time_mins', 12)} minutes with crowd density at {zone1.get('crowd_density', 45)}%."
