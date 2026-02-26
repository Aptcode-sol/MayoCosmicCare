const fs = require('fs');

const origPath = 'src/routes/adminAnalytics.js';
const newPath = 'src/routes/adminAnalytics.js.new';

let content = fs.readFileSync(origPath, 'utf8');

// Regex to capture "const X = await prisma.Y(...);"
const regex = /^(\s*)const\s+([a-zA-Z0-9_]+)\s*=\s*await\s+(prisma\..+?);/gm;

let match;
let queries = [];
let queryVars = [];
let indentation = '        ';

while ((match = regex.exec(content)) !== null) {
    // Only capture prisma queries
    if (match[3].startsWith('prisma.')) {
        queryVars.push(match[2]);
        queries.push(`${indentation}${indentation}${match[3]}`);
    }
}

// Ensure unique queryVars
const uniqueQueryVars = [...new Set(queryVars)];

let promiseAllBlock = `${indentation}const [\n${indentation}    ${uniqueQueryVars.join(',\n' + indentation + '    ')}\n${indentation}] = await Promise.all([\n${queries.join(',\n')}\n${indentation}]);\n\n`;

let newContent = content.replace(regex, (matchFull, indent, varName, query) => {
    if (uniqueQueryVars.includes(varName)) {
        return `${indent}// ${varName} fetched in Promise.all`;
    }
    return matchFull;
});

// Insert the Promise.all at the start of metrics
const insertionPoint = '// ===== USER METRICS =====';
newContent = newContent.replace(insertionPoint, insertionPoint + '\n' + promiseAllBlock);

fs.writeFileSync(newPath, newContent);
console.log('Refactored and saved to ' + newPath);
