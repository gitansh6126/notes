const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const NOTES_DIR = path.join(__dirname, '..', 'Notes');
const CONFIG_FILE = path.join(__dirname, '..', 'assets', 'js', 'config.js');
const PER_COURSE_CONFIG_DIR = path.join(__dirname, '..', 'assets', 'config');

function folderToCourseId(folderName) {
  return folderName
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function slugify(text) {
  return text
    .replace(/\.html$/i, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function estimateReadingTime(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const sizeBytes = stats.size;
    const words = Math.max(sizeBytes / 6, 1);
    return Math.max(Math.round(words / 200), 1);
  } catch {
    return 1;
  }
}

function generateConfig() {
  console.log('Scanning directories for course notes...');
  const structures = {};

  try {
    if (!fs.existsSync(NOTES_DIR)) {
      throw new Error(`Notes directory not found at: ${NOTES_DIR}`);
    }

    const courseFolders = fs.readdirSync(NOTES_DIR);
    
    for (const folder of courseFolders) {
      const coursePath = path.join(NOTES_DIR, folder);
      if (!fs.statSync(coursePath).isDirectory()) continue;

      const courseId = folderToCourseId(folder);

      structures[courseId] = [];

      const weekFolders = fs.readdirSync(coursePath)
        .filter(f => {
          const fullPath = path.join(coursePath, f);
          return fs.statSync(fullPath).isDirectory() && /^Week/i.test(f);
        })
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

      for (const weekFolder of weekFolders) {
        const weekPath = path.join(coursePath, weekFolder);
        
        const files = fs.readdirSync(weekPath)
          .filter(f => {
            const filePath = path.join(weekPath, f);
            return fs.statSync(filePath).isFile() && 
                   f.endsWith('.html') && 
                   f.toLowerCase() !== 'index.html' && 
                   !f.startsWith('.');
          })
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

        if (files.length === 0) continue;

        const lectures = files.map((file, order) => {
          const filePath = path.join(weekPath, file);
          const title = file.replace(/\.html$/i, '');

          // Check for optional metadata sidecar file
          let tags = [];
          let keywords = [];
          const metaFilePath = path.join(weekPath, `${path.basename(file, '.html')}.meta.json`);
          if (fs.existsSync(metaFilePath)) {
            try {
              const metaData = JSON.parse(fs.readFileSync(metaFilePath, 'utf-8'));
              if (Array.isArray(metaData.tags)) tags = metaData.tags;
              if (Array.isArray(metaData.keywords)) keywords = metaData.keywords;
            } catch (e) {
              console.warn(`Failed to parse metadata for ${file}: ${e.message}`);
            }
          }

          return {
            title,
            file,
            path: `${weekFolder}/${file}`,
            course: courseId,
            week: weekFolder,
            order: order + 1,
            slug: slugify(title),
            lastModified: fs.statSync(filePath).mtime.toISOString(),
            readingTime: estimateReadingTime(filePath),
            tags,
            keywords
          };
        });

        structures[courseId].push({
          weekName: weekFolder,
          lectures
        });
      }
    }

    const courseMeta = {};
    for (const folder of courseFolders) {
      const coursePath = path.join(NOTES_DIR, folder);
      if (!fs.statSync(coursePath).isDirectory()) continue;
      const courseId = folderToCourseId(folder);
      courseMeta[courseId] = { name: folder };
    }

    const configContent = `// Static configuration for IITM Notes Portal SPAs
// Generated automatically. Do not edit manually.
const COURSE_STRUCTURES = ${JSON.stringify(structures, null, 2)};

const COURSE_META = ${JSON.stringify(courseMeta, null, 2)};

window.COURSE_STRUCTURES = COURSE_STRUCTURES;
window.COURSE_META = COURSE_META;
`;

    // Ensure assets/js folder exists
    const configDir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(CONFIG_FILE, configContent, 'utf-8');
    console.log(`Successfully generated config.js at: ${CONFIG_FILE}`);

    // Generate per-course config files
    if (!fs.existsSync(PER_COURSE_CONFIG_DIR)) {
      fs.mkdirSync(PER_COURSE_CONFIG_DIR, { recursive: true });
    }

    for (const [courseId, weeks] of Object.entries(structures)) {
      const courseConfig = {
        courseId,
        courseName: courseMeta[courseId]?.name || courseId,
        weeks
      };
      const courseConfigPath = path.join(PER_COURSE_CONFIG_DIR, `${courseId}.json`);
      fs.writeFileSync(courseConfigPath, JSON.stringify(courseConfig, null, 2), 'utf-8');
      console.log(`Generated per-course config: ${courseConfigPath}`);
    }
  } catch (err) {
    console.error('Error generating configuration:', err.message);
  }
}

// Check for watch flag
const isWatch = process.argv.includes('--watch');

if (isWatch) {
  generateConfig();
  console.log(`Watching Notes directory: ${NOTES_DIR} for changes...`);
  
  const watcher = chokidar.watch(NOTES_DIR, {
    ignoreInitial: true,
    persistent: true,
    ignored: /(^|[/\\])\.|index\.html$/i
  });

  let debounceTimeout = null;

  watcher.on('all', (event, filePath) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      console.log(`Change detected: ${event} in "${filePath}". Regenerating config...`);
      generateConfig();
    }, 100);
  });
} else {
  generateConfig();
}
