'use client';

// @ts-ignore
// import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Send, Bot, User, Sparkles, ExternalLink, Square, Download, Utensils, MapPin, Bus, Clock, Phone, Shield, Calendar, Menu, X, Copy, RotateCcw } from 'lucide-react';
import { MenuModal } from '@/components/MenuModal';
import { BusModal, HoursModal, DirectoryModal, SafetyModal, EventsModal } from '@/components/QuickAccessButtons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// New component for fancy source display - full width at bottom
function SourceCard({ title, url }: { title: string; url: string }) {
  return (
    <a 
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-1.5 w-full px-4 py-2 rounded-b-2xl bg-primary hover:bg-primary/90 transition-colors no-underline -mx-3 sm:-mx-4 -mb-3 mt-3" 
      style={{ width: 'calc(100% + 1.5rem)' }}
    >
      <ExternalLink className="h-3 w-3 text-white/70" />
      <span className="text-xs font-medium text-white">
        {title}
      </span>
    </a>
  );
}

export default function Home() {
  // ... (state and handlers remain same)
  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBusModalOpen, setIsBusModalOpen] = useState(false);
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState(false);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [isEventsModalOpen, setIsEventsModalOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Capture install prompt event
  useEffect(() => {
    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isStandalone) {
      // Already installed, don't show button
      setShowInstallButton(false);
      return;
    }

    // Check for ?install=true query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const autoInstall = urlParams.get('install') === 'true';

    // On iOS (not installed), always show button (can't detect via event)
    if (iOS) {
      setShowInstallButton(true);
      
      // Auto-show instructions if ?install=true
      if (autoInstall) {
        setTimeout(() => setShowIOSInstructions(true), 500);
      }
    }

    // Listen for install prompt (Chrome/Edge/Android)
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);

      // Auto-trigger install if ?install=true
      if (autoInstall) {
        setTimeout(() => {
          e.prompt();
        }, 500);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Handle install button click
  const handleInstall = async () => {
    if (isIOS) {
      // Show iOS instructions modal
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallButton(false);
    }
    
    setDeferredPrompt(null);
  };

  // Stop generation function
  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  // ... (sendMessage and other existing logic remains same)
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage = { id: Date.now().toString(), role: 'user' as const, content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
        signal: abortControllerRef.current.signal, // Add abort signal
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
    } catch (error: any) {
      // Don't log error if it was an abort
      if (error.name !== 'AbortError') {
        console.error('Chat error:', error);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
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
      <header className="sticky top-0 z-50 bg-background">
        <div className="container flex h-14 max-w-2xl mx-auto items-center justify-between px-4">
          {/* Left: Hamburger */}
          <button
            onClick={() => setIsNavOpen(true)}
            className="flex items-center justify-center p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Center: Title */}
          <span className="text-lg font-semibold tracking-tight">RockyGPT</span>
          
          {/* Right: Install or placeholder */}
          <div className="flex items-center gap-2">
            {showInstallButton ? (
              <button
                onClick={handleInstall}
                className="flex items-center justify-center p-2 text-muted-foreground hover:text-foreground transition-colors"
                title={isIOS ? "See install instructions" : "Install RockyGPT"}
              >
                <Download className="h-5 w-5" />
              </button>
            ) : (
              <div className="w-9" /> 
            )}
          </div>
        </div>
      </header>

      {/* Navigation Sidebar */}
      {isNavOpen && (
        <div className="fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsNavOpen(false)} />
          
          {/* Sidebar */}
          <div className="absolute left-0 top-0 h-full w-72 bg-background border-r border-border shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
                  <Bot className="h-5 w-5" />
                </div>
                <span className="text-lg font-semibold text-primary">RockyGPT</span>
              </div>
              <button onClick={() => setIsNavOpen(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto py-4">
              <div className="px-3 mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase px-3">Quick Access</p>
              </div>
              <nav className="space-y-1 px-3">
                <button
                  onClick={() => { window.open('https://www.ramapo.edu/map/', '_blank'); setIsNavOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  Campus Map
                </button>
                <button
                  onClick={() => { setIsBusModalOpen(true); setIsNavOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Bus className="w-5 h-5 text-muted-foreground" />
                  Shuttle Schedule
                </button>
                <button
                  onClick={() => { setIsHoursModalOpen(true); setIsNavOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  Dining Hours
                </button>
                <button
                  onClick={() => { setIsEventsModalOpen(true); setIsNavOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  Campus Events
                </button>
                <button
                  onClick={() => { setIsDirectoryModalOpen(true); setIsNavOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  Phone Directory
                </button>
                <button
                  onClick={() => { setIsSafetyModalOpen(true); setIsNavOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  Campus Safety
                </button>
                <button
                  onClick={() => { setIsMenuOpen(true); setIsNavOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Utensils className="w-5 h-5 text-muted-foreground" />
                  Dining Menu
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-auto pb-32 pt-6">
        <div className="container max-w-2xl mx-auto px-4 flex flex-col gap-6">
          {messages.length === 0 && (
            <div className="flex flex-col gap-8 pt-8">
              {/* Greeting */}
              <div className="space-y-1">
                <p className="text-muted-foreground text-lg">Hi there</p>
                <h1 className="text-3xl font-semibold tracking-tight">What can I help with?</h1>
              </div>
              
              {/* Suggestion prompts with bullets */}
              <div className="space-y-3">
                {[
                  { q: "What's on the menu today?", color: 'bg-purple-500' },
                  { q: "When is the next shuttle?", color: 'bg-blue-500' },
                ].map(({ q, color }) => (
                  <button
                    key={q}
                    onClick={() => handleSuggestionClick(q)}
                    className="flex items-center gap-3 text-left hover:opacity-70 transition-opacity"
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                    <span className="text-foreground">{q}</span>
                  </button>
                ))}
              </div>
              
              {/* Action chips */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '🍔 Dining hours', q: 'What are dining hours?' },
                  { label: '🅿️ Parking', q: 'Where can I park?' },
                  { label: '🖨️ Printing', q: 'How do I print?' },
                  { label: '📅 Events', q: 'What events are happening?' },
                  { label: '🚌 Shuttle', q: 'Shuttle schedule' },
                ].map(({ label, q }) => (
                  <button
                    key={label}
                    onClick={() => handleSuggestionClick(q)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-muted hover:bg-muted/70 text-sm font-medium transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m: any) => {
            // 1. Extract sources first
            const { cleanContent: contentWithRelated, sources } = m.role === 'assistant' 
              ? extractSources(m.content) 
              : { cleanContent: m.content, sources: [] };

            // 2. Extract Related Questions
            let displayContent = contentWithRelated;
            let relatedQuestions: string[] = [];

            if (m.role === 'assistant' && contentWithRelated.includes('<<RELATED>>')) {
              const parts = contentWithRelated.split('<<RELATED>>');
              displayContent = parts[0].trim();
              const relatedBlock = parts[1];
              if (relatedBlock) {
                relatedQuestions = relatedBlock
                  .split('\n')
                  .map((q: string) => q.trim())
                  .filter((q: string) => q.length > 0);
              }
            }

            return (
              <div
                key={m.id}
                className={`flex flex-col gap-2 ${
                  m.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                {m.role === 'user' ? (
                  /* User message - dark pill on right */
                  <div className="max-w-[85%]">
                    <div className="inline-block px-4 py-3 rounded-3xl bg-muted text-foreground text-sm">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  /* Assistant message - Gemini style */
                  <div className="flex items-start gap-3 max-w-full">
                    {/* Sparkle icon */}
                    <div className="flex-shrink-0 mt-1">
                      <Sparkles className="h-5 w-5 text-blue-400" />
                    </div>
                    
                    {/* Message content and actions */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm leading-relaxed text-foreground">
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
                            table: ({...props}) => <div className="my-4 w-full overflow-x-auto rounded-lg border border-border"><table className="w-full text-sm" {...props} /></div>,
                            thead: ({...props}) => <thead className="bg-muted/50 border-b border-border" {...props} />,
                            tbody: ({...props}) => <tbody className="[&_tr:last-child]:border-0" {...props} />,
                            tr: ({...props}) => <tr className="border-b border-border transition-colors hover:bg-muted/50" {...props} />,
                            th: ({...props}) => <th className="px-4 py-2 text-left font-semibold text-primary whitespace-nowrap [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />,
                            td: ({...props}) => <td className="px-4 py-2 text-foreground [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />,
                          }}
                        >
                          {displayContent}
                        </ReactMarkdown>

                        {/* Render Source Card */}
                        {sources.length > 0 && sources.map((source, idx) => (
                          <SourceCard key={idx} title={source.title} url={source.url} />
                        ))}
                      </div>
                      
                      {/* Gemini-style action buttons */}
                      <div className="flex items-center gap-1 mt-3">
                        <button 
                          onClick={() => navigator.clipboard.writeText(m.content)}
                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                          title="Copy"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <FeedbackButtons messageId={m.id} content={m.content} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Related Questions Chips */}
                {relatedQuestions.length > 0 && (
                  <div className="pl-11 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    {relatedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(q)}
                        className="inline-flex items-center px-3 py-2 rounded-2xl bg-background border border-primary/20 text-xs font-medium text-primary hover:bg-primary/5 hover:border-primary transition-colors cursor-pointer shadow-sm text-left h-auto"
                      >
                       <Sparkles className="w-3 h-3 mr-2 opacity-70 shrink-0" />
                       {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <Sparkles className="h-5 w-5 text-blue-400 animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">RockyGPT is thinking</span>
                <div className="flex gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area (Gemini-style) */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-background via-background to-transparent pb-4 pt-6 px-4">
        <div className="mx-auto max-w-2xl">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center rounded-3xl bg-muted border border-border"
          >
            <input
              className="flex-1 bg-transparent px-5 py-4 text-base outline-none placeholder:text-muted-foreground text-foreground"
              placeholder="Ask RockyGPT"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            {isLoading ? (
              <button
                type="button"
                onClick={stopGeneration}
                className="mr-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white transition-opacity hover:opacity-90"
                title="Stop generating"
              >
                <Square className="h-4 w-4 fill-current" />
                <span className="sr-only">Stop</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input?.trim()}
                className="mr-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-30"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </button>
            )}
          </form>
          <div className="mt-3 text-center text-xs text-muted-foreground">
            RockyGPT can make mistakes. Check official sources.
          </div>
        </div>
      </div>

      {/* Modals */}
      <MenuModal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <BusModal isOpen={isBusModalOpen} onClose={() => setIsBusModalOpen(false)} />
      <HoursModal isOpen={isHoursModalOpen} onClose={() => setIsHoursModalOpen(false)} />
      <DirectoryModal isOpen={isDirectoryModalOpen} onClose={() => setIsDirectoryModalOpen(false)} />
      <SafetyModal isOpen={isSafetyModalOpen} onClose={() => setIsSafetyModalOpen(false)} />
      <EventsModal isOpen={isEventsModalOpen} onClose={() => setIsEventsModalOpen(false)} />

      {/* iOS Install Instructions Modal */}
      {showIOSInstructions && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowIOSInstructions(false)}
        >
          <div 
            className="bg-background rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4">Install RockyGPT</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add RockyGPT to your home screen for quick access:
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  1
                </div>
                <p className="text-sm pt-0.5">
                  Tap the <strong>Share</strong> button <span className="text-lg">⬆️</span> in Safari
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  2
                </div>
                <p className="text-sm pt-0.5">
                  Scroll down and tap <strong>"Add to Home Screen"</strong>
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  3
                </div>
                <p className="text-sm pt-0.5">
                  Tap <strong>"Add"</strong> in the top right
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
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
