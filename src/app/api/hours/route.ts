import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'clean_data', 'dining', 'hours.md');
    const content = await readFile(filePath, 'utf-8');
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error reading hours data:', error);
    return NextResponse.json(
      { error: 'Failed to load hours data' },
      { status: 500 }
    );
  }
}
