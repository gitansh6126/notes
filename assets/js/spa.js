/* =========================================
   IITM Notes Portal — SPA Navigation Script
   ========================================= */

// Global variables
let flatLecturesList = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!window.COURSE_ID || !COURSE_STRUCTURES[window.COURSE_ID]) {
    console.error('Invalid or missing COURSE_ID configuration.');
    return;
  }

  // Flatten structures to index notes for prev/next buttons
  rebuildFlatLectures();

  // Load and apply theme
  initSPATheme();

  // Render Sidebar
  renderSidebar();

  // Setup Mobile Nav Controls
  initMobileControls();

  // Setup Prev/Next Navigation Controls
  initPrevNextControls();

  // Handle URL Routing
  window.addEventListener('hashchange', handleHashChange);
  
  // Load initial view
  handleHashChange();

  // Setup iframe onload listener to hide loader spinner and sync theme
  const iframe = document.getElementById('viewerIframe');
  const loader = document.getElementById('viewerLoader');
  if (iframe) {
    iframe.addEventListener('load', () => {
      loader.classList.remove('visible');
      syncIframeTheme();
    });
  }
});

/* ---------- Prev/Next Navigation Logic ---------- */
function rebuildFlatLectures() {
  flatLecturesList = [];
  const structure = COURSE_STRUCTURES[window.COURSE_ID];
  if (!structure) return;

  structure.forEach(week => {
    week.lectures.forEach(lecture => {
      flatLecturesList.push({
        weekName: week.weekName,
        lectureFileName: lecture
      });
    });
  });
}

function initPrevNextControls() {
  const prevBtn = document.getElementById('prevLectureBtn');
  const nextBtn = document.getElementById('nextLectureBtn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => navigateLecture(-1));
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => navigateLecture(1));
  }
}

function navigateLecture(direction) {
  const hash = window.location.hash.substring(1);
  if (!hash) return;

  const parts = hash.split('/');
  if (parts.length < 2) return;

  const weekName = decodeURIComponent(parts[0]);
  const lectureFileName = decodeURIComponent(parts[1]);

  const currentIndex = flatLecturesList.findIndex(
    l => l.weekName === weekName && l.lectureFileName === lectureFileName
  );

  if (currentIndex === -1) return;

  const newIndex = currentIndex + direction;
  if (newIndex >= 0 && newIndex < flatLecturesList.length) {
    const target = flatLecturesList[newIndex];
    window.location.hash = `${encodeURIComponent(target.weekName)}/${encodeURIComponent(target.lectureFileName)}`;
  }
}

function updatePrevNextBtnStates() {
  const hash = window.location.hash.substring(1);
  const prevBtn = document.getElementById('prevLectureBtn');
  const nextBtn = document.getElementById('nextLectureBtn');

  let currentIndex = -1;

  if (hash) {
    const parts = hash.split('/');
    if (parts.length >= 2) {
      const weekName = decodeURIComponent(parts[0]);
      const lectureFileName = decodeURIComponent(parts[1]);
      currentIndex = flatLecturesList.findIndex(
        l => l.weekName === weekName && l.lectureFileName === lectureFileName
      );
    }
  }

  // Update Previous Button
  if (prevBtn) {
    if (currentIndex > 0) {
      prevBtn.disabled = false;
      prevBtn.style.opacity = '1';
      prevBtn.style.pointerEvents = 'auto';
    } else {
      prevBtn.disabled = true;
      prevBtn.style.opacity = '0.4';
      prevBtn.style.pointerEvents = 'none';
    }
  }

  // Update Next Button
  if (nextBtn) {
    if (currentIndex >= 0 && currentIndex < flatLecturesList.length - 1) {
      nextBtn.disabled = false;
      nextBtn.style.opacity = '1';
      nextBtn.style.pointerEvents = 'auto';
    } else {
      nextBtn.disabled = true;
      nextBtn.style.opacity = '0.4';
      nextBtn.style.pointerEvents = 'none';
    }
  }
}

/* ---------- Theme Management ---------- */
function initSPATheme() {
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const savedTheme = localStorage.getItem('notes-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Apply initial theme
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', initialTheme);
  updateThemeIcon(themeIcon, initialTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('notes-theme', next);
      updateThemeIcon(themeIcon, next);
      
      // Update theme in loaded iframe as well
      syncIframeTheme();
    });
  }

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('notes-theme')) {
      const nextTheme = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', nextTheme);
      updateThemeIcon(themeIcon, nextTheme);
      syncIframeTheme();
    }
  });
}

function updateThemeIcon(iconEl, theme) {
  if (!iconEl) return;
  iconEl.className = theme === 'dark' ? 'ph ph-sun' : 'ph ph-moon';
}

function syncIframeTheme() {
  const iframe = document.getElementById('viewerIframe');
  if (!iframe) return;
  
  try {
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    if (!doc || !doc.documentElement) return;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // Set theme attribute on the iframe's html tag
    doc.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    
    // If it's a dynamic srcdoc snippet, force variable updates
    const root = doc.documentElement;
    if (root && root.style) {
      const accentColor = window.COURSE_ID === 'mad2' ? '#a78bfa' : '#34d399';
      const bgAccent = window.COURSE_ID === 'mad2' ? 'rgba(167, 139, 250, 0.15)' : 'rgba(52, 211, 153, 0.15)';
      
      root.style.setProperty('--border-strong', isDark ? '#475569' : '#cbd5e1');
      root.style.setProperty('--border', isDark ? '#334155' : '#e2e8f0');
      root.style.setProperty('--text-primary', isDark ? '#f1f5f9' : '#0f172a');
      root.style.setProperty('--text-secondary', isDark ? '#94a3b8' : '#475569');
      root.style.setProperty('--text-muted', isDark ? '#64748b' : '#94a3b8');
      root.style.setProperty('--surface-1', isDark ? '#1e293b' : '#ffffff');
      root.style.setProperty('--surface-0', isDark ? '#0f172a' : '#f8fafc');
      root.style.setProperty('--text-accent', accentColor);
      root.style.setProperty('--bg-accent', bgAccent);
    }
  } catch (e) {
    console.warn("Could not sync theme with iframe: ", e);
  }
}

/* ---------- Sidebar Rendering ---------- */
function renderSidebar() {
  const sidebarMenu = document.getElementById('sidebarMenu');
  if (!sidebarMenu) return;

  const structure = COURSE_STRUCTURES[window.COURSE_ID];
  sidebarMenu.innerHTML = ''; // Clear skeleton

  structure.forEach((week, weekIndex) => {
    const accordion = document.createElement('div');
    accordion.className = 'week-accordion';
    accordion.id = `week-accordion-${weekIndex}`;

    // Header
    const header = document.createElement('div');
    header.className = 'week-header';
    header.innerHTML = `
      <span class="week-title">${week.weekName}</span>
      <i class="ph ph-caret-down week-chevron"></i>
    `;

    // Lectures list
    const list = document.createElement('div');
    list.className = 'week-lectures';

    week.lectures.forEach(lectureFileName => {
      const cleanName = lectureFileName.replace(/\.html$/i, '');
      const item = document.createElement('div');
      item.className = 'lecture-item';
      item.dataset.week = week.weekName;
      item.dataset.lecture = lectureFileName;
      item.innerHTML = `
        <i class="ph ph-file-text"></i>
        <span>${cleanName}</span>
      `;

      item.addEventListener('click', () => {
        // Change URL Hash to trigger route
        window.location.hash = `${encodeURIComponent(week.weekName)}/${encodeURIComponent(lectureFileName)}`;
        closeMobileSidebar();
      });

      list.appendChild(item);
    });

    // Toggle logic for accordion header
    header.addEventListener('click', () => {
      const isOpen = accordion.classList.contains('open');
      // Close other accordions
      document.querySelectorAll('.week-accordion').forEach(acc => {
        if (acc !== accordion) acc.classList.remove('open');
      });
      accordion.classList.toggle('open', !isOpen);
    });

    accordion.appendChild(header);
    accordion.appendChild(list);
    sidebarMenu.appendChild(accordion);
  });
}

/* ---------- Routing & Navigation ---------- */
function handleHashChange() {
  updatePrevNextBtnStates();

  const hash = window.location.hash.substring(1);
  if (!hash) {
    showWelcomeScreen();
    return;
  }

  const parts = hash.split('/');
  if (parts.length < 2) {
    showWelcomeScreen();
    return;
  }

  const weekName = decodeURIComponent(parts[0]);
  const lectureFileName = decodeURIComponent(parts[1]);

  // Find the sidebar element matching this lecture
  const targetItem = document.querySelector(`.lecture-item[data-week="${weekName}"][data-lecture="${lectureFileName}"]`);
  
  if (targetItem) {
    // Set active class
    document.querySelectorAll('.lecture-item').forEach(item => item.classList.remove('active'));
    targetItem.classList.add('active');

    // Open its parent week accordion
    const accordion = targetItem.closest('.week-accordion');
    if (accordion) {
      document.querySelectorAll('.week-accordion').forEach(acc => {
        if (acc !== accordion) acc.classList.remove('open');
      });
      accordion.classList.add('open');
    }

    // Load Note content
    loadLecture(weekName, lectureFileName);
  } else {
    showWelcomeScreen();
  }
}

function showWelcomeScreen() {
  document.getElementById('welcomeScreen').style.display = 'flex';
  document.getElementById('currentLectureTitle').textContent = 'Select a Lecture';
  document.getElementById('currentWeekLabel').textContent = window.COURSE_NAME;
  
  const iframe = document.getElementById('viewerIframe');
  iframe.removeAttribute('src');
  iframe.removeAttribute('srcdoc');
  
  document.querySelectorAll('.lecture-item').forEach(item => item.classList.remove('active'));
}

function loadLecture(weekName, lectureFileName) {
  const iframe = document.getElementById('viewerIframe');
  const loader = document.getElementById('viewerLoader');
  const welcomeScreen = document.getElementById('welcomeScreen');

  // Update header text
  const cleanName = lectureFileName.replace(/\.html$/i, '');
  document.getElementById('currentLectureTitle').textContent = cleanName;
  document.getElementById('currentWeekLabel').textContent = weekName;

  // Show loader and hide welcome screen
  loader.classList.add('visible');
  welcomeScreen.style.display = 'none';

  // Construct space-safe path
  const relativePath = `${weekName}/${lectureFileName}`;
  const encodedPath = encodeURI(relativePath);

  // Fetch the note contents to see if it's a full document or a snippet
  fetch(encodedPath)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.text();
    })
    .then(html => {
      const isFullDoc = /<html|<body|<doctype/i.test(html);

      if (isFullDoc) {
        // Full HTML Page -> load directly via iframe src
        iframe.removeAttribute('srcdoc');
        iframe.src = encodedPath;
      } else {
        // Fragment/Snippet -> wrap inside a complete HTML page with theme styles and set srcdoc
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const accentColor = window.COURSE_ID === 'mad2' ? '#a78bfa' : '#34d399';
        const bgAccent = window.COURSE_ID === 'mad2' ? 'rgba(167, 139, 250, 0.15)' : 'rgba(52, 211, 153, 0.15)';

        const finalHtml = `<!DOCTYPE html>
<html lang="en" data-theme="${isDark ? 'dark' : 'light'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css">
  <style>
    :root {
      --font-sans: 'Inter', sans-serif;
      --font-mono: monospace;
      --border-strong: ${isDark ? '#475569' : '#cbd5e1'};
      --border: ${isDark ? '#334155' : '#e2e8f0'};
      --text-accent: ${accentColor};
      --text-primary: ${isDark ? '#f1f5f9' : '#0f172a'};
      --text-secondary: ${isDark ? '#94a3b8' : '#475569'};
      --text-muted: ${isDark ? '#64748b' : '#94a3b8'};
      --bg-accent: ${bgAccent};
      --surface-1: ${isDark ? '#1e293b' : '#ffffff'};
      --surface-0: ${isDark ? '#0f172a' : '#f8fafc'};
      --bg-success: rgba(16, 185, 129, 0.1);
      --text-success: #10b981;
      --bg-warning: rgba(245, 158, 11, 0.1);
      --text-warning: #f59e0b;
    }
    body {
      margin: 0;
      padding: 2.5rem 1.5rem;
      background-color: var(--surface-0);
      color: var(--text-primary);
      font-family: var(--font-sans);
      transition: background-color 0.2s ease, color 0.2s ease;
      display: flex;
      justify-content: center;
    }
    .notes-root {
      width: 100%;
      max-width: 800px;
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;

        iframe.removeAttribute('src');
        iframe.srcdoc = finalHtml;
      }
    })
    .catch(err => {
      loader.classList.remove('visible');
      iframe.removeAttribute('src');
      iframe.srcdoc = `<div style="padding:2rem;font-family:sans-serif;color:#ef4444;text-align:center;">
        <h3>Failed to load lecture content</h3>
        <p>${err.message}</p>
      </div>`;
    });
}

/* ---------- Mobile Drawer Controls ---------- */
function initMobileControls() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const openBtn = document.getElementById('sidebarOpenBtn');
  const closeBtn = document.getElementById('sidebarCloseBtn');

  if (openBtn && sidebar && overlay) {
    openBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.classList.add('visible');
    });
  }

  if (closeBtn && sidebar && overlay) {
    closeBtn.addEventListener('click', closeMobileSidebar);
  }

  if (overlay) {
    overlay.addEventListener('click', closeMobileSidebar);
  }
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('visible');
}
