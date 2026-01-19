'use client';

// @ts-ignore
import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Send, Bot, User, Sparkles } from 'lucide-react';

export default function Home() {
  // @ts-ignore
  const { messages, input, handleInputChange, handleSubmit, isLoading, append, setInput } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col min-h-screen relative font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-2xl mx-auto items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black">
              <Bot className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-primary">RockyGPT</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
             <span className="hidden sm:inline-block">Ramapo College Assistant</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-32 pt-6">
        <div className="container max-w-2xl mx-auto px-4 flex flex-col gap-6">
          
          {/* Welcome State */}
          {messages.length === 0 && (
            <div className="my-12 flex flex-col items-center justify-center gap-4 text-center">
              <div className="rounded-full bg-muted p-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">How can I help you today?</h2>
              <p className="text-muted-foreground max-w-md">
                Ask about dining hours, office locations, shuttle schedules, or campus policies.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full mt-4">
                 {['Where is Student Center?', 'What are dining hours?', 'How to print?', 'Contact Registrar'].map((q) => (
                    <button 
                      key={q}
                      onClick={async () => {
                        // Optimistically set input just in case, but rely on append
                        setInput(q);
                        await append({ role: 'user', content: q });
                      }}
                      className="text-sm p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left text-muted-foreground hover:text-primary"
                    >
                      {q}
                    </button>
                 ))}
              </div>
            </div>
          )}

          {/* Message List */}
          {messages.map((m: any) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${
                m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-foreground'
                }`}
              >
                {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Message Bubble */}
              <div className={`relative group max-w-[85%]`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white dark:bg-zinc-900/50 border border-border shell-bg'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>

                {/* Feedback Actions (Only for AI) */}
                {m.role === 'assistant' && (
                  <FeedbackButtons messageId={m.id} content={m.content} />
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background shadow-sm">
                <Bot className="h-4 w-4" />
              </div>
               <div className="px-4 py-3 text-sm text-muted-foreground animate-pulse">
                Thinking...
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-background via-background/90 to-transparent pb-6 pt-10 px-4">
        <div className="mx-auto max-w-2xl">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center rounded-2xl border border-input bg-background shadow-lg ring-offset-background focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
          >
            <input
              className="flex-1 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Message RockyGPT..."
              value={input || ''}
              onChange={handleInputChange}
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
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);

  const handleVote = async (rating: 'up' | 'down') => {
    if (voted) return;
    setVoted(rating);

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Unknown',
          response: content,
          rating: rating === 'up' ? 1 : -1,
        }),
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
