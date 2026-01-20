import { 
    View, Text, StyleSheet, TouchableOpacity, 
    TextInput, Animated, Dimensions, ScrollView, 
    Platform, Keyboard, ActivityIndicator
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import MaskedView from "@react-native-masked-view/masked-view";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* -------------------- CONSTANTS --------------------*/
const SCREEN_HEIGHT = Dimensions.get("window").height;
const BACKEND_URL = "http://192.168.1.184:8081/chat";
const CHAT_STORAGE_KEY = "moodsync_chat_history";

const INTRO_TEXT =
    "Hi! I'm your MoodSync Assistant 👋\n\n" +
    "I can help you find activities, answer questions "+
    "or guide you through the app.\n\n"+
    "What would you like help with today?"
    
const suggestions = [ 
    "Suggest an activity", 
    "How does MoodSync work?", 
    "Help me with my mood" 
];

const formatTime = (iso) => 
    new Date(iso).toLocaleTimeString([], { 
        hour: "2-digit", 
        minute: "2-digit" 
    });

/* -------------------- COMPONENT --------------------*/
export default function MoodInputScreen({ navigation }) {

    /* ----- STATE ----- */
    const [selected, setSelected] = useState(null);
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
                    m.id === id ? { ...m, text: text.slice(0, index) } : m
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
        
        try {
            const reply = await getAIResponse(conversation);

            typeAIMessage (
                typeof reply === "string" && reply.trim()
                ? reply
                : "Sorry, I didn't catch that 😅"
            );
        } catch {
            typeAIMessage("Sorry, something went wrong 😞");
        }
    };

    /* -------------------- MOODS --------------------*/
    const moods = [
        {
            key: "low",
            title: "Low Energy",
            desc: "I'm feeling tired and need to recharge",
            icon: "emoticon-sad-outline",
            color: "#4dabf7"
        },
        {
            key: "neutral",
            title: "Neutral Energy",
            desc: "I'm doing okay, open to suggestions",
            icon: "emoticon-neutral-outline",
            color: "#9b5de5"
        },
        {
            key: "high",
            title: "High Energy",
            desc: "I'm feeling great and ready for action",
            icon: "emoticon-happy-outline",
            color: "#ff4fa3"
        }
    ];

    /* -------------------- AI REQUEST --------------------*/
    const getAIResponse = async (conversation) => {
        const res = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                session_id: SESSION_ID,
                mood: selected ?? "neutral",
                messages: conversation.map(m => ({
                    role: m.from === "user" ? "user" : "assistant",
                    content: m.text,
                }))
            })
        });

        const data = await res.json();
        return data.reply;
    };
            
    /* -------------------- CHAT --------------------*/
    const openChat = async () => {
        setChatOpen(true);
        setIsLoadingAI(true);

        const stored = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
        if (stored) {
            setMessages(JSON.parse(stored));
        }

        Animated.timing(chatAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
        }).start();

        setTimeout(() => {
            setIsLoadingAI(false);
            if (messages.length === 0) {
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

    useEffect(() => {
        AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    }, [messages]);

    /* -------------------- AUTO SCROLL --------------------*/
    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages, isTyping]);
        

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

    /* -------------------- ANIMATIONS --------------------*/
    const liftAnim = useRef({
        low: new Animated.Value(0),
        neutral: new Animated.Value(0),
        high: new Animated.Value(0)
    }).current;


    const animateSelect = (key) => {
        Object.keys(liftAnim).forEach(k => {
            Animated.spring(liftAnim[k], {
                toValue: k === key ? 1 : 0,
                useNativeDriver: true,
                friction: 7
            }).start();
        });

        setSelected(key);
    }

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(aiBounce, { toValue: 1, duration: 900, useNativeDriver: true }),
                Animated.timing(aiBounce, { toValue: -1, duration: 900, useNativeDriver: true }),
                Animated.timing(aiBounce, { toValue: 0, duration: 900, useNativeDriver: true })
            ])
        ).start();
    }, []);

    /* -------------------- CONTINUE --------------------*/
    const handleContinue = async () => {
        const entry = {
            mood: selected,
            timestamp: new Date().toISOString()
        };

        const existing = await AsyncStorage.getItem("moodHistory");
        const history = existing ? JSON.parse(existing) : [];

        history.push(entry);

        await AsyncStorage.setItem("currentMood", selected);
        await AsyncStorage.setItem("moodHistory", JSON.stringify(history));

        navigation.navigate("DetectedContext");
    };

    return (
        <View style={styles.container}>

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.back}
                >
                    <MaterialCommunityIcons name="arrow-left" size={30}></MaterialCommunityIcons>
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <MaskedView
                        maskElement={<Text style={styles.title}>How are you feeling?</Text>}
                    >
                        <LinearGradient
                            colors={["#b36bff", "#ff4fa3"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={[styles.title, { opacity: 0 }]}>
                                How are you feeling?
                            </Text>
                        </LinearGradient>
                    </MaskedView>

                    <Text style={styles.subtitle}>
                        Select your current energy level
                    </Text>
                </View>
            </View>

            {/* MOOD OPTIONS */}
            {moods.map(mood => {
                const active = selected === mood.key;

                return (
                    <Animated.View 
                        key={mood.key}
                        style={{ 
                            transform: [
                                {
                                    translateY: liftAnim[mood.key].interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, -4]
                                    })
                                }
                            ]
                        }}
                    >
                        <TouchableOpacity
                            style={[
                                styles.moodCard,
                                {
                                    borderColor: active ? mood.color : "#ddd",
                                    backgroundColor: active ? `${mood.color}25` : "#fff"
                                }
                            ]}
                            onPress={() => animateSelect(mood.key)}
                            activeOpacity={0.9}
                        >
                            <View
                                style={[
                                    styles.iconCircle,
                                    { backgroundColor: mood.color }
                                ]}
                            >
                                <MaterialCommunityIcons
                                    name={mood.icon}
                                    size={34}
                                    color="#fff"
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.moodTitle}>{mood.title}</Text>
                                <Text style={styles.moodDesc}>{mood.desc}</Text>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                );
            })}

            {/* AI ASSISTANT */}
            <TouchableOpacity onPress={openChat} style={styles.aiButton}>
                <Animated.View style={{
                    transform: [{
                        translateX: aiBounce.interpolate({
                            inputRange: [-1, 1],
                            outputRange: [-6, 6]
                        })
                    }]
                }}
                >
                    <LinearGradient
                        colors={["#b36bff", "#ff4fa3"]}
                        style={styles.aiCircle}
                    >
                        <MaterialCommunityIcons
                            name="robot-excited-outline"
                            size={42}
                            color="#fff"
                        />
                    </LinearGradient>   
                </Animated.View>
            </TouchableOpacity>

            {/* CHATBOT */}
            {chatOpen && (
                <Animated.View
                    style={[
                        styles.chatSheet,
                        {
                            transform: [
                                { translateY: chatAnim },
                                { translateY: Animated.multiply(keyboardOffset, -1 ) }
                            ]
                        }
                    ]}
                >
                    {/* CHAT HEADER */}
                    <View style={styles.chatHeader}>
                        <View style={styles.chatHeaderLeft}>
                            <MaterialCommunityIcons name="star-david" size={35} color="#ff4fa3" />
                            <Text style={styles.chatTitle}>MoodSync Assistant</Text>
                        </View>

                        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                            <TouchableOpacity onPress={resetChat}>
                                <MaterialCommunityIcons name="reload" size={24}color="#888"/>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={closeChat}>
                                <MaterialCommunityIcons name="close" size={26} color="#999" />
                            </TouchableOpacity>                       
                        </View>

                        
                        
                    </View>

                    {/* CHAT BODY */}
                    <ScrollView
                        ref={scrollViewRef} 
                        contentContainerStyle={styles.chatBody}
                        keyboardShouldPersistTaps="handled"
                    >
                        {isLoadingAI && <ActivityIndicator size="large" color="#b36bff"/>}

                        {messages.map(msg => (
                            <View key={msg.id} style={{ marginBottom: 1 }}>
                                {msg.from === "ai" ? (
                                    <>
                                        <View style={styles.aiMsg}>
                                            <Text style={styles.msgText}>{msg.text}</Text>
                                        
                                            {msg.showSuggestions && (
                                                <View style={{ marginTop: 10}}>
                                                    {suggestions
                                                        .slice(0, visibleSuggestions)
                                                        .map(s => (
                                                            <TouchableOpacity
                                                                key={s}
                                                                style={styles.suggestions}
                                                                onPress={() => sendMessage(s)}
                                                            >
                                                                <Text style={styles.suggestionText}>
                                                                    {s}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        ))}
                                                </View>
                                            )}
                                            
                                            <View style={styles.aiTail} />
                                        </View>

                                        <Text style={styles.aiTime}>
                                            {formatTime(msg.timestamp)}
                                        </Text>
                                    </>
                                ) : (
                                    <View style={styles.userMsgWrap}>
                                        <View style={styles.userContainer}>
                                            <LinearGradient
                                                colors={["#b36bff", "#ff4fa3"]}
                                                style={styles.userMsg}
                                            >
                                                <Text style={styles.userText}>{msg.text}</Text>
                                            </LinearGradient>
                                            <View style={styles.userTail} />
                                        </View>
                                        
                                        <Text style={styles.userTime}>
                                            {formatTime(msg.timestamp)}
                                        </Text>
                                    </View>  
                                )}
                            </View>
                        ))}
                    </ScrollView>

                    {/* INPUT BAR */}
                    <View style={styles.inputBar}>
                        <TextInput
                            value={input}
                            onChangeText={setInput}
                            placeholder="Ask me anything..."
                            style={styles.input}
                            placeholderTextColor="#666"
                        />
                        <TouchableOpacity onPress={() => sendMessage(input)}>
                            <LinearGradient colors={["#b36bff", "#ff4fa3"]} style={styles.sendBtn}>
                                <MaterialCommunityIcons name="send" size={26} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}
            

            {/* CONTINUE BUTTON */}
            <TouchableOpacity
                disabled={!selected}
                onPress={handleContinue}
            >
                <LinearGradient
                    colors={["#b36bff", "#ff4fa3"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                        styles.continueBtn,
                        { opacity: selected ? 1 : 0.4}
                    ]}
                >
                    <Text style={styles.continueText}>Continue</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );   
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: "#f0f8ff"
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 60,
        marginBottom: 20
    },

    back: {
        width: 40
    },

    headerCenter: {
        flex: 1,
        alignItems: "center",
        marginRight: 10
    },

    title: {
        fontSize: 30,
        fontWeight: "700",
        marginTop: 6
    },

    subtitle: {
        fontSize: 17,
        color: "#666",
        marginTop: 6,
        marginRight: 10
    },

    moodCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 26,
        minHeight: 110,
        borderRadius: 20,
        borderWidth: 2,
        marginBottom: 14
    },

    iconCircle: {
        width: 62,
        height: 62,
        borderRadius: 31,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 18
    },

    moodTitle: {
        fontWeight: "600",
        fontSize: 20
    },

    moodDesc: {
        fontSize: 19,
        color: "#666",
        marginTop: 4
    },

    aiButton: {
        position: "absolute",
        right: 24,
        bottom: 190,
        zIndex: 10
    },

    aiCircle: {
        width: 72,
        height: 72,
        borderRadius: 39,
        justifyContent: "center",
        alignItems: "center"
    },

    chatSheet: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "85%",
        backgroundColor: "#fff",
        zIndex: 999,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 12
    },

    chatHeader: {
        backgroundColor: "#99ccff",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 18
    },

    chatHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8
    },

    chatTitle: {
        fontSize: 23,
        fontWeight: "600",
        color: "#fff"
    },

    chatBody: {
        padding: 14
    },

    msgText: {
        fontSize: 15,
        lineHeight: 20
    },

    aiMsg: {
        padding: 16,
        backgroundColor: "#cce5ff",
        borderRadius: 20,
        maxWidth: "80%"
    },

    aiTail: {
        position: "absolute",
        right: -5,
        bottom: 6,
        width: 10,
        height: 10,
        borderLeftWidth: 8,
        borderTopWidth: 8,
        borderLeftColor: "#cce5ff",
        borderTopColor: "transparent"
    },

    userMsgWrap: {
        alignSelf: "flex-end",
        marginBottom: 6
    },

    userContainer: {
        position: "relative",
        alignSelf: "flex-end"
    },

    userMsg: {
        padding: 14,
        borderRadius: 18,
        maxWidth: "80%",
        zIndex: 999
    },

    userText: {
        color: "#fff",
        fontSize: 15
    },

    userTail: {
        position: "absolute",        
        left: -5,
        bottom: 5,
        width: 10,
        height: 10,
        borderRightWidth: 8,
        borderTopWidth: 8,
        borderRightColor: "#ff4fa3",
        borderTopColor: "transparent"
        
    },

    suggestions: {
        alignSelf: "flex-start",
        backgroundColor: "#fff",
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: "#9b5de5",
        borderRadius: 14,
        marginTop: 6,
    },

    suggestionActive: {
        backgroundColor: "#cbb7ff",
    },

    suggestionText: {
        fontSize: 13,
        color: "#333"
    },

    aiTime: {
        fontSize: 11,
        color: "#555",
        marginLeft: 4,
        marginTop: 4
    },

    userTime: {
        fontSize: 11,
        color: "#777",
        marginTop: 4,
        alignSelf: "flex-end"
    },

    inputBar: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 14,
        paddingBottom: 15,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#eee"
    },

    input: {
        flex: 1,
        backgroundColor: "#eee",
        borderRadius: 26,
        paddingHorizontal: 18,
        marginRight: 12,
        fontSize: 16
    },

    sendBtn: {
        padding: 16,
        borderRadius: 22
    },

    continueBtn: {
        paddingVertical: 22,
        borderRadius: 20,
        alignItems: "center",
        marginTop: 90
    },

    continueText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 19
    }
})