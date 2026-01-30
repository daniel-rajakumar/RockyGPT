import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { searchDocuments } from '@/lib/ai/retrieval';

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]; // User's latest question

    // 1. Retrieve relevant documents (increased limit for comprehensive results)
    console.log(`\x1b[36mSearching for: ${lastMessage.content}\x1b[0m`);
    const relevantDocs = await searchDocuments(lastMessage.content, 30);
    
    // Define Source Mapping
    const sourceMap: Record<string, { title: string; url: string }> = {
      'dining/menu.md': { title: 'Dining Menus', url: 'https://www.ramapo.edu/dining/menus/' },
      'dining/hours.md': { title: 'Dining Hours', url: 'https://www.ramapo.edu/dining/hours/' },
      'hours.md': { title: 'Campus Hours', url: 'https://www.ramapo.edu/about/hours/' },
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
    - If the answer is unknown, politely say so.
    - **COMPLETENESS (CRITICAL)**: When asked for events or lists, show ALL matching items from the context. Do NOT summarize, truncate, or limit results. If there are 10 events, show all 10.
    
    - **Formatting (CRITICAL)**:
      - Use **Markdown** for all responses.
      - **Always BOLD the keys/labels in lists** to highlight them. 
      - Use **Bold** for important locations, terms, or emphasis.
    
    - **CITATIONS (REQUIRED)**:
      - At the very end of your response, list the unique sources you used.
      - Format:
        **Sources:**
        - [Source Title](URL)
      - Only show sources that were actually relevant to the answer.
    
    Context:
    ${context}`;

    // 4. Generate response using OpenAI (SDK 4.0)
    // Convert UI messages to Core messages if necessary (simple text content)
    const coreMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content || (m.parts ? m.parts.map((p: any) => p.text).join('') : '')
    }));

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: coreMessages,
      onFinish: (event) => {
        // Log with Green color
        console.log('\x1b[32mReceived Answer:\x1b[0m', event.text);
      },
    });

    // 5. Stream the response back
    // 5. Stream the response back
    // Fallback to text stream since DataStream is missing in this version
    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
