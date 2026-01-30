'use client';

// @ts-ignore
// import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Send, Bot, User, Sparkles, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// New component for fancy source display
function SourceCard({ title, url }: { title: string; url: string }) {
  return (
    <a 
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-tl-2xl bg-primary hover:bg-primary/90 transition-colors no-underline z-10"
    >
      <span className="text-[10px] font-medium text-white">
        {title}
      </span>
      <ExternalLink className="h-2.5 w-2.5 text-white/60" />
    </a>
  );
}

export default function Home() {
  // ... (state and handlers remain same)
  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');

  // ... (sendMessage and other existing logic remains same)
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage = { id: Date.now().toString(), role: 'user' as const, content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) throw new Error(response.statusText);

      const assistantId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '' },
      ]);

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let done = false;
      let accumulatedContent = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: !done });
        accumulatedContent += chunkValue;

        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg.role === 'assistant') {
            lastMsg.content = accumulatedContent;
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const query = input;
    setInput('');
    await sendMessage(query);
  };

  const handleSuggestionClick = async (q: string) => {
    setInput(q);
    setInput(''); 
    await sendMessage(q);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Helper to extract sources from markdown content
  const extractSources = (content: string) => {
    const sourceRegex = /\*\*Sources:\*\*\s*((?:-\s*\[.*?\]\(.*?\)\s*)+)/;
    const match = content.match(sourceRegex);
    
    if (!match) return { cleanContent: content, sources: [] };

    const sourceBlock = match[1];
    const cleanContent = content.replace(sourceRegex, '').trim();
    
    // Parse individual sources
    const sources = sourceBlock.split('\n')
      .map(line => {
        const linkMatch = line.match(/\[(.*?)\]\((.*?)\)/);
        return linkMatch ? { title: linkMatch[1], url: linkMatch[2] } : null;
      })
      .filter((s): s is { title: string; url: string } => s !== null);

    return { cleanContent, sources };
  };

  return (
    <div className="flex flex-col min-h-screen relative font-sans">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-2xl mx-auto items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
              <Bot className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-primary">RockyGPT</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
             <span className="hidden sm:inline-block">Ramapo College Assistant</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto pb-32 pt-6">
        <div className="container max-w-2xl mx-auto px-4 flex flex-col gap-6">
          {messages.length === 0 && (
            <div className="my-12 flex flex-col items-center justify-center gap-4 text-center">
              <div className="rounded-full bg-muted p-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">How can I help you today?</h2>
              <p className="text-muted-foreground max-w-md">
                Ask about dining, academics, parking, technology, events, and more!
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-6">
                 {[
                   { q: '🍔 What are dining hours?', icon: '🍽️' },
                   { q: '🅿️ Where can I park?', icon: '🚗' },
                   { q: '🖨️ How do I print?', icon: '💻' },
                   { q: '📅 What events are happening?', icon: '🎉' },
                   { q: '📞 Contact Registrar', icon: '📋' },
                   { q: '🚌 Shuttle schedule', icon: '🚍' }
                 ].map(({ q, icon }) => (
                    <button 
                      key={q}
                      onClick={() => handleSuggestionClick(q.replace(/^[^\s]+\s/, ''))} // Remove emoji prefix
                      className="group flex items-center gap-3 text-sm p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 hover:shadow-md transition-all duration-200 text-left"
                    >
                      {q}
                    </button>
                 ))}
              </div>
            </div>
          )}

          {messages.map((m: any) => {
            // Process message content for sources
            const { cleanContent, sources } = m.role === 'assistant' 
              ? extractSources(m.content) 
              : { cleanContent: m.content, sources: [] };

            return (
              <div
                key={m.id}
                className={`flex items-start gap-3 ${
                  m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-foreground'
                  }`}
                >
                  {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                <div className={`relative group max-w-[85%]`}>
                  <div
                    className={`relative overflow-hidden rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-white border border-border shell-bg text-foreground'
                    }`}
                  >
                    {m.role === 'user' ? (
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    ) : (
                      <>
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            strong: ({...props}) => <span className="font-bold text-primary" {...props} />,
                            h1: ({...props}) => <h1 className="font-bold text-2xl text-primary mt-3 mb-1" {...props} />,
                            h2: ({...props}) => <h2 className="font-bold text-xl text-primary mt-2 mb-1" {...props} />,
                            h3: ({...props}) => <h3 className="font-bold text-lg text-primary mt-2 mb-1" {...props} />,
                            ul: ({...props}) => <ul className="list-disc list-inside my-1 space-y-0.5 marker:text-primary" {...props} />,
                            ol: ({...props}) => <ol className="list-decimal list-inside my-1 space-y-0.5 marker:text-primary" {...props} />,
                            a: ({...props}) => <a className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer" {...props} />,
                            p: ({...props}) => <p className="leading-relaxed mb-2 last:mb-0" {...props} />,
                          }}
                        >
                          {cleanContent}
                        </ReactMarkdown>

                        {/* Render Source Card - Absolutely positioned to bottom right */}
                        {sources.length > 0 && (
                          <div className="absolute bottom-0 right-0">
                            {sources.map((source, idx) => (
                              <SourceCard key={idx} title={source.title} url={source.url} />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {m.role === 'assistant' && (
                    <FeedbackButtons messageId={m.id} content={m.content} />
                  )}
                </div>
              </div>
            );
          })}
          
          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-primary/10 shadow-sm">
                <Bot className="h-4 w-4 text-primary animate-pulse" />
              </div>
               <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-muted/50">
                <span className="text-sm text-muted-foreground">RockyGPT is thinking</span>
                <div className="flex gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area (same as before) */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-background via-background/90 to-transparent pb-6 pt-10 px-4">
        <div className="mx-auto max-w-2xl">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center rounded-2xl border border-input bg-background shadow-lg ring-offset-background focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
          >
            <input
              className="flex-1 bg-transparent px-4 py-4 text-base md:text-sm outline-none placeholder:text-muted-foreground text-foreground"
              placeholder="Message RockyGPT..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={isLoading || !input?.trim()}
              className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </button>
          </form>
          <div className="mt-2 text-center text-[10px] text-muted-foreground">
            RockyGPT can make mistakes. Check official sources.
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedbackButtons({ messageId, content }: { messageId: string; content: string }) {
  // ... (Feedback logic with thumbs up/down remains exactly same)
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);

  const handleVote = async (rating: 'up' | 'down') => {
    if (voted) return;
    setVoted(rating);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'Unknown', response: content, rating: rating === 'up' ? 1 : -1 }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (voted) return <div className="mt-1 text-xs text-muted-foreground">Thanks!</div>;

  return (
    <div className="mt-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
      <button onClick={() => handleVote('up')} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
        <ThumbsUp className="h-3 w-3" />
      </button>
      <button onClick={() => handleVote('down')} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
        <ThumbsDown className="h-3 w-3" />
      </button>
    </div>
  );
}
