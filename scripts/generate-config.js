const fs = require('fs');
const path = require('path');

const NOTES_DIR = path.join(__dirname, '..', 'Notes');
const CONFIG_FILE = path.join(__dirname, '..', 'assets', 'js', 'config.js');

const COURSE_MAPPING = {
  'MAD2 (Modern Application Development II)': 'mad2',
  'MLT (Machine Learning Techniques)': 'mlt'
};

function generateConfig() {
  console.log('Scanning directories for course notes...');
  const structures = {};

  try {
    // Read course directories
    if (!fs.existsSync(NOTES_DIR)) {
      throw new Error(`Notes directory not found at: ${NOTES_DIR}`);
    }

    const courseFolders = fs.readdirSync(NOTES_DIR);
    
    for (const folder of courseFolders) {
      const courseId = COURSE_MAPPING[folder];
      if (!courseId) continue; // Skip non-course directories

      const coursePath = path.join(NOTES_DIR, folder);
      if (!fs.statSync(coursePath).isDirectory()) continue;

      structures[courseId] = [];

      // Scan for Week directories
      const weekFolders = fs.readdirSync(coursePath)
        .filter(f => {
          const fullPath = path.join(coursePath, f);
          return fs.statSync(fullPath).isDirectory() && /^Week/i.test(f);
        })
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

      for (const weekFolder of weekFolders) {
        const weekPath = path.join(coursePath, weekFolder);
        
        // Scan for HTML files (excluding index.html and hidden files)
        const lectures = fs.readdirSync(weekPath)
          .filter(f => {
            const filePath = path.join(weekPath, f);
            return fs.statSync(filePath).isFile() && 
                   f.endsWith('.html') && 
                   f.toLowerCase() !== 'index.html' && 
                   !f.startsWith('.');
          })
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

        // Only add weeks that have at least one lecture note
        if (lectures.length > 0) {
          structures[courseId].push({
            weekName: weekFolder,
            lectures: lectures
          });
        }
      }
    }

    // Wrap the JSON config in a global JavaScript variable declaration
    const configContent = `// Static configuration for IITM Notes Portal SPAs
// Generated automatically. Do not edit manually.
const COURSE_STRUCTURES = ${JSON.stringify(structures, null, 2)};
`;

    // Ensure assets/js folder exists
    const configDir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(CONFIG_FILE, configContent, 'utf-8');
    console.log(`Successfully generated config.js at: ${CONFIG_FILE}`);
  } catch (err) {
    console.error('Error generating configuration:', err.message);
  }
}

// Check for watch flag
const isWatch = process.argv.includes('--watch');

if (isWatch) {
  generateConfig();
  console.log(`Watching Notes directory: ${NOTES_DIR} for changes...`);
  
  let debounceTimeout = null;
  
  try {
    fs.watch(NOTES_DIR, { recursive: true }, (eventType, filename) => {
      // Ignore hidden files and index.html changes
      if (filename && (filename.startsWith('.') || filename.includes('index.html'))) {
        return;
      }
      
      // Debounce to prevent multiple writes in quick succession
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        console.log(`Change detected: ${eventType} in "${filename}". Regenerating config...`);
        generateConfig();
      }, 100);
    });
  } catch (err) {
    console.error('Failed to start file watcher:', err.message);
  }
} else {
  generateConfig();
}
