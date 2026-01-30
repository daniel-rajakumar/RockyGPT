
import fs from 'fs';

const content = fs.readFileSync('beef_check.txt', 'utf-8');
const marker = 'window.__PRELOADED_STATE__ =';
const startIndex = content.indexOf(marker);

if (startIndex !== -1) {
    let jsonStr = content.substring(startIndex + marker.length);
    // Remove potential trailing semicolon or script tags if present (though beef_check.txt might just be the line)
    // The grep output likely was just the line.
    // In step 243, line 1 starts with window.__PRELOADED...
    // Let's assume valid JSON is from the brace.
    const jsonStart = jsonStr.indexOf('{');
    jsonStr = jsonStr.substring(jsonStart);
    
    // Attempt parse
    try {
        const data = JSON.parse(jsonStr);
        // Find all items with course "SOUP"
        
        function findSoups(obj: any) {
             if (!obj || typeof obj !== 'object') return;
             if (obj.course === 'SOUP' || obj.formalName?.toLowerCase().includes('soup') || obj.formalName?.toLowerCase().includes('chili')) {
                 console.log('Found Soup/Chili Item:', JSON.stringify(obj, null, 2));
             }
             
             if (Array.isArray(obj)) {
                 obj.forEach(findSoups);
             } else {
                 Object.values(obj).forEach(findSoups);
             }
        }
        
        findSoups(data);
        
    } catch (e) {
        // parsing might fail if the file is truncated or has extra junk
        console.error("Parse error (might need trimming):", e.message);
        // Try strict trimming
        const lastBrace = jsonStr.lastIndexOf('}');
        if (lastBrace !== -1) {
            try {
                const fixedJson = jsonStr.substring(0, lastBrace + 1);
                const data = JSON.parse(fixedJson);
                console.log("Parsed after trimming!");
                 function findSoups(obj: any) {
                     if (!obj || typeof obj !== 'object') return;
                     if (Array.isArray(obj)) obj.forEach(findSoups);
                     else {
                         if (obj.course === 'SOUP' || (obj.formalName && (obj.formalName.includes('Soup') || obj.formalName.includes('Chili')))) {
                              console.log('Found:', obj.formalName, 'Meal:', obj.meal);
                         }
                         Object.values(obj).forEach(findSoups);
                     }
                }
                findSoups(data);
            } catch (e2) {
                console.error("Still failed", e2.message);
            }
        }
    }
} else {
    console.log("Marker not found");
}
