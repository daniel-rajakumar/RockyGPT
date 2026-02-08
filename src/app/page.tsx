'use client';

// @ts-ignore
// import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Send, Bot, User, Sparkles, ExternalLink, Square, Download, Utensils, MapPin, Bus, Clock, Phone, Shield, Calendar, Menu, X, Copy, RotateCcw, Mail } from 'lucide-react';
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

// Helper to auto-link phone numbers
const linkSmartChips = (text: string) => {
  // Regex for phone numbers: (123) 456-7890, 123-456-7890, 123.456.7890
  // Negative lookbehind ensures we don't double-link existing markdown links
  const phoneRegex = /(?<!\[|\]\(|tel:|href=")(\+?1[\s\.-]?)?\(?\d{3}\)?[\s\.-]?\d{3}[\s\.-]?\d{4}(?!\))/g;
  return text.replace(phoneRegex, (match) => {
    // Basic validation to avoid linking things that look like phone numbers but aren't (e.g. dates)
    if (match.includes('-') || match.includes('.') || match.includes('(')) {
       return `[${match}](tel:${match.replace(/\D/g, '')})`; 
    }
    return match;
  });
};

// Helper to format timestamp
const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  const timeString = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  if (isToday) {
    return timeString;
  }
  
  const dateString = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  
  return `${dateString}, ${timeString}`;
};

export default function Home() {
  // ... (state and handlers remain same)
  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp?: number }>>([]);
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
  
  // Swipe/Drag gesture state
  const touchStart = useRef<{ x: number, y: number } | null>(null);
  const touchCurrent = useRef<{ x: number, y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const SIDEBAR_WIDTH = 288; // w-72 = 18rem = 288px

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
    touchCurrent.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
    
    // Reset dragging state on new touch
    // We don't set isDragging=true immediately anymore to allow for vertical scrolling detection
    setIsDragging(false);
    setDragOffset(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    
    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    touchCurrent.current = { x: currentX, y: currentY };
    
    const deltaX = currentX - touchStart.current.x;
    const deltaY = currentY - touchStart.current.y;
    
    // Detection logic:
    // 1. If not yet dragging, check if gesture is horizontal enough
    if (!isDragging) {
      // Threshold to start drag (e.g. 10px) to distinguish from tap/micro-movement
      if (Math.abs(deltaX) > 10) {
        // Check angle/dominance: Horizontal move should be dominant
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // It's a horizontal swipe
          // If closed: allow opening (dragging right, deltaX > 0)
          // If open: allow closing (dragging left, deltaX < 0) or over-dragging (bounce effect)
          
          if (!isNavOpen && deltaX > 0) {
             setIsDragging(true);
          } else if (isNavOpen) {
             setIsDragging(true);
          }
        }
      }
    }
    
    // 2. If dragging, update offset
    if (isDragging) {
      // Prevent interactions check if browsers support passive: false defaults in React
      // e.preventDefault(); might cause issues with scrolling if not handled carefully, 
      // typically we just let the UI update.
      
      let newOffset = 0;
      if (isNavOpen) {
        // Dragging close (left) - max drag left is -SIDEBAR_WIDTH
        newOffset = Math.min(0, Math.max(-SIDEBAR_WIDTH, deltaX));
      } else {
        // Dragging open (right) - max drag right is SIDEBAR_WIDTH
        // Note: deltaX is total distance from start.
        newOffset = Math.max(0, Math.min(SIDEBAR_WIDTH, deltaX));
      }
      
      setDragOffset(newOffset);
    }
  };

  const onTouchEnd = () => {
    if (touchStart.current === null || touchCurrent.current === null) {
         setIsDragging(false);
         setDragOffset(0);
         return;
    }
    
    if (isDragging) {
        const deltaX = touchCurrent.current.x - touchStart.current.x;
        const threshold = SIDEBAR_WIDTH * 0.25; // 25% threshold
        
        if (isNavOpen) {
          // If was open, and dragged left significantly -> Close
          if (deltaX < -threshold) {
            setIsNavOpen(false);
          }
        } else {
           // If was closed, and dragged right significantly -> Open
           if (deltaX > threshold) {
             setIsNavOpen(true);
           }
        }
    }
    
    setIsDragging(false);
    setDragOffset(0);
    touchStart.current = null;
    touchCurrent.current = null;
  };

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

    const userMessage = { id: Date.now().toString(), role: 'user' as const, content, timestamp: Date.now() };
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
        { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() },
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
    <div 
      className="flex flex-col min-h-screen relative font-sans"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
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
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium animate-in fade-in zoom-in duration-300"
                title={isIOS ? "See install instructions" : "Install RockyGPT"}
              >
                <Download className="h-4 w-4" />
                <span>Install</span>
              </button>
            ) : (
              <div className="w-9" />
            )}
          </div>
        </div>
      </header>

      {/* Navigation Sidebar - Always rendered for transition */}
      <div 
        className={`fixed inset-0 z-[60] transition-all duration-300 ${
          // When dragging, we handle visibility/pointer-events manually or keep them enabled if drag started
          (isNavOpen || isDragging) ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
            // Opacity logic:
            // If dragging open: opacity increases from 0 -> 1 based on dragOffset
            // If dragging close: opacity decreases from 1 -> 0
            // For simplicity with CSS transitions mixed with drag, let's keep it simple:
            // If dragging, we might want to disable transition and set opacity manually? 
            // Or just keep simple transition logic: if dragging > 0, show backdrop?
            // Let's stick to simple boolean for backdrop visibility during drag for now to minimize complexity, 
            // or we can calculate opacity based on dragOffset.
            // Simplified: if open OR dragging > 50px/open-direction, show it? 
            // Actually, let's rely on standard transition for backdrop unless we want perfect sync.
            // Perfect sync would require inline style opacity. 
            isNavOpen || (isDragging && Math.abs(dragOffset) > 0) ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
             // Optional: Interactive backdrop opacity
             opacity: isDragging 
                ? (isNavOpen ? 1 + (dragOffset / SIDEBAR_WIDTH) : (dragOffset / SIDEBAR_WIDTH)) 
                : undefined,
             transition: isDragging ? 'none' : undefined
          }}
          onClick={() => !isDragging && setIsNavOpen(false)} 
        />
        
        {/* Sidebar */}
        <div 
          className={`absolute left-0 top-0 h-full w-72 bg-background border-r border-border shadow-2xl flex flex-col will-change-transform ${
            // If NOT dragging, use transition class. If dragging, remove it to follow finger instantly.
            !isDragging ? 'transition-transform duration-300 ease-out' : ''
          } ${
             // Base class for open/closed state handled by translate-x below, 
             // but we keep these for accessible defaults/hydration
             isNavOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{
            // Apply drag offset transform
            // If closed: start at -100% (-288px) + dragOffset (positive)
            // If open: start at 0 + dragOffset (negative)
            transform: isDragging 
              ? (isNavOpen 
                  ? `translateX(${dragOffset}px)` 
                  : `translateX(calc(-100% + ${dragOffset}px))`)
              : undefined
          }}
        >
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
                title="Open Campus Map"
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
                className={`flex flex-col gap-4 ${
                  m.role === 'user' ? 'items-end' : 'items-start w-full'
                }`}
              >
                {m.role === 'user' ? (
                  /* User message - dark pill on right */
                  <div className="max-w-[80%]">
                    <div className="px-4 py-2.5 rounded-2xl bg-muted/80 text-foreground text-[15px]">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  /* Assistant message - Gemini style with icon on top */
                  <div className="flex flex-col gap-3 w-full">
                    {/* Sparkle icon and timestamp row */}
                    <div className="flex items-end gap-3">
                      <Sparkles className="h-5 w-5 text-white" />
                      {m.timestamp && (
                        <span className="text-sm text-muted-foreground/80 mt-0.5">
                          {formatTimestamp(m.timestamp)}
                        </span>
                      )}
                    </div>
                    
                    {/* Message content */}
                    <div className="space-y-4">
                      {/* Main text content */}
                      <div className="text-[15px] leading-7 text-foreground prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          urlTransform={(url) => {
                            if (url.startsWith('tel:') || url.startsWith('mailto:')) return url;
                            return url.startsWith('http') || url.startsWith('/') ? url : url;
                          }}
                          components={{
                            strong: ({...props}) => <strong className="font-semibold text-foreground" {...props} />,
                            h1: ({...props}) => <h1 className="text-xl font-semibold mt-4 mb-2" {...props} />,
                            h2: ({...props}) => <h2 className="text-lg font-semibold mt-3 mb-2" {...props} />,
                            h3: ({...props}) => <h3 className="text-base font-semibold mt-2 mb-1" {...props} />,
                            ul: ({...props}) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
                            ol: ({...props}) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
                            li: ({...props}) => <li className="leading-relaxed" {...props} />,
                            a: ({href, children, ...props}) => {
                              const isEmail = href?.startsWith('mailto:') || (typeof href === 'string' && href.includes('@') && !href.startsWith('http'));
                              const isPhone = href?.startsWith('tel:') || (typeof href === 'string' && /^[\d\-\+\(\)\s]+$/.test(href?.trim() || '') && (href?.trim() || '').length > 7);

                              if (isEmail) {
                                const email = href?.replace('mailto:', '') || href;
                                return (
                                  <a 
                                    href={`mailto:${email}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/90 text-primary-foreground hover:bg-primary transition-colors text-xs font-medium no-underline ml-1"
                                    {...props}
                                  >
                                    <Mail className="h-3 w-3" />
                                     {children}
                                   </a>
                                 );
                               }
                               
                               if (isPhone) {
                                 const phone = href?.replace('tel:', '') || href;
                                 return (
                                   <a 
                                     href={`tel:${phone}`}
                                     className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/90 text-primary-foreground hover:bg-primary transition-colors text-xs font-medium no-underline ml-1"
                                     {...props}
                                   >
                                     <Phone className="h-3 w-3" />
                                     {children}
                                   </a>
                                 );
                               }
                              
                              return <a href={href} className="text-sky-400 underline hover:text-sky-300" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                            },
                            p: ({...props}) => <p className="mb-3 last:mb-0" {...props} />,
                            table: ({...props}) => <div className="my-3 overflow-x-auto"><table className="w-full text-sm" {...props} /></div>,
                            thead: ({...props}) => <thead className="border-b border-border" {...props} />,
                            tbody: ({...props}) => <tbody {...props} />,
                            tr: ({...props}) => <tr className="border-b border-border/50" {...props} />,
                            th: ({...props}) => <th className="px-3 py-2 text-left font-medium text-foreground" {...props} />,
                            td: ({...props}) => <td className="px-3 py-2 text-muted-foreground" {...props} />,
                          }}
                        >
                          {linkSmartChips(displayContent)}
                        </ReactMarkdown>
                      </div>

                      {/* Action row with source links */}
                      <div className="flex items-center gap-4 text-muted-foreground flex-wrap">
                        <button 
                          onClick={() => navigator.clipboard.writeText(m.content)}
                          className="hover:text-foreground transition-colors"
                          title="Copy"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <FeedbackButtons messageId={m.id} content={m.content} />
                        
                        {/* Source links inline */}
                        {sources.length > 0 && sources.map((source, idx) => (
                          <a 
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/90 text-primary-foreground hover:bg-primary transition-colors text-xs font-medium"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {source.title}
                          </a>
                        ))}
                      </div>
                      
                      {/* Related Questions */}
                      {relatedQuestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {relatedQuestions.map((q, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSuggestionClick(q)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-muted/60 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                              <Sparkles className="w-3 h-3 opacity-60" />
                              {q}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <Sparkles className="h-5 w-5 text-white animate-pulse" />
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

  if (voted) return <span className="text-xs text-muted-foreground">Thanks!</span>;

  return (
    <div className="flex items-center gap-3">
      <button 
        onClick={() => handleVote('up')} 
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>
      <button 
        onClick={() => handleVote('down')} 
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
