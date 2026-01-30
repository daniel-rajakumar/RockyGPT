import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Force dynamic to ensure we always serve the latest file content
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'clean_data/dining/menu.md');
    
    // Read the file asynchronously
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    return NextResponse.json({ 
      content: fileContent,
      success: true
    });
    
  } catch (error) {
    console.error('Error serving menu file:', error);
    return NextResponse.json(
      { error: 'Menu data unavailable' }, 
      { status: 404 }
    );
  }
}
