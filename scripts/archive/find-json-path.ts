
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('latest_state.json', 'utf-8'));
const SEARCH_TERM = "Hearty Chicken & Rice Soup";

function findPath(obj: any, path: string = ''): string | null {
    if (typeof obj === 'string') {
        if (obj === SEARCH_TERM) return path;
        return null;
    }
    if (obj && typeof obj === 'object') {
        for (const key in obj) {
            const found = findPath(obj[key], path ? `${path}.${key}` : key);
            if (found) return found;
        }
    }
    return null;
}

const pathFound = findPath(data);
console.log('Path:', pathFound);
