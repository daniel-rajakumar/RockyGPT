import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query, response, rating, comment } = await req.json();

    if (!query || !response || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await db.query(
      'INSERT INTO feedback (query, response, rating, comment) VALUES ($1, $2, $3, $4)',
      [query, response, rating, comment || null]
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Feedback API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
