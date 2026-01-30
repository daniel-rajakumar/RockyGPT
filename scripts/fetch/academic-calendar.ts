import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const OUTPUT_PATH = path.join(__dirname, '../../clean_data/academic/calendar.md');

interface CalendarEvent {
    date: string;
    title: string;
    description?: string;
}

interface Semester {
    name: string;
    events: CalendarEvent[];
}

async function fetchAcademicCalendar() {
    console.log('Launching browser to fetch academic calendar...');
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        const semesters: Semester[] = [];
        
        // Fetch current calendars (Spring 2026)
        console.log('Fetching current calendars...');
        await page.goto('https://www.ramapo.edu/academic-calendars/', { waitUntil: 'networkidle' });
        
        const currentData = await page.evaluate(() => {
            const semester = {
                name: "Spring 2026",
                events: [] as any[]
            };
            
            const eventNodes = document.querySelectorAll('.ramapo-tribe-event-body');
            eventNodes.forEach(node => {
                const month = node.querySelector('.month')?.textContent?.trim();
                const day = node.querySelector('.date')?.textContent?.trim();
                const title = node.querySelector('.ramapo-tribe-event-title a')?.textContent?.trim();
                const description = node.querySelector('.ramapo-tribe-event-time')?.textContent?.trim();
                
                if (title) {
                    semester.events.push({
                        date: month && day ? `${month} ${day}` : "Unknown",
                        title: title,
                        description: description || ""
                    });
                }
            });
            
            return semester;
        });
        
        if (currentData.events.length > 0) {
            semesters.push(currentData);
        }
        
        // Fetch future calendars
        console.log('Fetching future calendars...');
        await page.goto('https://www.ramapo.edu/academic-calendars/future-calendars/', { waitUntil: 'networkidle' });
        
        const futureData = await page.evaluate(() => {
            const semesters: any[] = [];
            const sections = document.querySelectorAll('.collapsableContent');
            
            sections.forEach(section => {
                const titleEl = section.querySelector('.collapsableTitle');
                const name = titleEl ? titleEl.textContent?.trim() : "Unknown Semester";
                
                const semester = {
                    name: name || "Unknown",
                    events: [] as any[]
                };
                
                const eventNodes = section.querySelectorAll('.ramapo-tribe-event-body');
                eventNodes.forEach(node => {
                    const month = node.querySelector('.month')?.textContent?.trim();
                    const day = node.querySelector('.date')?.textContent?.trim();
                    const title = node.querySelector('.ramapo-tribe-event-title a')?.textContent?.trim();
                    const description = node.querySelector('.ramapo-tribe-event-time')?.textContent?.trim();
                    
                    if (title) {
                        semester.events.push({
                            date: month && day ? `${month} ${day}` : "Unknown",
                            title: title,
                            description: description || ""
                        });
                    }
                });
                
                if (semester.events.length > 0) {
                    semesters.push(semester);
                }
            });
            
            return semesters;
        });
        
        semesters.push(...futureData);
        
        console.log(`Successfully fetched ${semesters.length} semesters`);
        
        // Convert to markdown
        let markdown = '# Ramapo College Academic Calendar\n\n';
        markdown += `*Last Updated: ${new Date().toLocaleString()}*\n\n`;
        markdown += '---\n\n';
        
        semesters.forEach(semester => {
            markdown += `## ${semester.name}\n\n`;
            
            semester.events.forEach(event => {
                markdown += `### ${event.date} - ${event.title}\n`;
                if (event.description) {
                    markdown += `> ${event.description}\n`;
                }
                markdown += '\n';
            });
            
            markdown += '---\n\n';
        });
        
        // Ensure directory exists
        const dir = path.dirname(OUTPUT_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Write to file
        fs.writeFileSync(OUTPUT_PATH, markdown, 'utf-8');
        console.log(`Successfully updated calendar in ${OUTPUT_PATH}`);
        
    } catch (error: any) {
        console.error('Error fetching calendar:', error.message);
        throw error;
    } finally {
        await browser.close();
    }
}

fetchAcademicCalendar();
