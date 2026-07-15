import datetime
from typing import List
from .db_helper import read_stadium_status, write_stadium_status

# Basic translation mock helper for hackathon demonstration
MOCK_TRANSLATIONS = {
    "es": {
        "Attention: Please move to Gate A.": "Atención: Por favor, diríjase a la Puerta A.",
        "Caution: High crowd density.": "Precaución: Alta densidad de multitud.",
        "System check: operations normal.": "Prueba del sistema: operaciones normales.",
        "Crowd congestion warning. Please check nearby screens.": "Advertencia de congestión de multitud. Por favor revise las pantallas cercanas."
    },
    "fr": {
        "Attention: Please move to Gate A.": "Attention: Veuillez vous rendre à la porte A.",
        "Caution: High crowd density.": "Attention: Forte densité de foule.",
        "System check: operations normal.": "Vérification du système: opérations normales.",
        "Crowd congestion warning. Please check nearby screens.": "Avertissement de congestion de foule. Veuillez vérifier les écrans à proximité."
    },
    "de": {
        "Attention: Please move to Gate A.": "Achtung: Bitte begeben Sie sich zu Tor A.",
        "Caution: High crowd density.": "Vorsicht: Hohe Menschendichte.",
        "System check: operations normal.": "Systemprüfung: Normaler Betrieb.",
        "Crowd congestion warning. Please check nearby screens.": "Warnung vor Überfüllung. Bitte überprüfen Sie die Bildschirme in der Nähe."
    }
}

def translate_message(msg: str, lang: str) -> str:
    lang = lang.lower()
    if lang == "en":
        return msg
    # Fallback to dictionary translation, or simple prefix translation
    return MOCK_TRANSLATIONS.get(lang, {}).get(msg, f"[{lang.upper()}] {msg}")

def send_multilingual_alert(zone_id: str, message: str, languages: List[str]) -> dict:
    """
    Send a localized safety or routing alert to stadium displays and fans in a specific zone.
    
    Args:
        zone_id (str): The ID of the target zone (e.g. 'zone_1')
        message (str): The message in English
        languages (List[str]): List of language codes to translate into (e.g. ['es', 'fr'])
        
    Returns:
        dict: Status report containing the localized versions of the alerts.
    """
    if not zone_id or not message:
        return {"error": "zone_id and message are required."}
        
    stadium = read_stadium_status()
    if zone_id not in stadium:
        return {"error": f"Zone '{zone_id}' not found."}
        
    # Build multilingual translation dictionary
    translations = {"en": message}
    for lang in languages:
        translations[lang.lower()] = translate_message(message, lang)
        
    alert_entry = {
        "id": f"alert_{int(datetime.datetime.now(datetime.timezone.utc).timestamp())}",
        "original_message": message,
        "translations": translations,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    
    stadium[zone_id]["alerts"].append(alert_entry)
    write_stadium_status(stadium)
    
    return {
        "status": "Success",
        "message": f"Alert broadcasted to {stadium[zone_id]['name']}.",
        "alert": alert_entry
    }
