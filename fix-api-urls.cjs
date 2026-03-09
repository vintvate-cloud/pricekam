const fs = require('fs');
const path = require('path');

const directory = 'd:/client project/joyful-cart/joyful-cart/src';

function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            walk(filePath);
        } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
            let content = fs.readFileSync(filePath, 'utf8');
            const originalContent = content;

            // Match exactly "const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';"
            // and replace with import from @/lib/api-config
            const pattern = /const API_URL = import\.meta\.env\.VITE_API_URL \|\| ['"]http:\/\/localhost:5001\/api['"];/g;

            if (pattern.test(content)) {
                // Remove the local declaration
                content = content.replace(pattern, '');

                // Add the import at the top (after other imports)
                if (!content.includes("import { API_URL } from '@/lib/api-config'")) {
                    const lines = content.split('\n');
                    let lastImportIndex = -1;
                    for (let i = 0; i < lines.length; i++) {
                        if (lines[i].trim().startsWith('import ')) {
                            lastImportIndex = i;
                        }
                    }
                    lines.splice(lastImportIndex + 1, 0, "import { API_URL } from '@/lib/api-config';");
                    content = lines.join('\n');
                }

                if (content !== originalContent) {
                    fs.writeFileSync(filePath, content);
                    console.log(`Updated: ${filePath}`);
                }
            }
        }
    });
}

walk(directory);
