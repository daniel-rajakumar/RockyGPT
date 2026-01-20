import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { searchDocuments } from '@/lib/ai/retrieval';

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]; // User's latest question

    // 1. Retrieve relevant documents
    // 1. Retrieve relevant documents
    console.log(`\x1b[36mSearching for: ${lastMessage.content}\x1b[0m`);
    const relevantDocs = await searchDocuments(lastMessage.content, 15);
    
    // 2. Format context
    const context = relevantDocs.map(doc => `[Source: ${doc.metadata.source}]\n${doc.content}`).join('\n\n');
    
    // 3. Construct system prompt
    const systemPrompt = `You are RockyGPT, the helpful AI assistant for Ramapo College.
    
    Instructions:
    - Answer based ONLY on the provided Context.
    - If the answer is unknown, politely say so.
    - **Formatting (CRITICAL)**:
      - Use **Markdown** for all responses.
      - **Always BOLD the keys/labels in lists** to highlight them. 
      - Use **Bold** for important locations, terms, or emphasis.
    
    - **Data Handling (CRITICAL)**:
      1. **Extraction**: Identify all items matching the user's request.
      2. **Deduplication**: If the same item appears multiple times (e.g., in different menus), **combine them** and show it ONLY once.
      3. **Sorting**: If asked to sort (e.g., by calories), you MUST:
         - Extract the numerical value.
         - Sort strictly by that number.
         - Double-check the order before outputting.
    
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
