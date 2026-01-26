def detect_intent(text: str):
    text = text.lower()

    if any(x in text for x in ["hi", "hello", "hey"]):
        return "greeting"
    
    if "moodsync" in text:
        return "moodsync_explain"
    
    if "suggest" in text or "activity" in text:
        return "suggest_activity"
    
    if any(x in text for x in ["help", "sad", "down", "anxious"]):
        return "help_mood"
    
    return "fallback"