// Simple in-memory response cache
// Cache common queries to reduce API costs and improve response time
interface CacheEntry {
  response: string;
  timestamp: number;
}

const responseCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getCachedResponse(query: string): string | null {
  const normalized = query.toLowerCase().trim();
  const cached = responseCache.get(normalized);
  
  if (!cached) return null;
  
  // Check if cache is still valid
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    responseCache.delete(normalized);
    return null;
  }
  
  return cached.response;
}

export function setCachedResponse(query: string, response: string): void {
  const normalized = query.toLowerCase().trim();
  responseCache.set(normalized, {
    response,
    timestamp: Date.now()
  });
  
  // Cleanup old entries (keep cache size manageable)
  if (responseCache.size > 100) {
    const oldestKey = Array.from(responseCache.keys())[0];
    if (oldestKey) {
      responseCache.delete(oldestKey);
    }
  }
}

// Common queries that should be cached
export const CACHEABLE_QUERIES = [
  'dining hours',
  'what are dining hours',
  'when is dining open',
  'parking',
  'where can i park',
  'how do i print',
  'printing',
  'wifi password',
  'wifi',
  'help desk',
  'it support',
  'library hours',
  'gym hours',
  'events',
  'calendar',
];

export function shouldCache(query: string): boolean {
  const normalized = query.toLowerCase().trim();
  return CACHEABLE_QUERIES.some(q => normalized.includes(q));
}
