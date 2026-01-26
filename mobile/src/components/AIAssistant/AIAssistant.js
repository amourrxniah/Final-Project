import { 
    View, Text, TouchableOpacity, 
    TextInput, Animated, 
    ScrollView, ActivityIndicator
} from "react-native";
import { useAIAssistant, suggestions } from "./useAIAssistant";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import styles from "./styles";

const formatTime = (iso) => 
    new Date(iso).toLocaleTimeString([], { 
        hour: "2-digit", 
        minute: "2-digit" 
    });

export default function AIAssistant({ mood }) {
    const ai = useAIAssistant({ mood });

    return (
        <>
            {/* AI ASSISTANT */}
            <TouchableOpacity onPress={ai.openChat} style={styles.aiButton}>
                <Animated.View style={{
                    transform: [{
                        translateX: ai.aiBounce.interpolate({
                            inputRange: [-1, 1],
                            outputRange: [-6, 6]
                        })
                    }]
                }}>
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
            {ai.chatOpen && (
                <Animated.View
                    style={[
                        styles.chatSheet,
                        {
                            transform: [
                                { translateY: ai.chatAnim },
                                { translateY: Animated.multiply(ai.keyboardOffset, -1 ) }
                            ]
                        }
                    ]}>
                        {/* CHAT HEADER */}
                        <View style={styles.chatHeader}>
                            <View style={styles.chatHeaderLeft}>
                                <MaterialCommunityIcons name="star-david" size={35} color="#ff4fa3" />
                                <Text style={styles.chatTitle}>MoodSync Assistant</Text>
                            </View>
    
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                                <TouchableOpacity onPress={ai.resetChat}>
                                    <MaterialCommunityIcons name="reload" size={24}color="#888"/>
                                </TouchableOpacity>
    
                                <TouchableOpacity onPress={ai.closeChat}>
                                    <MaterialCommunityIcons name="close" size={26} color="#999" />
                                </TouchableOpacity>                       
                            </View>
                        </View>
            
                        {/* CHAT BODY */}
                        <ScrollView
                            ref={ai.scrollViewRef} 
                            contentContainerStyle={styles.chatBody}
                            keyboardShouldPersistTaps="handled"
                        >
                            {ai.isLoadingAI && <ActivityIndicator size="large" color="#b36bff"/>}
            
                            {ai.messages.map(msg => (
                                <View key={msg.id} style={{ marginBottom: 1 }}>
                                    {msg.from === "ai" ? (
                                        <>
                                            <View style={styles.aiMsg}>
                                                <Text style={styles.msgText}>{msg.text}</Text>
                                            
                                                {msg.showSuggestions && (
                                                    <View style={{ marginTop: 10}}>
                                                        {suggestions
                                                            .slice(0, ai.visibleSuggestions)
                                                            .map(s => (
                                                                <TouchableOpacity
                                                                    key={s}
                                                                    style={styles.suggestions}
                                                                    onPress={() => ai.sendMessage(s)}
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
                                value={ai.input}
                                onChangeText={ai.setInput}
                                placeholder="Ask me anything..."
                                style={styles.input}
                                placeholderTextColor="#666"
                            />
                            <TouchableOpacity onPress={() => ai.sendMessage(ai.input)}>
                                <LinearGradient colors={["#b36bff", "#ff4fa3"]} style={styles.sendBtn}>
                                    <MaterialCommunityIcons name="send" size={26} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                </Animated.View>
            )}
        </>
    );
}