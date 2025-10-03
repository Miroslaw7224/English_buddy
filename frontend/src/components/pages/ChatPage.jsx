// @ts-nocheck
// eslint-disable

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMemo } from "react";
import { createRepos } from "@/lib/repos/index";


const LS_KEY  = "eb.chat.messages";
const SID_KEY = "eb.chat.sid";


export default function ChatPage({ user }) {
    const [messages, setMessages] = useState(() => {
        try {
          const saved = localStorage.getItem(LS_KEY);
          return saved ? JSON.parse(saved) : [];
        } catch { return [{ role:"assistant", content:"Witaj!" }]; }
      });
    const [sid] = useState(() => {
    try {
        let v = localStorage.getItem(SID_KEY);
        if (!v) { v = (crypto?.randomUUID?.() ?? String(Date.now())); localStorage.setItem(SID_KEY, v); }
        return v;
    } catch { return "fallback-sid"; }
    });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);  
  const { words } = useMemo(() => createRepos(user?.id || null), [user?.id]);
  const [wordTerm, setWordTerm] = useState("");
  const [wordTrans, setWordTrans] = useState("");
  const [wordList, setWordList] = useState([]);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(messages)); } catch {}
  }, [messages]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  useEffect(() => {
     if (!user) { setWordList([]); return; }
     const repo = createRepos(user.id).words;
     setWordList(repo.list());
  }, [user]);



  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setError(null);
  
    const userMsg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
  
    // --- NOWE: placeholder asystenta ---
    const placeholderId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: placeholderId, role: "assistant", content: "…", pending: true }]);
  
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: next.slice(-10), conversation_id: sid }),
      });
      const data = await res.json();
  
      // --- NOWE: podmień placeholder treścią ---
      setMessages(prev => prev.map(m =>
        m.id === placeholderId ? { role: "assistant", content: data?.response ?? "Brak odpowiedzi." } : m
      ));
    } catch (e) {
      // --- NOWE: pokaż błąd w miejscu placeholdera ---
      setMessages(prev => prev.map(m =>
        m.id === placeholderId ? { ...m, content: "Nie udało się wysłać. Spróbuj ponownie.", error: true } : m
      ));
      setError("Nie udało się wysłać wiadomości. Sprawdź połączenie.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    // SHIFT+Enter pozwala na nową linię (domyślne zachowanie)
  };
  const refreshWords = () => {
     if (!user) return;
     setWordList(createRepos(user.id).words.list());
  };
  const addWord = () => {
     if (!user || !wordTerm.trim()) return;
     createRepos(user.id).words.add({ term: wordTerm.trim(), translation: wordTrans.trim(), example: "" });
     setWordTerm(""); setWordTrans(""); refreshWords();
  };
  const removeWord = (id) => {
    if (!user) return;
     createRepos(user.id).words.remove(id);
     refreshWords();
  };
    
  return (
    <div className="mx-auto max-w-[980px]">
         
          <Button
            variant="outline"
            style={{ height: '32px', fontSize: '16px', padding: '0 12px', color: 'Black', backgroundColor: 'Gray' }}
            onClick={() => { localStorage.removeItem(LS_KEY); setMessages([]); }}
          >
            Nowa rozmowa
          </Button>
      <div className="m-3 rounded-3xl overflow-hidden bg-transparent border border-white/30 shadow-lg">
        <ScrollArea className="h-[60vh]" style={{ backgroundColor: 'rgba(23, 24, 26, 0.45)', backdropFilter: 'blur(6px)' }}>
          <div className="p-4 space-y-3" style={{ backgroundColor: 'transparent' }}>

            {messages.map((m, i) => {
              const isUser = m.role === "user";
              return (
                <div key={i} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Avatar style={{ height: '35px', width: '35px' }}>
                    <AvatarImage 
                        src={isUser ? "/user-avatar.png" : "/ai-avatar.png"} 
                        alt={isUser ? "User" : "AI"}
                    />
                    <AvatarFallback className="text-xs">
                        {isUser ? "U" : "AI"}
                    </AvatarFallback>
                </Avatar>
                </div>
                <div className={isUser ? "bubble bubble-user" : "bubble bubble-ai"}>
                  {m.content}
                </div>
              </div>
              );
            })}
            <div ref={endRef} />
          </div>
        </ScrollArea>

        <div className="sticky bottom-0 p-3 flex gap-2 border-t border-white/30 bg-white/55 backdrop-blur-md">
          <textarea
            style={{ fontSize: '16px', resize: 'none', minHeight: '40px', maxHeight: '120px', width: '100%' }}
            ref={inputRef}
            autoFocus
            className="bg-white/65 backdrop-blur-sm border-white/40 placeholder-black/50 focus-visible:ring-1 focus-visible:ring-white/60 rounded-md px-3 py-2"
            placeholder="..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={loading}
/>
          <Button onClick={sendMessage} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Wyślij</span>
          </Button>
        </div>
      </div>

      {error && <div className="mt-2 text-sm text-destructive">{error}</div>}
    </div>
  );
}
