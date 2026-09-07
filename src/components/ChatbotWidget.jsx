import React, { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Ticket as TicketIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { KnowledgeBaseArticles } from "@/api/entities";
import { helpdeskChatbotReply } from "@/lib/ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function ChatbotWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I'm the IT Assist bot. Tell me what's going wrong and I'll try to help or open a ticket." },
  ]);
  const [input, setInput] = useState("");
  const [canEscalate, setCanEscalate] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function send() {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");
    const kb = KnowledgeBaseArticles.list();
    const { reply, escalate } = helpdeskChatbotReply(text, kb);
    setCanEscalate(!!escalate);
    setTimeout(() => setMessages((m) => [...m, { from: "bot", text: reply }]), 300);
  }

  if (!user) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {open ? (
        <div className="flex h-[28rem] w-80 flex-col overflow-hidden rounded-xl border border-border bg-white shadow-xl">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4" /> IT Assist
            </div>
            <button onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  m.from === "bot" ? "bg-secondary text-foreground" : "ml-auto bg-primary text-primary-foreground"
                )}
              >
                {m.text}
              </div>
            ))}
            {canEscalate && (
              <Button size="sm" variant="outline" className="w-full" onClick={() => navigate("/tickets/new")}>
                <TicketIcon className="h-3.5 w-3.5" /> Create a ticket
              </Button>
            )}
            <div ref={endRef} />
          </div>
          <div className="flex items-center gap-2 border-t border-border p-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Describe your issue..."
              className="h-9"
            />
            <Button size="icon" onClick={send}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
