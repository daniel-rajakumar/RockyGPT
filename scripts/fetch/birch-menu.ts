import fs from 'fs';
import path from 'path';
import axios from 'axios';

const API_URL = 'https://api-prd.sodexomyway.net/v0.2/data/menu/97508001/15858';
const API_KEY = '68717828-b754-420d-9488-4c37cb7d7ef7';
const OUTPUT_PATH = path.join(__dirname, '../../clean_data/dining/menu.md');

interface MenuItem {
    formalName: string;
    description?: string;
    calories?: string;
    isVegan?: boolean;
    isVegetarian?: boolean;
    isMindful?: boolean;
    isPlantBased?: boolean;
    allergens?: Array<{ name: string }>;
}

interface MenuGroup {
    name: string;
    items: MenuItem[];
}

interface MenuSection {
    name: string;
    groups: MenuGroup[];
}

async function fetchBirchMenu() {
    // Get current date in YYYY-MM-DD format for Eastern Time
    const now = new Date();
    const estString = now.toLocaleDateString('en-US', { 
        timeZone: 'America/New_York', 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    });
    const [month, day, year] = estString.split('/');
    const dateParam = `${year}-${month}-${day}`;
    
    const urlWithDate = `${API_URL}?date=${dateParam}`;
    
    console.log(`Fetching menu from API: ${urlWithDate}`);
    
    try {
        const response = await axios.get(urlWithDate, {
            headers: {
                'API-Key': API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        const menuData: MenuSection[] = response.data;
        
        if (!menuData || menuData.length === 0) {
            console.error('No menu data returned from API');
            return;
        }
        
        console.log(`Successfully fetched ${menuData.length} meal periods from API`);
        
        // Convert to markdown
        let markdown = '# Birch Tree Inn Menu\n\n';
        markdown += `*Last Updated: ${new Date().toLocaleString()}*\n\n`;
        markdown += '---\n\n';
        
        menuData.forEach((section: MenuSection) => {
            markdown += `## ${section.name}\n\n`;
            
            if (section.groups && Array.isArray(section.groups)) {
                section.groups.forEach((group: MenuGroup) => {
                    if (group.name) {
                        markdown += `### ${group.name}\n\n`;
                    }
                    
                    if (group.items && Array.isArray(group.items)) {
                        group.items.forEach((item: MenuItem) => {
                            const name = item.formalName;
                            if (!name) return;
                            
                            let itemLine = `- **${name}**`;
                            
                            if (item.calories) {
                                itemLine += ` (${item.calories} cal)`;
                            }
                            
                            // Collect diet tags
                            const traits: string[] = [];
                            if (item.allergens && Array.isArray(item.allergens)) {
                                item.allergens.forEach((alg: any) => {
                                    if (alg.name) traits.push(alg.name);
                                });
                            }
                            if (item.isVegan) traits.push('Vegan');
                            if (item.isVegetarian) traits.push('Vegetarian');
                            if (item.isMindful) traits.push('Mindful');
                            if (item.isPlantBased) traits.push('Plantbased');
                            
                            if (traits.length > 0) {
                                itemLine += ` _[${traits.join(', ')}]_`;
                            }
                            
                            markdown += `${itemLine}\n`;
                            
                            if (item.description) {
                                markdown += `  > ${item.description}\n`;
                            }
                        });
                        markdown += '\n';
                    }
                });
            }
            
            markdown += '---\n\n';
        });
        
        // Ensure directory exists
        const dir = path.dirname(OUTPUT_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Write to file
        fs.writeFileSync(OUTPUT_PATH, markdown, 'utf-8');
        console.log(`Successfully updated menu in ${OUTPUT_PATH}`);
        
    } catch (error: any) {
        console.error('Error fetching menu:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

fetchBirchMenu();
