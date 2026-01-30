import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { searchDocuments } from '@/lib/ai/retrieval';
import { ratelimit, getIdentifier } from '@/lib/rate-limit';
import { getCachedResponse, setCachedResponse, shouldCache } from '@/lib/response-cache';

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const startTime = Date.now();
  
  // === RATE LIMITING ===
  const identifier = getIdentifier(req);
  const { success, limit, remaining, reset } = await ratelimit.limit(identifier);
  
  if (!success) {
    const waitTime = Math.ceil((reset - Date.now()) / 1000);
    console.log('\x1b[33m⚠ Rate limit exceeded\x1b[0m', {
      identifier,
      limit,
      resetIn: `${waitTime}s`
    });
    
    return new Response(
      JSON.stringify({ 
        error: `Too many requests. Please wait ${waitTime} seconds and try again.`,
        retryAfter: waitTime
      }), 
      { 
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(reset).toISOString(),
          'Retry-After': waitTime.toString()
        } 
      }
    );
  }
  
  // Log successful rate limit check
  console.log('\x1b[36m✓ Rate limit OK\x1b[0m', {
    identifier,
    remaining: `${remaining}/${limit}`
  });
  
  try {
    const { messages } = await req.json();
    
    // === REQUEST VALIDATION ===
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array is required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const lastMessage = messages[messages.length - 1];
    
    // Validate message content
    if (!lastMessage?.content || typeof lastMessage.content !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid request: message content is required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Limit message length (prevent abuse)
    const MAX_MESSAGE_LENGTH = 1000;
    if (lastMessage.content.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Message too long. Please keep it under ${MAX_MESSAGE_LENGTH} characters.` }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Limit conversation history (prevent massive context)
    const MAX_HISTORY = 20;
    const trimmedMessages = messages.slice(-MAX_HISTORY);

    // === RESPONSE CACHING ===
    // Check if this is a cacheable query
    if (shouldCache(lastMessage.content)) {
      const cached = getCachedResponse(lastMessage.content);
      if (cached) {
        console.log('\x1b[35m⚡ Cache HIT\x1b[0m', {
          query: lastMessage.content.substring(0, 50) + '...',
          savedTime: `${Date.now() - startTime}ms`
        });
        
        // Return cached response as a stream
        return new Response(cached, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Cache-Status': 'HIT'
          }
        });
      }
      console.log('\x1b[35m○ Cache MISS\x1b[0m - will cache response');
    }

    // 1. Retrieve relevant documents (increased limit for comprehensive results)
    console.log(`\x1b[36mSearching for: ${lastMessage.content}\x1b[0m`);
    const relevantDocs = await searchDocuments(lastMessage.content, 30);
    
    // Define Source Mapping
    const sourceMap: Record<string, { title: string; url: string }> = {
      'dining/menu.md': { title: 'Dining Menus', url: 'https://ramapodining.sodexomyway.com/' },
      'dining/hours.md': { title: 'Dining Hours', url: 'https://ramapodining.sodexomyway.com/dining-near-me/hours' },
      'campus/hours.md': { title: 'Campus Hours', url: 'https://www.ramapo.edu/about/hours/' },
      'academic/calendar.md': { title: 'Academic Calendar', url: 'https://www.ramapo.edu/academic-calendars/' },
      'campus/live-events.md': { title: 'Archway Events', url: 'https://archway.ramapo.edu/events' },
      'campus/events.md': { title: 'Campus Events', url: 'https://www.ramapo.edu/events/' },
      'academic/tuition.md': { title: 'Tuition & Costs', url: 'https://www.ramapo.edu/student-accounts/tuition/' },
      'campus/parking.md': { title: 'Parking Services', url: 'https://www.ramapo.edu/publicsafety/parking/' },
      'campus/buildings.md': { title: 'Campus Map', url: 'https://www.ramapo.edu/map/' },
      'academic/office-hours.md': { title: 'Office Hours', url: 'https://www.ramapo.edu/academics/' },
      'academic/procedures.md': { title: 'Academic Procedures', url: 'https://www.ramapo.edu/registrar/' },
      'campus/directory.md': { title: 'Campus Directory', url: 'https://www.ramapo.edu/directory/' },
      'campus/safety.md': { title: 'Public Safety', url: 'https://www.ramapo.edu/publicsafety/' },
      'campus/transportation.md': { title: 'Transportation', url: 'https://www.ramapo.edu/transportation/' },
      'campus/technology.md': { title: 'ITS Help Desk', url: 'https://www.ramapo.edu/its/' },
      'financial_aid/README.md': { title: 'Financial Aid', url: 'https://www.ramapo.edu/finaid/' },
      'housing/README.md': { title: 'Residence Life', url: 'https://www.ramapo.edu/reslife/' },
      // Expanded Coverage
      'academics/README.md': { title: 'Academics', url: 'https://www.ramapo.edu/academics/' },
      'athletics/README.md': { title: 'Athletics', url: 'https://ramapoathletics.com/' },
      'career_services/README.md': { title: 'Cahill Career Center', url: 'https://www.ramapo.edu/careercenter/' },
      'clubs/README.md': { title: 'Clubs & Orgs', url: 'https://www.ramapo.edu/clubs/' },
      'events/README.md': { title: 'Campus Events', url: 'https://www.ramapo.edu/events/' },
      'offices/README.md': { title: 'Directory', url: 'https://www.ramapo.edu/directory/' },
      'policies/README.md': { title: 'Student Handbook', url: 'https://www.ramapo.edu/student-conduct/student-handbook/' },
      'safety/README.md': { title: 'Public Safety', url: 'https://www.ramapo.edu/publicsafety/' },
      'services/README.md': { title: 'Student Services', url: 'https://www.ramapo.edu/students/' },
      'technology/README.md': { title: 'ITS Help Desk', url: 'https://www.ramapo.edu/its/' },
      'transportation/README.md': { title: 'Transportation', url: 'https://www.ramapo.edu/transportation/' },
      'wellness/README.md': { title: 'Health & Wellness', url: 'https://www.ramapo.edu/health/' },
      'default': { title: 'Ramapo College Website', url: 'https://www.ramapo.edu/' }
    };

    // 2. Format context with mapped sources
    const context = relevantDocs.map(doc => {
      const filename = doc.metadata.source;
      // Handle both "dining/menu.md" and just "menu.md" if paths vary
      const mapping = sourceMap[filename] || 
                      Object.entries(sourceMap).find(([key]) => filename.endsWith(key))?.[1] || 
                      sourceMap['default'];
      
      return `[Source: ${mapping.title} (${mapping.url})]\n${doc.content}`;
    }).join('\n\n');
    
    // 3. Construct system prompt
    const now = new Date();
    const currentTimestamp = now.toLocaleString('en-US', { 
      timeZone: 'America/New_York', 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: 'numeric',
      hour12: true 
    });

    const systemPrompt = `You are RockyGPT, the helpful AI assistant for Ramapo College.
    
    Current Date & Time: ${currentTimestamp}
    
    Instructions:
    - Answer based ONLY on the provided Context, EXCEPT for date/time references.
    - **CALENDAR LOGIC**: You SHOULD calculate relative dates (e.g., "tomorrow", "this weekend") based on the "Current Date & Time" provided above.
    - **HELPFUL & PROACTIVE**: When nothing is happening RIGHT NOW, suggest what's NEXT. Example: "No events right now, but here's what's coming up next: [next event]"
    - **FRIENDLY TONE**: Be conversational and helpful, like a friendly campus assistant.
    - If the answer is unknown, politely say so.
    - **COMPLETENESS (CRITICAL)**: When asked for events or lists, show ALL matching items from the context. Do NOT summarize, truncate, or limit results. If there are 10 events, show all 10.
    
      - **SCHEDULE/TIME QUERIES (CRITICAL)**:
      - **"Next" Query:** If user asks for "next bus", provide ONLY the immediate next option (Single Item).
      - **"Today/Schedule" Query:** If user asks "bus times today" or "shuttle schedule", show a **TABLE** of all remaining future times for the day.
      - **ALWAYS compare against current time:** If it's 8:38 AM and the schedule shows 8:25 AM, that bus is GONE. Filter past times.
    
    - **Formatting (CRITICAL)**:
      - Use **Markdown** for all responses.
      - **Formatting Pattern**: Use **Key:** Value format (bold the key AND the colon) for ALL list items.
      - **Explicitly BOLD these labels**: **Breakfast:**, **Lunch:**, **Dinner:**, **Late Night:**, **Monday:**, etc.
      
      - **USE TABLES for Structured Data**:
        - For **Weekly Hours**, **Bus Schedules**, or **Menus**, ALWAYS use a Markdown Table.
        - Tables are cleaner and easier to read than lists.
      
      **Example Table (Schedules):**
      | Day | Hours |
      | :--- | :--- |
      | **Mon-Fri** | 07:30 AM - 08:00 PM |
      | **Sat-Sun** | Closed |

      **Example Table (Menus):**
      | Station | Item | Details |
      | :--- | :--- | :--- |
      | **Grill** | Cheeseburger | 450 cal, w/ fries |
      | **Entree** | Grilled Salmon | [GF] lemon butter |

      - Use **Bold** for important locations, terms, or emphasis.
      - **Keep responses COMPACT** - avoid excessive bullets, put details inline when possible.
      - **NEVER create empty bullet points**. Every bullet (•) MUST have text on the same line.
      
      **EVENTS - Use this format:**
      **Event Name** - Time and Date
      📍 Location
      Brief description here.
      
      **WRONG - Don't do this:**
      • Event Name
      • Time: 4:00 PM
      • Location: Bradley Center
      • Description: Details here
    
    - **RELATED QUESTIONS (REQUIRED)**:
      - At the very end of your response, after citations, you MUST suggest 3 relevant follow-up questions.
      - Use the delimiter '<<RELATED>>' on a new line before the questions.
      - One question per line.
      - Questions MUST be **VERY SHORT (max 6 words)** to fit in buttons.
      - Example: "Dining hours today?", "Next bus?", "Events tonight?"
      
      Example Format:
      [Your main answer here...]
      
      **Sources:**
      - [Source Title](URL)
      
      <<RELATED>>
      What's the next bus?
      Is the dining hall open?
      Any events tonight?
    
    Context:
    ${context}`;

    // 4. Generate response using OpenAI (SDK 4.0)
    // Convert UI messages to Core messages if necessary (simple text content)
    const coreMessages = trimmedMessages.map((m: any) => ({
      role: m.role,
      content: m.content || (m.parts ? m.parts.map((p: any) => p.text).join('') : '')
    }));

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: coreMessages,
      onFinish: (event) => {
        // === USAGE LOGGING ===
        const responseTime = Date.now() - startTime;
        console.log('\x1b[32m✓ Request Complete\x1b[0m', {
          timestamp: new Date().toISOString(),
          query: lastMessage.content.substring(0, 50) + (lastMessage.content.length > 50 ? '...' : ''),
          tokensUsed: event.usage?.totalTokens || 0,
          responseTime: `${responseTime}ms`,
          messagesInHistory: trimmedMessages.length
        });
        
        // === CACHE RESPONSE ===
        if (shouldCache(lastMessage.content) && event.text) {
          setCachedResponse(lastMessage.content, event.text);
          console.log('\x1b[35m💾 Cached response\x1b[0m');
        }
      },
    });

    // 5. Stream the response back
    return result.toTextStreamResponse();

  } catch (error: any) {
    // === BETTER ERROR HANDLING ===
    console.error('Chat API Error:', error);
    
    const responseTime = Date.now() - startTime;
    console.error('\x1b[31m✗ Request Failed\x1b[0m', {
      timestamp: new Date().toISOString(),
      error: error.message,
      responseTime: `${responseTime}ms`
    });
    
    // Handle specific error types with user-friendly messages
    if (error.message?.includes('rate limit') || error.status === 429) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please wait a moment and try again.' }), 
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      return new Response(
        JSON.stringify({ error: 'Request timed out. Please try again.' }), 
        { status: 504, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (error.message?.includes('API key') || error.status === 401) {
      console.error('CRITICAL: API Key issue detected');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable. Please try again later.' }), 
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Generic error fallback
    return new Response(
      JSON.stringify({ error: 'Sorry, something went wrong. Please try again.' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
