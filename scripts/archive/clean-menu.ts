
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const INPUT_FILE = path.join(process.cwd(), 'data/menu.txt');
const OUTPUT_DIR = path.join(process.cwd(), 'clean_data/dining');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'menu.md');

async function cleanMenuData() {
  console.log('Reading menu data...');
  if (!fs.existsSync(INPUT_FILE)) {
    console.error('Input file not found:', INPUT_FILE);
    return;
  }

  const html = fs.readFileSync(INPUT_FILE, 'utf-8');
  const $ = cheerio.load(html);
  let markdown = '';

  // 1. Extract Location Name
  const locationName = $('h1.custom-h1').first().text().trim();
  if (locationName) {
    markdown += `# ${locationName}\n\n`;
    markdown += `*Last Fetched: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}*\n\n`;
  }


  // 2. Extract Hours
  markdown += `## Hours of Operation\n\n`;
  const regularHours = $('.LocationHoursstyles__RegularHours-sc-mav2j8-4'); // "Regular Hours"
  
  // Find the container that holds the hours details
  const hoursContainer = $('.LocationHoursstyles__HoursContainer-sc-mav2j8-1');
  
  hoursContainer.find('.LocationHoursstyles__HoursDetail-sc-mav2j8-2').each((_, detail) => {
      const days = $(detail).find('.days-label').text().trim();
      markdown += `### ${days}\n`;
      
      $(detail).find('.open-hours-container').each((_, row) => {
          const type = $(row).find('span').first().text().replace(':', '').trim(); // Breakfast, Lunch, etc.
          const time = $(row).find('span').last().text().trim();
          markdown += `- **${type}**: ${time}\n`;
      });
      markdown += '\n';
  });

  // 3. Extract Menu Items
  markdown += `## Menu\n\n`;
  
  // Iterate over each meal section (Lunch, Dinner, Late Night)
  $('.Menustyles__MenuMealSection-sc-eo2633-2').each((_, mealSection) => {
    const mealName = $(mealSection).find('.header h3').first().text().trim();
    if (!mealName) return;

    markdown += `### ${mealName}\n\n`;

    // Iterate over courses within the meal (Deli, Grill, etc.)
    $(mealSection).find('section[class^="MenuCourseSectionstyles"]').each((_, courseSection) => {
        const courseName = $(courseSection).find('h3').first().text().trim();
        if (courseName) {
            markdown += `#### ${courseName}\n`;
        }

        // Iterate over items
        $(courseSection).find('.menu-item-container').each((_, itemContainer) => {
            const name = $(itemContainer).find('.name').text().trim();
            const calories = $(itemContainer).find('.calories').text().trim();
            
            // Extract dietary icons/allergens
            const allergens: string[] = [];
            $(itemContainer).find('.icons img').each((_, img) => {
                const alt = $(img).attr('alt');
                if (alt) allergens.push(alt);
            });

            if (name) {
                let itemLine = `- **${name}**`;
                if (calories) itemLine += ` (${calories})`;
                if (allergens.length > 0) itemLine += ` _[${allergens.join(', ')}]_`;
                markdown += `${itemLine}\n`;
            }
        });
        markdown += '\n';
    });
  });

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, markdown);
  console.log(`Successfully cleaned menu data to ${OUTPUT_FILE}`);
}

cleanMenuData();
