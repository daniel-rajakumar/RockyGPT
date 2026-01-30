
import fs from 'fs';
import path from 'path';

const HTML_FILE = 'latest_menu.html';
const OUTPUT_FILE = 'latest_state.json';

function extractState() {
    const html = fs.readFileSync(HTML_FILE, 'utf-8');
    const marker = 'window.__PRELOADED_STATE__ =';
    const startIndex = html.indexOf(marker);

    if (startIndex !== -1) {
        const contentStart = startIndex + marker.length;
        const scriptEndIndex = html.indexOf('</script>', contentStart);
        if (scriptEndIndex !== -1) {
            let potentialJson = html.substring(contentStart, scriptEndIndex).trim();
            if (potentialJson.endsWith(';')) {
                potentialJson = potentialJson.slice(0, -1);
            }
            try {
                const jsonState = JSON.parse(potentialJson);
                fs.writeFileSync(OUTPUT_FILE, JSON.stringify(jsonState, null, 2));
                console.log(`Saved state to ${OUTPUT_FILE}`);
            } catch (e) {
                console.error('Error parsing JSON:', e);
            }
        }
    } else {
        console.log('Marker not found');
    }
}

extractState();
