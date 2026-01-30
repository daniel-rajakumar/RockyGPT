
import fs from 'fs';
import path from 'path';

const INPUT_FILE = path.join(process.cwd(), 'data/dining_hours.txt');
const OUTPUT_DIR = path.join(process.cwd(), 'clean_data/dining');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'hours.md');

async function cleanHoursData() {
  console.log('Reading dining hours data...');
  if (!fs.existsSync(INPUT_FILE)) {
    console.error('Input file not found:', INPUT_FILE);
    return;
  }

  const rawText = fs.readFileSync(INPUT_FILE, 'utf-8');
  
  // For now, we are just wrapping the text in a markdown code block or keeping it as is, 
  // but let's make it a proper markdown file with headers if possible.
  // The current format is already somewhat structured. Let's just ensure it's saved as .md
  // and maybe add a title if missing.

  let markdown = `# Dining Hours\n\n`;
  markdown += rawText;

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, markdown);
  console.log(`Successfully cleaned dining hours data to ${OUTPUT_FILE}`);
}

cleanHoursData();
