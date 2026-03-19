import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CodeBlock = ({ language, value }: { language: string; value: string }) => {
  const [copied, setCopied] = useState(false);
  const displayLanguage = language || 'code';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-zinc-700 shadow-sm group">
      <div className="bg-zinc-800 px-4 py-1.5 text-xs text-zinc-400 border-b border-zinc-700 flex justify-between items-center">
        <span className="font-mono uppercase">{displayLanguage}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500">Kopyalandı!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Kopyala</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        style={atomDark}
        language={language}
        PreTag="div"
        customStyle={{ margin: 0, padding: '1.5rem', fontSize: '0.85rem' }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // 🚀 BACKEND'SİZ DİREKT CHAT ÇÖZÜMÜ
      // Vercel /api/chat yerine doğrudan Pollinations API kullanıyoruz
      const response = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { 
              role: 'system', 
              content: 'Sen BurakAI adında, 13 yaşındaki dahi yazılımcı Burak Eren Kısa tarafından geliştirilmiş, nazik ve çok zeki bir yapay zeka asistanısın. React, Tailwind ve oyun geliştirme konularında uzmansın.' 
            },
            ...messages, 
            userMsg
          ],
          model: 'openai', // Diğer seçenekler: 'mistral', 'p1'
          stream: true
        })
      });

      if (!response.ok) throw new Error('API Bağlantı Hatası');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          // Pollinations bazen direkt text bazen JSON chunk gönderir
          // En güvenli yöntem gelen parçayı direkt eklemektir
          assistantMsg += chunk;

          setMessages(prev => {
            const newMsgs = [...prev];
            if (newMsgs.length > 0) {
              newMsgs[newMsgs.length - 1].content = assistantMsg;
            }
            return [...newMsgs];
          });
        }
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Bağlantı kurulamadı. Lütfen internetini kontrol et veya biraz sonra tekrar dene.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[700px] w-full max-w-4xl mx-auto bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <Bot className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="flex flex-col">
          <h2 className="font-bold text-zinc-100 tracking-tight leading-none">BurakAI Chat</h2>
          <span className="text-[10px] text-emerald-500 font-bold uppercase mt-1 tracking-widest">Online & Ready</span>
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20 pointer-events-none">
            <Bot size={80} className="mb-4 text-emerald-500" />
            <p className="text-xl font-black uppercase tracking-[0.3em]">Sistem Çevrimiçi</p>
          </div>
        )}
        
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                  msg.role === 'user' ? 'bg-emerald-600' : 'bg-zinc-800 border border-zinc-700'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-emerald-500" />}
                </div>
                
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-xl ${
                  msg.role === 'user' 
                    ? 'bg-emerald-600/10 text-emerald-50 border border-emerald-500/20 rounded-tr-none' 
                    : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-none'
                }`}>
                  <ReactMarkdown
                    components={{
                      code({ node, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return match ? (
                          <CodeBlock
                            language={match[1]}
                            value={String(children).replace(/\n$/, '')}
                            {...props}
                          />
                        ) : (
                          <code className="bg-zinc-800 text-emerald-400 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
            </div>
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest animate-pulse">Sinyal İşleniyor...</span>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-zinc-900/50 border-t border-zinc-800">
        <div className="relative max-w-4xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Algoritmik bir soru sor veya sohbet et..."
            className="w-full bg-zinc-950 text-zinc-100 rounded-xl p-4 pr-14 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all resize-none min-h-[56px] max-h-40"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-3 bottom-3 p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-emerald-600 shadow-lg shadow-emerald-900/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};