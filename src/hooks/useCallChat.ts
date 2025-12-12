import { useState, useRef, useCallback } from 'react';

export interface ChatMessageUI {
    id: string;
    text: string;
    isOwn: boolean;
    time: string;
    senderName?: string;
}

export function useCallChat() {
    const [messages, setMessages] = useState<ChatMessageUI[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const addMessage = useCallback((message: ChatMessageUI) => {
        setMessages(prev => [...prev, message]);
    }, []);

    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    const handleTyping = useCallback((isTyping: boolean) => {
        setIsTyping(isTyping);

        if (isTyping) {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
            }, 1000);
        }
    }, []);

    const cleanupChat = useCallback(() => {
        setMessages([]);
        setIsTyping(false);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
    }, []);

    return {
        messages,
        isTyping,
        addMessage,
        clearMessages,
        handleTyping,
        cleanupChat
    };
}
