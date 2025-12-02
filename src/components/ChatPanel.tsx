import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, X } from "lucide-react";

export interface Message {
  id: string;
  text: string;
  isOwn: boolean;
  time: string;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onSendMessage: (text: string) => void;
}

export function ChatPanel({ isOpen, onClose, messages, onSendMessage }: ChatPanelProps) {
  const [message, setMessage] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    onSendMessage(message);
    setMessage("");
  };

  return (
    <div 
      className={`absolute top-0 right-0 h-full w-full md:w-96 bg-card/95 backdrop-blur-xl border-l border-border transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Chat header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">Chat</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  msg.isOwn 
                    ? 'bg-primary text-primary-foreground rounded-br-sm' 
                    : 'bg-secondary rounded-bl-sm'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Message input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite uma mensagem..."
              className="bg-secondary/50"
            />
            <Button type="submit" size="icon" className="gradient-primary shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
