/* =========================================
   IITM Notes Portal — SPA Navigation Script
   ========================================= */

// Global variables
let flatLecturesList = [];

// Course accent color mapping
const COURSE_ACCENTS = {
  mad2: { color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)' },
  mlt: { color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)' },
  bdm: { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' },
};
function getCourseAccent() {
  return COURSE_ACCENTS[window.COURSE_ID] || COURSE_ACCENTS.mlt;
}

document.addEventListener('DOMContentLoaded', async () => {
  // Wait for config to load (per-course JSON or fallback master config)
  if (window.__configReady) {
    try {
      await window.__configReady;
    } catch (e) {
      console.warn('Config loading failed:', e);
    }
  }

  if (!window.COURSE_ID || !window.COURSE_STRUCTURES || !COURSE_STRUCTURES[window.COURSE_ID]) {
    console.error('Invalid or missing COURSE_ID configuration.');
    return;
  }

  rebuildFlatLectures();
  initSPATheme();
  renderSidebar();
  initSidebarControls();
  initPrevNextControls();

  window.addEventListener('hashchange', handleHashChange);
  handleHashChange();

  initSearch();

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const input = document.getElementById('searchInput');
      if (input) { input.value = ''; input.focus(); performSearch(''); }
    }
    // Add Ctrl+F support
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      const input = document.getElementById('searchInput');
      if (input) { input.focus(); }
    }
    if (e.key === 'Escape') {
      closeSearch();
    }
  });

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
        lectureFileName: lecture.file
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
      const accent = getCourseAccent();
      
      root.style.setProperty('--border-strong', isDark ? '#475569' : '#cbd5e1');
      root.style.setProperty('--border', isDark ? '#334155' : '#e2e8f0');
      root.style.setProperty('--text-primary', isDark ? '#f1f5f9' : '#0f172a');
      root.style.setProperty('--text-secondary', isDark ? '#94a3b8' : '#475569');
      root.style.setProperty('--text-muted', isDark ? '#64748b' : '#94a3b8');
      root.style.setProperty('--surface-1', isDark ? '#1e293b' : '#ffffff');
      root.style.setProperty('--surface-0', isDark ? '#0f172a' : '#f8fafc');
      root.style.setProperty('--text-accent', accent.color);
      root.style.setProperty('--bg-accent', accent.bg);
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

    week.lectures.forEach(lecture => {
      const item = document.createElement('div');
      item.className = 'lecture-item';
      item.dataset.week = week.weekName;
      item.dataset.lecture = lecture.file;
      item.innerHTML = `
        <i class="ph ph-file-text"></i>
        <span>${lecture.title}</span>
      `;

      item.addEventListener('click', () => {
        window.location.hash = `${encodeURIComponent(week.weekName)}/${encodeURIComponent(lecture.file)}`;
        afterLectureClick();
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

function findLectureMeta(weekName, lectureFileName) {
  const structure = COURSE_STRUCTURES[window.COURSE_ID];
  if (!structure) return null;
  const week = structure.find(w => w.weekName === weekName);
  if (!week) return null;
  return week.lectures.find(l => l.file === lectureFileName) || null;
}

function loadLecture(weekName, lectureFileName) {
  const iframe = document.getElementById('viewerIframe');
  const loader = document.getElementById('viewerLoader');
  const welcomeScreen = document.getElementById('welcomeScreen');

  const meta = findLectureMeta(weekName, lectureFileName);
  const displayTitle = meta ? meta.title : lectureFileName.replace(/\.html$/i, '');
  document.getElementById('currentLectureTitle').textContent = displayTitle;
  document.getElementById('currentWeekLabel').textContent = weekName;

  // Show loader and hide welcome screen
  loader.classList.add('visible');
  welcomeScreen.style.display = 'none';

  // IMPORTANT: Reset match counters for this new lecture
  currentMatchIndex = 0;
  totalMatches = 0;
  updateSearchCounter();

  // Construct space-safe path (prepend COURSE_FOLDER if universal page)
  const folderPrefix = window.COURSE_FOLDER ? `${window.COURSE_FOLDER}/` : '';
  const relativePath = `${folderPrefix}${weekName}/${lectureFileName}`;
  const encodedPath = encodeURI(relativePath);

  // Capture the current search query for this load
  const queryForThisLecture = currentSearchQuery;
  console.log(`loadLecture: query="${queryForThisLecture}", file="${lectureFileName}"`);

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
        // After iframe loads, inject search highlighting
        iframe.addEventListener('load', () => {
          if (queryForThisLecture) {
            console.log(`Iframe loaded, highlighting for query: "${queryForThisLecture}"`);
            setTimeout(() => highlightInIframe(queryForThisLecture), 100);
          }
        }, { once: true });
      } else {
        // Fragment/Snippet -> wrap inside a complete HTML page with theme styles and set srcdoc
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const accent = getCourseAccent();

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
      --text-accent: ${accent.color};
      --text-primary: ${isDark ? '#f1f5f9' : '#0f172a'};
      --text-secondary: ${isDark ? '#94a3b8' : '#475569'};
      --text-muted: ${isDark ? '#64748b' : '#94a3b8'};
      --bg-accent: ${accent.bg};
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
        // After iframe content is set, highlight search term if we have one
        if (queryForThisLecture) {
          console.log(`Srcdoc set, highlighting for query: "${queryForThisLecture}"`);
          setTimeout(() => highlightInIframe(queryForThisLecture), 100);
        }
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

/* ---------- Sidebar Controls (Mobile Drawer + Desktop Collapse/Peek) ---------- */
function isDesktop() {
  return window.innerWidth >= 992;
}

function openSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (isDesktop()) {
    if (sidebar) {
      sidebar.classList.remove('collapsed', 'peeking');
      sidebar.style.transition = '';
      const et = document.getElementById('sidebarEdgeToggle');
      if (et) et.querySelector('i').className = 'ph ph-caret-left';
    }
  } else {
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('visible');
  }
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (isDesktop()) {
    if (sidebar) {
      sidebar.classList.add('collapsed');
      sidebar.classList.remove('peeking');
      sidebar.style.transition = '';
      const et = document.getElementById('sidebarEdgeToggle');
      if (et) et.querySelector('i').className = 'ph ph-caret-right';
    }
  } else {
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  if (isDesktop()) {
    const isCollapsed = sidebar.classList.contains('collapsed');
    if (isCollapsed) {
      openSidebar();
    } else {
      closeSidebar();
    }
  } else {
    const isOpen = sidebar.classList.contains('open');
    if (isOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }
}

function afterLectureClick() {
  const sidebar = document.getElementById('sidebar');
  if (isDesktop() && sidebar) {
    sidebar.classList.remove('collapsed', 'peeking');
    sidebar.style.transition = '';
    const et = document.getElementById('sidebarEdgeToggle');
    if (et) et.querySelector('i').className = 'ph ph-caret-left';
  } else {
    closeSidebar();
  }
}

function initSidebarControls() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const openBtn = document.getElementById('sidebarOpenBtn');
  const closeBtn = document.getElementById('sidebarCloseBtn');
  const edgeToggle = document.getElementById('sidebarEdgeToggle');

  // Header toggle button (mobile + desktop)
  if (openBtn) {
    openBtn.addEventListener('click', toggleSidebar);
  }

  // Close button (mobile close + desktop collapse)
  if (closeBtn) {
    closeBtn.addEventListener('click', closeSidebar);
  }

  // Overlay click (mobile)
  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }

  // Edge toggle (desktop)
  if (edgeToggle && sidebar) {
    edgeToggle.addEventListener('click', toggleSidebar);

    let peekTimer = null;

    function startPeek() {
      if (!isDesktop()) return;
      if (!sidebar.classList.contains('collapsed')) return;
      clearTimeout(peekTimer);
      sidebar.style.transition = 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
      sidebar.classList.add('peeking');
    }

    function stopPeek() {
      if (!isDesktop()) return;
      if (!sidebar.classList.contains('collapsed')) return;
      peekTimer = setTimeout(() => {
        sidebar.classList.remove('peeking');
        sidebar.style.transition = '';
      }, 400);
    }

    edgeToggle.addEventListener('mouseenter', startPeek);
    edgeToggle.addEventListener('mouseleave', stopPeek);

    // Keep peek while hovering over the sidebar itself
    sidebar.addEventListener('mouseenter', startPeek);
    sidebar.addEventListener('mouseleave', stopPeek);
  }
}

/* ---------- Search Functionality ---------- */
let searchActiveIndex = -1;
let currentSearchQuery = ''; // Store the search term for in-lecture highlighting
let currentMatchIndex = 0;  // Track current highlighted match
let totalMatches = 0;       // Total count of matches in lecture

function initSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const searchClearBtn = document.getElementById('searchClearBtn');
  const searchNextBtn = document.getElementById('searchNextBtn');
  const searchPrevBtn = document.getElementById('searchPrevBtn');

  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    searchActiveIndex = -1;
    // Clear in-lecture highlighting when user types a new search
    currentSearchQuery = '';
    totalMatches = 0;
    updateSearchCounter();
    const iframe = document.getElementById('viewerIframe');
    if (iframe && iframe.contentDocument) {
      const oldMarks = iframe.contentDocument.querySelectorAll('mark.search-highlight');
      oldMarks.forEach(mark => {
        const parent = mark.parentNode;
        while (mark.firstChild) {
          parent.insertBefore(mark.firstChild, mark);
        }
        parent.removeChild(mark);
      });
    }
    
    // Show/hide clear button
    if (searchClearBtn) {
      searchClearBtn.style.display = e.target.value.trim() ? 'block' : 'none';
    }
    
    performSearch(searchInput.value);
  });

  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim()) {
      searchResults.classList.add('open');
      updateSearchCounter(); // Hide counter when dropdown opens
    }
  });

  searchInput.addEventListener('blur', () => {
    setTimeout(() => {
      searchResults.classList.remove('open');
      updateSearchCounter(); // Show counter again when dropdown closes
    }, 200);
  });

  searchInput.addEventListener('keydown', (e) => {
    const items = searchResults.querySelectorAll('.search-result-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (searchResults.classList.contains('open')) {
        // Navigate search results dropdown
        searchActiveIndex = Math.min(searchActiveIndex + 1, items.length - 1);
        highlightSearchItem(items);
      } else if (totalMatches > 0) {
        // Navigate matches in lecture
        navigateMatches(1);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (searchResults.classList.contains('open')) {
        // Navigate search results dropdown
        searchActiveIndex = Math.max(searchActiveIndex - 1, 0);
        highlightSearchItem(items);
      } else if (totalMatches > 0) {
        // Navigate matches in lecture
        navigateMatches(-1);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.classList.contains('open') && searchActiveIndex >= 0 && items[searchActiveIndex]) {
        items[searchActiveIndex].click();
      }
    }
  });

  // Clear button handler
  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchClearBtn.style.display = 'none';
      currentSearchQuery = '';
      totalMatches = 0;
      currentMatchIndex = 0;
      updateSearchCounter();
      // Clear highlighting in iframe
      const iframe = document.getElementById('viewerIframe');
      if (iframe && iframe.contentDocument) {
        const oldMarks = iframe.contentDocument.querySelectorAll('mark.search-highlight');
        oldMarks.forEach(mark => {
          const parent = mark.parentNode;
          while (mark.firstChild) {
            parent.insertBefore(mark.firstChild, mark);
          }
          parent.removeChild(mark);
        });
      }
      searchResults.classList.remove('open');
      performSearch('');
    });
  }

  // Navigation buttons
  if (searchNextBtn) {
    searchNextBtn.addEventListener('click', () => {
      if (totalMatches > 0) navigateMatches(1);
    });
  }
  if (searchPrevBtn) {
    searchPrevBtn.addEventListener('click', () => {
      if (totalMatches > 0) navigateMatches(-1);
    });
  }
}

function closeSearch() {
  const results = document.getElementById('searchResults');
  const input = document.getElementById('searchInput');
  if (results) results.classList.remove('open');
  if (input) input.blur();
}

async function performSearch(query) {
  const results = document.getElementById('searchResults');
  if (!results) return;

  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    results.innerHTML = '<div class="search-empty">Type to search across all lectures...</div>';
    results.classList.remove('open');
    return;
  }

  const structure = COURSE_STRUCTURES[window.COURSE_ID];
  if (!structure) return;

  const matches = [];

  // First pass: match against metadata (title, slug, week)
  structure.forEach(week => {
    week.lectures.forEach(lecture => {
      const searchText = `${lecture.title} ${lecture.slug} ${week.weekName}`.toLowerCase();
      if (searchText.includes(trimmed)) {
        matches.push({ lecture, week: week.weekName, matchType: 'title' });
      }
    });
  });

  // If we don't have enough matches, try scanning lecture contents.
  // Limit the number of content fetches to avoid overloading the browser/server.
  const MAX_CONTENT_FETCH = 30;
  const desiredMinMatches = 12;

  if (matches.length < desiredMinMatches) {
    const remaining = [];
    structure.forEach(week => {
      week.lectures.forEach(lecture => {
        // Skip already-matched lectures
        if (!matches.find(m => m.lecture.file === lecture.file && m.week === week.weekName)) {
          remaining.push({ lecture, week: week.weekName });
        }
      });
    });

    // Limit how many files we attempt to fetch
    const toFetch = remaining.slice(0, MAX_CONTENT_FETCH);

    const folderPrefix = window.COURSE_FOLDER ? `${window.COURSE_FOLDER}/` : '';

    // Fetch in parallel with Promise.allSettled to be resilient to errors
    const fetchPromises = toFetch.map(item => {
      const fetchPath = encodeURI(folderPrefix + item.lecture.path);
      return fetch(fetchPath)
        .then(res => res.ok ? res.text() : '')
        .then(text => ({ item, text }))
        .catch(() => ({ item, text: '' }));
    });

    try {
      const resultsArr = await Promise.allSettled(fetchPromises);
      resultsArr.forEach(r => {
        if (r.status === 'fulfilled' && r.value && r.value.text) {
          const html = r.value.text.toLowerCase();
          // Don't add if already matched by title
          if (html.includes(trimmed) && !matches.find(m => m.lecture.file === r.value.item.lecture.file && m.week === r.value.item.week)) {
            matches.push({ lecture: r.value.item.lecture, week: r.value.item.week, matchType: 'content' });
          }
        }
      });
    } catch (e) {
      // ignore fetch errors — best-effort content scanning
    }
  }

  if (matches.length === 0) {
    results.innerHTML = '<div class="search-empty">No lectures found matching your search.</div>';
    results.classList.remove('open');
    return;
  }

  results.innerHTML = matches.map((m, i) => {
    const highlightedTitle = highlightMatch(m.lecture.title, trimmed);
    const matchTypeLabel = m.matchType === 'content' ? '<span style="font-size:0.75rem;color:#888;margin-top:2px;">📝 Found in content</span>' : '';
    return `
      <div class="search-result-item" data-index="${i}" data-week="${encodeURIComponent(m.week)}" data-lecture="${encodeURIComponent(m.lecture.file)}">
        <i class="ph ph-file-text search-result-icon"></i>
        <div class="search-result-info">
          <div class="search-result-title">${highlightedTitle}</div>
          <div class="search-result-week">${m.week}</div>
          ${matchTypeLabel}
        </div>
        <div class="search-result-meta">
          <span>${m.lecture.readingTime} min read</span>
        </div>
      </div>
    `;
  }).join('');

  results.classList.add('open');

  results.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
      const week = decodeURIComponent(item.dataset.week);
      const lecture = decodeURIComponent(item.dataset.lecture);
      // IMPORTANT: Capture trimmed in closure for this specific click
      const queryToUse = trimmed;
      currentSearchQuery = queryToUse; // Store the search term for in-lecture highlighting
      currentMatchIndex = 0;
      totalMatches = 0;
      console.log(`Clicked lecture, setting query to: "${queryToUse}", week: "${week}", file: "${lecture}"`);
      closeSearch();
      
      // If already on the same lecture, manually re-highlight
      const currentHash = window.location.hash.substring(1);
      const targetHash = `${encodeURIComponent(week)}/${encodeURIComponent(lecture)}`;
      if (currentHash === targetHash) {
        console.log('Already on this lecture, re-highlighting...');
        setTimeout(() => highlightInIframe(queryToUse), 100);
      } else {
        window.location.hash = targetHash;
      }
    });
  });
}

function highlightMatch(text, query) {
  const idx = text.toLowerCase().indexOf(query);
  if (idx === -1) return text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);
  return `${before}<mark>${match}</mark>${after}`;
}

function highlightSearchItem(items) {
  items.forEach((item, i) => {
    item.classList.toggle('active', i === searchActiveIndex);
  });
  if (searchActiveIndex >= 0 && items[searchActiveIndex]) {
    items[searchActiveIndex].scrollIntoView({ block: 'nearest' });
  }
}

function highlightInIframe(query) {
  const iframe = document.getElementById('viewerIframe');
  if (!iframe) {
    console.warn('iframe not found');
    return;
  }
  
  try {
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    if (!doc || !doc.body) {
      console.warn('iframe document not accessible');
      return;
    }
    
    console.log(`highlightInIframe: searching for "${query}" in current lecture only`);
    
    // First, undo previous highlighting in THIS iframe only
    const oldMarks = doc.querySelectorAll('mark.search-highlight');
    oldMarks.forEach(mark => {
      const parent = mark.parentNode;
      while (mark.firstChild) {
        parent.insertBefore(mark.firstChild, mark);
      }
      parent.removeChild(mark);
    });
    
    // Walk through text nodes and highlight matches in THIS lecture only
    const walker = doc.createTreeWalker(
      doc.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    const nodesToReplace = [];
    let node;
    const queryLower = query.toLowerCase();
    
    while (node = walker.nextNode()) {
      const text = node.nodeValue;
      if (text && text.toLowerCase().includes(queryLower)) {
        nodesToReplace.push(node);
      }
    }
    
    // Replace text nodes with highlighted versions
    nodesToReplace.forEach(node => {
      const parent = node.parentNode;
      const text = node.nodeValue;
      const textLower = text.toLowerCase();
      const fragment = doc.createDocumentFragment();
      
      let lastIndex = 0;
      let index;
      
      while ((index = textLower.indexOf(queryLower, lastIndex)) !== -1) {
        // Add text before match
        if (index > lastIndex) {
          fragment.appendChild(doc.createTextNode(text.slice(lastIndex, index)));
        }
        
        // Add highlighted match
        const mark = doc.createElement('mark');
        mark.className = 'search-highlight';
        mark.style.backgroundColor = '#ffeb3b';
        mark.style.color = '#000';
        mark.style.fontWeight = 'bold';
        mark.style.padding = '2px 4px';
        mark.style.borderRadius = '3px';
        mark.style.cursor = 'pointer';
        mark.appendChild(doc.createTextNode(text.slice(index, index + queryLower.length)));
        fragment.appendChild(mark);
        
        lastIndex = index + queryLower.length;
      }
      
      // Add remaining text
      if (lastIndex < text.length) {
        fragment.appendChild(doc.createTextNode(text.slice(lastIndex)));
      }
      
      parent.replaceChild(fragment, node);
    });
    
    // Count total matches IN THIS LECTURE ONLY
    const allMarks = doc.querySelectorAll('mark.search-highlight');
    totalMatches = allMarks.length;
    currentMatchIndex = 0;
    
    console.log(`✓ Found ${totalMatches} matches for "${queryLower}" in THIS lecture`);
    
    // Update search bar counter (this will show 1/totalMatches for this lecture)
    updateSearchCounter();
    
    // Scroll to first match and highlight it
    if (totalMatches > 0) {
      allMarks.forEach((m, idx) => {
        if (idx === 0) {
          m.style.backgroundColor = '#ff9800';
          m.style.outline = '3px solid #ff6f00';
          m.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  } catch (e) {
    console.error('Could not highlight in iframe:', e);
  }
}

function updateSearchCounter() {
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const headerRight = document.querySelector('.header-right');
  const searchNextBtn = document.getElementById('searchNextBtn');
  const searchPrevBtn = document.getElementById('searchPrevBtn');
  
  if (!searchInput || !headerRight) return;
  
  // IMPORTANT: Only show counter when:
  // 1. We have a query AND
  // 2. We have matches AND
  // 3. Search results dropdown is NOT open (we're viewing a lecture)
  const isSearchDropdownOpen = searchResults && searchResults.classList.contains('open');
  const shouldShowCounter = currentSearchQuery && totalMatches > 0 && !isSearchDropdownOpen;
  
  console.log(`updateSearchCounter: query="${currentSearchQuery}", matches=${totalMatches}, dropdownOpen=${isSearchDropdownOpen}, shouldShow=${shouldShowCounter}`);
  
  if (shouldShowCounter) {
    // Find or create counter element - place it AFTER the search bar, not inside
    let counter = document.getElementById('searchCounter');
    if (!counter) {
      counter = document.createElement('span');
      counter.id = 'searchCounter';
      counter.style.cssText = 'font-size:0.85rem;color:#666;font-weight:600;background:#f0f0f0;padding:4px 8px;border-radius:3px;border:1px solid #ddd;margin-left:8px;flex-shrink:0;white-space:nowrap;';
      const headerSearch = document.getElementById('headerSearch');
      headerSearch.parentElement.insertBefore(counter, headerSearch.nextSibling);
    }
    counter.textContent = `${currentMatchIndex + 1}/${totalMatches}`;
    counter.style.display = 'inline-block';
    
    // Show navigation buttons
    if (searchNextBtn) {
      searchNextBtn.style.display = 'inline-block';
      console.log('Showing searchNextBtn');
    }
    if (searchPrevBtn) {
      searchPrevBtn.style.display = 'inline-block';
      console.log('Showing searchPrevBtn');
    }
  } else {
    const counter = document.getElementById('searchCounter');
    if (counter) {
      counter.style.display = 'none';
      console.log('Hiding counter');
    }
    
    // Hide navigation buttons
    if (searchNextBtn) searchNextBtn.style.display = 'none';
    if (searchPrevBtn) searchPrevBtn.style.display = 'none';
    
    console.log('Counter/buttons hidden');
  }
}

function navigateMatches(direction) {
  if (totalMatches === 0) return;
  
  const iframe = document.getElementById('viewerIframe');
  if (!iframe) return;
  
  try {
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    if (!doc) {
      console.warn('Could not access iframe document');
      return;
    }
    
    const marks = doc.querySelectorAll('mark.search-highlight');
    if (marks.length === 0) {
      console.warn('No marks found in iframe');
      return;
    }
    
    console.log(`Navigating from match ${currentMatchIndex + 1} of ${marks.length}, direction: ${direction}`);
    
    // Unhighlight current match
    if (currentMatchIndex < marks.length) {
      marks[currentMatchIndex].style.backgroundColor = '#ffeb3b';
      marks[currentMatchIndex].style.outline = 'none';
    }
    
    // Move to next/prev
    currentMatchIndex += direction;
    if (currentMatchIndex < 0) currentMatchIndex = marks.length - 1;
    if (currentMatchIndex >= marks.length) currentMatchIndex = 0;
    
    // Highlight new current match
    marks[currentMatchIndex].style.backgroundColor = '#ff9800';
    marks[currentMatchIndex].style.outline = '3px solid #ff6f00';
    marks[currentMatchIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    console.log(`Now at match ${currentMatchIndex + 1} of ${marks.length}`);
    
    updateSearchCounter();
  } catch (e) {
    console.error('Error navigating matches:', e);
  }
}
