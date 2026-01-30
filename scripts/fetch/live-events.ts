import fs from 'fs';
import path from 'path';

const ICS_URL = 'https://archway.ramapo.edu/ical/ramapo/ical_ramapo.ics';
const OUTPUT_PATH = path.join(__dirname, '../../clean_data/campus/live-events.md');
const WEEKS_TO_SHOW = null; // Set to number for limited weeks, null for all events

interface Event {
    title: string;
    start: Date;
    end: Date;
    location?: string;
    description?: string;
    organizer?: string;
}

async function fetchEvents() {
    console.log('Fetching campus events from ICS feed...');
    
    try {
        const response = await fetch(ICS_URL);
        const icsData = await response.text();
        
        const events = parseICS(icsData);
        
        // Show date range of all events in feed
        if (events.length > 0) {
            const allDates = events.map(e => e.start).sort((a, b) => a.getTime() - b.getTime());
            const earliest = allDates[0];
            const latest = allDates[allDates.length - 1];
            console.log(`Feed contains ${events.length} total events`);
            console.log(`Date range: ${earliest.toLocaleDateString()} to ${latest.toLocaleDateString()}`);
        }
        
        const upcomingEvents = filterUpcomingEvents(events);
        const markdown = generateMarkdown(upcomingEvents);
        
        // Ensure directory exists
        const dir = path.dirname(OUTPUT_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Write to file
        fs.writeFileSync(OUTPUT_PATH, markdown, 'utf-8');
        
        if (WEEKS_TO_SHOW === null) {
            console.log(`Showing ${upcomingEvents.length} upcoming events (all available)`);
        } else {
            console.log(`Showing ${upcomingEvents.length} upcoming events (next ${WEEKS_TO_SHOW} weeks)`);
        }
        
    } catch (error: any) {
        console.error('Error fetching events:', error.message);
        throw error;
    }
}

function parseICS(icsData: string): Event[] {
    const events: Event[] = [];
    const lines = icsData.split('\n').map(line => line.trim());
    
    let currentEvent: Partial<Event> | null = null;
    let currentField = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line === 'BEGIN:VEVENT') {
            currentEvent = {};
        } else if (line === 'END:VEVENT' && currentEvent) {
            if (currentEvent.title && currentEvent.start) {
                events.push(currentEvent as Event);
            }
            currentEvent = null;
        } else if (currentEvent) {
            // Handle multi-line fields
            if (line.startsWith(' ') || line.startsWith('\t')) {
                // Continuation of previous field
                if (currentField === 'SUMMARY' && currentEvent.title) {
                    currentEvent.title += line.trim();
                } else if (currentField === 'DESCRIPTION' && currentEvent.description) {
                    currentEvent.description += line.trim();
                }
                continue;
            }
            
            const [key, ...valueParts] = line.split(':');
            const value = valueParts.join(':');
            
            const fieldName = key.split(';')[0]; // Remove parameters like DTSTART;TZID=...
            currentField = fieldName;
            
            if (fieldName === 'SUMMARY') {
                currentEvent.title = cleanText(value);
            } else if (fieldName === 'DTSTART') {
                currentEvent.start = parseICSDate(value);
            } else if (fieldName === 'DTEND') {
                currentEvent.end = parseICSDate(value);
            } else if (fieldName === 'LOCATION') {
                currentEvent.location = cleanText(value);
            } else if (fieldName === 'DESCRIPTION') {
                currentEvent.description = cleanText(value);
            } else if (fieldName === 'ORGANIZER') {
                // Extract organizer name from CN parameter if present
                const cnMatch = value.match(/CN=([^:;]+)/);
                if (cnMatch) {
                    currentEvent.organizer = cleanText(cnMatch[1]);
                }
            }
        }
    }
    
    return events;
}

function parseICSDate(dateStr: string): Date {
    // ICS dates are in format: 20260130T190000 or 20260130T190000Z
    const cleaned = dateStr.replace(/[TZ-]/g, '');
    
    const year = parseInt(cleaned.substring(0, 4));
    const month = parseInt(cleaned.substring(4, 6)) - 1; // JS months are 0-indexed
    const day = parseInt(cleaned.substring(6, 8));
    const hour = parseInt(cleaned.substring(8, 10) || '0');
    const minute = parseInt(cleaned.substring(10, 12) || '0');
    
    return new Date(year, month, day, hour, minute);
}

function cleanText(text: string): string {
    return text
        .replace(/\\n/g, ' ')
        .replace(/\\,/g, ',')
        .replace(/\\/g, '')
        .trim();
}

function filterUpcomingEvents(events: Event[]): Event[] {
    const now = new Date();
    
    if (WEEKS_TO_SHOW === null) {
        // Show all upcoming events
        return events
            .filter(event => event.start >= now)
            .sort((a, b) => a.start.getTime() - b.start.getTime());
    }
    
    const weeksFromNow = new Date(now.getTime() + WEEKS_TO_SHOW * 7 * 24 * 60 * 60 * 1000);
    
    return events
        .filter(event => event.start >= now && event.start <= weeksFromNow)
        .sort((a, b) => a.start.getTime() - b.start.getTime());
}

function generateMarkdown(events: Event[]): string {
    let markdown = '# Upcoming Campus Events\n\n';
    markdown += `*Last Updated: ${new Date().toLocaleString()}*\n\n`;
    
    if (WEEKS_TO_SHOW === null) {
        markdown += `*Showing all upcoming events*\n\n`;
    } else {
        markdown += `*Showing events for the next ${WEEKS_TO_SHOW} weeks*\n\n`;
    }
    
    markdown += '---\n\n';
    
    if (events.length === 0) {
        markdown += `**No upcoming events.**\n\n`;
        markdown += 'Check back later or visit CSI for more information.\n';
        return markdown;
    }
    
    // Group by date
    const eventsByDate: { [key: string]: Event[] } = {};
    events.forEach(event => {
        const dateKey = event.start.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        if (!eventsByDate[dateKey]) {
            eventsByDate[dateKey] = [];
        }
        eventsByDate[dateKey].push(event);
    });
    
    // Generate markdown for each date
    Object.entries(eventsByDate).forEach(([date, dayEvents]) => {
        markdown += `## ${date}\n\n`;
        
        dayEvents.forEach(event => {
            const timeStr = event.start.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            
            markdown += `### ${event.title}\n`;
            markdown += `- **Time:** ${timeStr}\n`;
            if (event.location) {
                markdown += `- **Location:** ${event.location}\n`;
            }
            if (event.organizer) {
                markdown += `- **Organizer:** ${event.organizer}\n`;
            }
            if (event.description && event.description.length > 0) {
                markdown += `- **Description:** ${event.description}\n`;
            }
            markdown += '\n';
        });
        
        markdown += '---\n\n';
    });
    
    markdown += '## Want to Add Your Event?\n\n';
    markdown += 'Contact the Center for Student Involvement (CSI):\n';
    markdown += '- **Phone:** 201-684-7593\n';
    markdown += '- **Email:** csi@ramapo.edu\n';
    markdown += '- **Location:** Student Center\n\n';
    
    markdown += '---\n\n';
    markdown += '*This calendar is automatically updated from campus event submissions.*\n';
    
    return markdown;
}

fetchEvents();
