/* =========================================
   IITM Notes Portal — Main JavaScript
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileNav();
  initScrollTop();
  initSearch();
  initActiveNav();
});

/* ---------- Theme Toggle ---------- */
function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const savedTheme = localStorage.getItem('notes-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Apply initial theme
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme === 'dark' ? 'dark' : 'light');
  } else if (prefersDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  updateThemeIcon(themeIcon);

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('notes-theme', next);
    updateThemeIcon(themeIcon);
  });

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('notes-theme')) {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      updateThemeIcon(themeIcon);
    }
  });
}

function updateThemeIcon(iconEl) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  iconEl.className = isDark ? 'ph ph-sun' : 'ph ph-moon';
}

/* ---------- Mobile Navigation ---------- */
function initMobileNav() {
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');

  mobileToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    const icon = mobileToggle.querySelector('i');
    const isOpen = navLinks.classList.contains('open');
    icon.className = isOpen ? 'ph ph-x' : 'ph ph-list';
  });

  // Close mobile nav on link click
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      mobileToggle.querySelector('i').className = 'ph ph-list';
    });
  });
}

/* ---------- Scroll to Top ---------- */
function initScrollTop() {
  const scrollTopBtn = document.getElementById('scrollTop');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ---------- Search Toggle (UI only) ---------- */
function initSearch() {
  const searchToggle = document.getElementById('searchToggle');

  searchToggle.addEventListener('click', () => {
    // Placeholder for future search functionality
    const toast = document.createElement('div');
    toast.textContent = 'Search feature coming soon!';
    toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--surface);color:var(--text-primary);padding:12px 24px;border-radius:var(--radius-sm);box-shadow:var(--shadow-lg);border:1px solid var(--border);z-index:9999;font-weight:500;';
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  });
}

/* ---------- Active Nav Link on Scroll ---------- */
function initActiveNav() {
  const sections = document.querySelectorAll('section[id], main[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    },
    { threshold: 0.5 }
  );

  sections.forEach(section => observer.observe(section));
}
