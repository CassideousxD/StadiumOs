import asyncio
import random
import datetime
from .tools.db_helper import read_stadium_status, write_stadium_status, read_transport_status, write_transport_status
from .agent import run_commander_agent
from . import logger
from . import config

# Rolling history of crowd densities (up to 6 ticks)
# Format: {zone_id: [density1, density2, ...]}
_density_history = {}

# List of pending incidents to inject on the next loop tick
_pending_incidents = []

# Global flag to pause/resume the simulation loop
is_paused = False

def inject_incident(description: str):
    """
    Queue a free-text incident report to be processed on the next telemetry tick.
    """
    _pending_incidents.append(description)

async def telemetry_simulation_loop():
    """
    Background simulation loop. Fluctuates crowd levels and fires agent decision loops.
    """
    print(f"Telemetry simulation loop started. Tick rate: {config.TELEMETRY_TICK_RATE}s")
    tick_counter = 0
    
    while True:
        if is_paused:
            await asyncio.sleep(1)
            continue
            
        try:
            # 1. Read latest statuses
            stadium = read_stadium_status()
            transport = read_transport_status()
            
            if not stadium:
                # If database empty or uninitialized, wait and retry
                await asyncio.sleep(config.TELEMETRY_TICK_RATE)
                continue
                
            # 2. Simulate crowd level and wait time fluctuations
            for zone_id, zone_data in stadium.items():
                # Fluctuates density (+/- 3 points)
                d_delta = random.choice([-3, -2, -1, 0, 1, 2, 3])
                zone_data["crowd_density"] = max(15, min(95, zone_data["crowd_density"] + d_delta))
                
                # Fluctuates gate queue time if it is an entrance gate
                if "gate" in zone_id or "Gate" in zone_data["name"]:
                    q_delta = random.choice([-2, -1, 0, 1, 2])
                    zone_data["gate_queue_time_mins"] = max(3, min(65, zone_data["gate_queue_time_mins"] + q_delta))
                    
            # Fluctuate transport wait times and passenger loads
            for route_id, route_data in transport.items():
                l_delta = random.choice([-4, -2, 0, 2, 4])
                route_data["load_percentage"] = max(10, min(98, route_data["load_percentage"] + l_delta))
                route_data["estimated_wait_time_mins"] = max(1, int(route_data["load_percentage"] / 10) + random.choice([-1, 0, 1]))
                
            # Save the updated telemetry states
            write_stadium_status(stadium)
            write_transport_status(transport)
            
            # Record density history
            for zone_id, zone_data in stadium.items():
                if zone_id not in _density_history:
                    _density_history[zone_id] = []
                _density_history[zone_id].append(zone_data["crowd_density"])
                if len(_density_history[zone_id]) > 6:
                    _density_history[zone_id].pop(0)
                    
            # Compute average rate of change per zone
            trends = {}
            for zone_id, history in _density_history.items():
                if len(history) < 2:
                    trends[zone_id] = 0.0
                else:
                    deltas = [history[i] - history[i-1] for i in range(1, len(history))]
                    trends[zone_id] = sum(deltas) / len(deltas)
            
            # 3. Determine if there's an incident or threshold alert trigger
            trigger = ""
            is_predictive = False
            
            # Scenario A: Pending Incident injection
            if _pending_incidents:
                incident_desc = _pending_incidents.pop(0)
                
                # Match incident description to a zone by keyword
                target_zone = "zone_1"
                for z_id, z_data in stadium.items():
                    if z_id in incident_desc.lower() or z_data["name"].lower() in incident_desc.lower():
                        target_zone = z_id
                        break
                        
                # Update zone incident report log
                stadium = read_stadium_status()  # reload
                stadium[target_zone]["incident_reports"].append({
                    "description": incident_desc,
                    "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    "resolved": False
                })
                write_stadium_status(stadium)
                
                trigger = f"New Incident Report in {stadium[target_zone]['name']}: '{incident_desc}'"
                
            # Scenario B: Overcrowding Threshold Check (>75% density)
            else:
                overcrowded_zone = None
                for z_id, z_data in stadium.items():
                    if z_data["crowd_density"] > 75:
                        overcrowded_zone = z_id
                        break
                        
                if overcrowded_zone:
                    trigger = f"Occupancy Alert: {stadium[overcrowded_zone]['name']} crowd density at {stadium[overcrowded_zone]['crowd_density']}% (exceeds warning threshold 75%)"
                
                # Scenario C: Trend-Based Predictive Alert (projects crossing 75% in <= 3 ticks)
                else:
                    predictive_zone = None
                    for z_id, z_data in stadium.items():
                        current_density = z_data["crowd_density"]
                        trend = trends.get(z_id, 0.0)
                        if current_density <= 75 and trend > 0:
                            projected = current_density + trend * 3
                            if projected >= 75:
                                predictive_zone = z_id
                                break
                    
                    if predictive_zone:
                        current_density = stadium[predictive_zone]["crowd_density"]
                        trend = trends[predictive_zone]
                        ticks_left = (75 - current_density) / trend if trend > 0 else 0
                        trigger = (
                            f"Predictive Occupancy Alert: {stadium[predictive_zone]['name']} "
                            f"crowd density is currently at {current_density}% but rising at an average of "
                            f"{trend:+.1f}% per tick. Projected to cross critical threshold (75%) in ~{ticks_left:.1f} ticks."
                        )
                        is_predictive = True
            
            # 4. Agent Decider Loop (Smart Filtering)
            if trigger:
                # Append trajectory trend context for all zones into the agent context
                trend_context_str = "\nZone Telemetry Trajectory Trends (average change per tick):\n"
                for z_id, z_data in stadium.items():
                    trend_val = trends.get(z_id, 0.0)
                    trend_context_str += f"- {z_data['name']}: {trend_val:+.1f}%/tick (current: {z_data['crowd_density']}%)\n"
                
                agent_trigger = trigger + "\n" + trend_context_str
                category = "predictive" if is_predictive else "reactive"
                
                print(f"Commander Agent invoked ({category.upper()})! Trigger: {trigger}")
                reasoning, tools_called, status = run_commander_agent(agent_trigger)
                logger.add_log(
                    trigger=trigger,
                    reasoning=reasoning,
                    tools_called=tools_called,
                    result=reasoning,
                    category=category
                )
            else:
                # 5. Routine Baseline (Runs every 4 ticks to show active monitor updates or logs)
                tick_counter += 1
                if tick_counter >= 4:
                    trigger = "Routine Scan: All stadium zones occupancy levels within safe limits."
                    
                    trend_context_str = "\nZone Telemetry Trajectory Trends (average change per tick):\n"
                    for z_id, z_data in stadium.items():
                        trend_val = trends.get(z_id, 0.0)
                        trend_context_str += f"- {z_data['name']}: {trend_val:+.1f}%/tick (current: {z_data['crowd_density']}%)\n"
                    
                    agent_trigger = trigger + "\n" + trend_context_str
                    print("Commander Agent running routine efficiency optimization...")
                    reasoning, tools_called, status = run_commander_agent(agent_trigger)
                    logger.add_log(
                        trigger=trigger,
                        reasoning=reasoning,
                        tools_called=tools_called,
                        result=reasoning,
                        category="routine"
                    )
                    tick_counter = 0
                    
        except Exception as e:
            print(f"Error in telemetry simulation: {e}")
            
        await asyncio.sleep(config.TELEMETRY_TICK_RATE)
