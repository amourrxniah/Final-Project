/* -------------------- AI LOGIC --------------------*/
import { Animated, Dimensions, Platform, Keyboard } from "react-native";
import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* -------------------- CONSTANTS --------------------*/
const SCREEN_HEIGHT = Dimensions.get("window").height;
const BACKEND_URL = "https://hatable-dana-divertedly.ngrok-free.dev/chat/";
const CHAT_STORAGE_KEY = "moodsync_chat_history";

const INTRO_TEXT =
    "Hi! I'm your MoodSync Assistant 👋\n\n" +
    "I can help you find activities, answer questions "+
    "or guide you through the app.\n\n"+
    "What would you like help with today?"
    
export const suggestions = [ 
    "Suggest an activity", 
    "How does MoodSync work?", 
    "Help me with my mood" 
];

export function useAIAssistant({ mood = "neutral" }) {

    /* ----- STATE ----- */
    const [chatOpen, setChatOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([])
    const [isTyping, setIsTyping] = useState(false);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [visibleSuggestions, setVisibleSuggestions] = useState(0);
    
    /* ----- REFS ----- */
    const scrollViewRef = useRef(null);
    const chatAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const keyboardOffset = useRef(new Animated.Value(0)).current;
    const aiBounce = useRef(new Animated.Value(0)).current;
    
    const sessionIdRef = useRef(Date.now().toString());
    const SESSION_ID = sessionIdRef.current;

    /* -------------------- TYPEWRITER EFFECT --------------------*/
    const typeAIMessage = (text, showSuggestions = false) => {
        if (!text || typeof text !== "string") return;
        
        const id = Date.now().toString();
        let index = 0;

        if (showSuggestions) { 
            setVisibleSuggestions(0); 
        }

        setMessages(prev => [
            ...prev, 
            { 
                id,
                from: "ai", 
                text: "",
                timestamp: new Date().toISOString(),
                showSuggestions
            }
        ]);

        setIsTyping(true);

        const interval = setInterval(() => {
            index++;

            setMessages(prev =>
                prev.map(m =>
                    m.id === id 
                        ? { ...m, text: text.slice(0, index) } 
                        : m
                )
            );
                scrollViewRef.current?.scrollToEnd({ animated: true });

                if (index >= text.length) {
                    clearInterval(interval);
                    setIsTyping(false);

                    if (showSuggestions) {
                        suggestions.forEach((_, i) => {
                            setTimeout(() => {
                                setVisibleSuggestions(v => v + 1);
                            }, 350 * (i + 1));
                        });
                    }
                }
            }, 28);
        };

    /* -------------------- SEND MESSAGE --------------------*/
    const sendMessage = async (text) => {
        if (!text?.trim() || isTyping) return;

        const userMsg = {
            id: Date.now().toString(),
            from: "user",
            text,
            timestamp: new Date().toISOString()
        };

        setInput(""); 
        setMessages((prev => [...prev, userMsg])); 
        const conversation = [...messages, userMsg];

        console.log("Sending message to AI");
        console.log("BACKEND_URL:", BACKEND_URL);
        console.log("SESSION_ID:", SESSION_ID);
        console.log("MOOD:", mood);
        console.log("MESSAGES:", conversation);
        
        try {
            const res = await fetch(BACKEND_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: SESSION_ID,
                    mood,
                    messages: conversation.map(m => ({
                        role: m.from === "user" ? "user" : "assistant",
                        content: m.text,
                    }))
                })
            });

            console.log("Response status:", res.status);

            const data = await res.json();

            console.log("AI RESPONSE DATA:", data);

            typeAIMessage(data.reply || data.response || data.messages || "Sorry, I didn't catch that 😅");
            //return data.reply;
        } catch (err) {
            console.error("AI request failed:", err)
            typeAIMessage("Hmm 😕 I had trouble replying just now. Try again — I'm still here!");
        }
    };

    /* -------------------- CHAT --------------------*/
    const openChat = async () => {
        setChatOpen(true);
        setIsLoadingAI(true);

        const stored = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        setMessages(parsed);
    
        Animated.timing(chatAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
        }).start();

        setTimeout(() => {
            setIsLoadingAI(false);

            if (parsed.length === 0) {
                typeAIMessage(INTRO_TEXT, true);
            }
        }, 600);
    };

    const closeChat = () => {
        Animated.timing(chatAnim, {
            toValue: SCREEN_HEIGHT,
            duration: 300,
            useNativeDriver: true
        }).start(() => setChatOpen(false));
    };

    const resetChat = () => {
        setMessages([]);
        setVisibleSuggestions(0);
        setIsTyping(false);

        setTimeout(() => {
            typeAIMessage(INTRO_TEXT, true);
        }, 300);
    };

    /* -------------------- EFFECTS --------------------*/
    useEffect(() => {
        AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages, isTyping]);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(aiBounce, { toValue: 1, duration: 900, useNativeDriver: true }),
                Animated.timing(aiBounce, { toValue: -1, duration: 900, useNativeDriver: true }),
                Animated.timing(aiBounce, { toValue: 0, duration: 900, useNativeDriver: true })
            ])
        ).start();
    }, []);
    
    /* -------------------- KEYBOARD HANDLING --------------------*/
    useEffect(() => {
        const show = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hide = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const showSub = Keyboard.addListener(show, e => {
            Animated.timing(keyboardOffset, {
                toValue: e.endCoordinates.height,
                duration: 250,
                useNativeDriver: true
            }).start();
        });

        const hideSub = Keyboard.addListener(hide, () => {
            Animated.timing(keyboardOffset, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true
            }).start();
        });
    
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []); 

    return {
        chatOpen,
        messages,
        input,
        setInput,
        sendMessage,
        openChat,
        closeChat,
        resetChat,
        isLoadingAI,
        isTyping,
        visibleSuggestions,
        scrollViewRef,
        chatAnim,
        keyboardOffset,
        aiBounce
    };
}