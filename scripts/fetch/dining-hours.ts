
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const URL = 'https://ramapo.sodexomyway.com/en-us/locations/hours';
const OUTPUT_FILE = path.join(process.cwd(), 'clean_data/dining/hours.md');

// Define interfaces for the JSON structure
interface LocationFragment {
  type: string;
  content: {
    main: {
      name: string;
      slug: string;
      openingHours: {
        standardHours: Array<{
          days: Array<{ value: string }>;
          hours: Array<{
            allDay: boolean;
            startTime?: { hour: string; minute: string; period: string };
            finishTime?: { hour: string; minute: string; period: string };
            label?: string;
          }>;
        }>;
        seasonalHours: Array<{
          from: string;
          to: string;
          openingHours: Array<{
              days: Array<{ value: string }>;
              hours: Array<{
                  allDay: boolean;
                  startTime?: { hour: string; minute: string; period: string };
                  finishTime?: { hour: string; minute: string; period: string };
                  label?: string;
              }>;
          }>;
        }>;
      };
    };
  };
}

interface PreloadedState {
  composition: {
    subject: {
      regions: Array<{
        fragments: LocationFragment[];
      }>;
    };
  };
}

async function fetchDiningHours() {
  console.log('Fetching dining hours from:', URL);
  try {
    const response = await axios.get(URL);
    const html = response.data;
    
    const marker = 'window.__PRELOADED_STATE__ =';
    const startIndex = html.indexOf(marker);

    let jsonState: PreloadedState | null = null;

    if (startIndex !== -1) {
        // console.log(`Found marker at index ${startIndex}`);
        const contentStart = startIndex + marker.length;
        const scriptEndIndex = html.indexOf('</script>', contentStart);
        if (scriptEndIndex !== -1) {
             let potentialJson = html.substring(contentStart, scriptEndIndex).trim();
             if (potentialJson.endsWith(';')) {
                 potentialJson = potentialJson.slice(0, -1);
             }
             try {
                 jsonState = JSON.parse(potentialJson) as PreloadedState;
             } catch (e) {
                 console.error('Error parsing JSON from substring:', e);
             }
        }
    }

    if (!jsonState) {
      console.error('Could not parse preloaded state');
      return;
    }

    let markdown = '# Dining Hours\n\n';
    markdown += `*Last Updated: ${new Date().toLocaleString()}*\n\n`;
    
    // Helper to format time
    const formatTime = (time: { hour: string; minute: string; period: string }) => {
        return `${time.hour}:${time.minute} ${time.period}`;
    };

    // Helper to format hours array
    const formatHoursList = (hoursList: any[]) => {
       return hoursList.map((h: any) => {
           if (h.allDay) return 'Open 24 Hours';
           
           let timeRange = '';
           if (h.startTime && h.finishTime) {
               timeRange = `${formatTime(h.startTime)} - ${formatTime(h.finishTime)}`;
           }
           
           if (h.label) {
               return timeRange ? `${h.label}: ${timeRange}` : h.label;
           }
           
           return timeRange || 'Closed';
       }).join('\n  '); // Join with newline and indent for better readability if multiple slots
    };

    const state = jsonState as PreloadedState;
    
    if (state.composition && state.composition.subject && state.composition.subject.regions) {
        state.composition.subject.regions.forEach((region, regionIndex) => {
            if (region.fragments) {
                region.fragments.forEach((fragment: LocationFragment, fragmentIndex) => {
                    if (fragment.type === 'Location') {
                        const name = fragment.content.main.name;
                        
                        // Check if this fragment has openingHours nested in main
                        const openingHours = fragment.content.main.openingHours;

                        if (openingHours) {
                             console.log(`Found complete data for "${name}"`);
                             
                             // Only add to markdown if we haven't added it yet (deduplication)
                             if (!markdown.includes(`## ${name}`)) {
                                 markdown += `## ${name}\n\n`;
                                 
                                 // openingHours is already defined from fragment.content.main.openingHours
                                 const now = new Date();
                                 let foundActiveSeason = false;
                                 
                                 if (openingHours.seasonalHours && openingHours.seasonalHours.length > 0) {
                                    for (const season of openingHours.seasonalHours) {
                                        const formDate = new Date(season.from);
                                        const toDate = new Date(season.to);
                                        if (now >= formDate && now <= toDate) {
                                             markdown += `### Special Hours (${formDate.toLocaleDateString()} - ${toDate.toLocaleDateString()})\n`;
                                             if (season.openingHours) {
                                                 season.openingHours.forEach((group: any) => {
                                                     const days = group.days.map((d: any) => d.value).join(', ') || 'Daily';
                                                     const hoursText = formatHoursList(group.hours);
                                                     markdown += `- **${days}**: ${hoursText}\n`;
                                                 });
                                             }
                                             markdown += '\n';
                                             foundActiveSeason = true;
                                        }
                                    }
                                }
                                
                                if (!foundActiveSeason) {
                                     if (openingHours.standardHours && openingHours.standardHours.length > 0) {
                                        markdown += `### Regular Hours\n`;
                                        openingHours.standardHours.forEach((group: any) => {
                                            const days = group.days.map((d: any) => d.value).join(', ');
                                            const hoursText = formatHoursList(group.hours);
                                            markdown += `- **${days}**: ${hoursText}\n`;
                                        });
                                        markdown += '\n';
                                    } else {
                                         markdown += `*Hours not available*\n\n`;
                                    }
                                }
                             }
                        } else {
                            if (name.startsWith("Dunkin")) {
                                console.log(`Skipping incomplete fragment for "${name}" in Region ${regionIndex}`);
                            }
                        }
                    }
                });
            }
        });
    }

    fs.writeFileSync(OUTPUT_FILE, markdown);
    console.log(`Successfully updated dining hours in ${OUTPUT_FILE}`);

  } catch (error) {
    console.error('Error fetching dining data:', error);
  }
}

fetchDiningHours();
