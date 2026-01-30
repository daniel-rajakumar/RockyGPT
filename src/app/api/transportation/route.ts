import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'clean_data', 'campus', 'transportation.md');
    const content = await readFile(filePath, 'utf-8');
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error reading transportation data:', error);
    return NextResponse.json(
      { error: 'Failed to load transportation data' },
      { status: 500 }
    );
  }
}
