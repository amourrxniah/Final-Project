import { StyleSheet } from "react-native";

export default StyleSheet.create({
    aiButton: {
        position: "absolute",
        left: 0,
        top: -30,
        zIndex: 1000
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
        elevation: 9999,
        zIndex: 9999
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
        left: -6,
        bottom: 6,
        width: 12,
        height: 12,
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
        right: -6,
        bottom: 6,
        width: 12,
        height: 12,
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
    }

});