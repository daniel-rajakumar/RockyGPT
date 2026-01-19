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
    console.log(`Searching for: ${lastMessage.content}`);
    const relevantDocs = await searchDocuments(lastMessage.content, 3);
    
    // 2. Format context
    const context = relevantDocs.map(doc => `[Source: ${doc.metadata.source}]\n${doc.content}`).join('\n\n');
    
    // 3. Construct system prompt
    const systemPrompt = `You are RockyGPT, a helpful campus chatbot. 
    You answer questions based ONLY on the provided context.
    If the answer is not in the context, say "I'm not sure based on the information I have."
    Always cite your sources if possible (the context includes source names).
    
    Context:
    ${context}`;

    // 4. Generate response using OpenAI (SDK 4.0)
    const result = await streamText({
      model: openai('gpt-3.5-turbo'),
      system: systemPrompt,
      messages,
    });

    // 5. Stream the response back
    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
