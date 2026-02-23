def detect_intent(text: str):
    text = text.lower().strip()

    if any(x in text for x in ["hi", "hello", "hey"]):
        return "greeting"
    
    if "moodsync" in text or "how does" in text or "how do i use" in text:
        return "moodsync_explain"
    
    if any(x in text for x in ["suggest", "activity", "recommend"]):
        return "suggest_activity"
    
    if any(x in text for x in ["help", "sad", "down", "anxious", "low mood", "bad mood"]):
        return "help_mood"
    
    return "fallback"