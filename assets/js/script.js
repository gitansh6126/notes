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

/* ---------- Course Search (filters course cards) ---------- */
function initSearch() {
  const searchToggle = document.getElementById('searchToggle');

  searchToggle.addEventListener('click', () => {
    const cards = document.querySelectorAll('.course-card');
    if (cards.length === 0) return;

    const overlay = document.createElement('div');
    overlay.className = 'search-overlay';
    overlay.id = 'homeSearchOverlay';
    overlay.style.cssText = 'display:flex;position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);z-index:9999;align-items:flex-start;justify-content:center;padding-top:12vh;';

    overlay.innerHTML = `
      <div class="search-modal" style="width:min(500px,90vw);background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow-lg);overflow:hidden;animation:searchSlideIn 0.2s ease-out;">
        <div class="search-input-wrapper" style="display:flex;align-items:center;gap:0.75rem;padding:1rem 1.25rem;border-bottom:1px solid var(--border);">
          <i class="ph ph-magnifying-glass" style="font-size:1.25rem;color:var(--text-muted);"></i>
          <input type="text" class="search-input" id="homeSearchInput" placeholder="Search courses..." autocomplete="off" style="flex:1;border:none;background:transparent;font-size:1rem;font-family:inherit;color:var(--text-primary);outline:none;">
          <button class="search-close-btn" id="homeSearchClose" style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:50%;border:none;background:transparent;color:var(--text-secondary);cursor:pointer;font-size:1.1rem;">
            <i class="ph ph-x"></i>
          </button>
        </div>
        <div class="search-results" id="homeSearchResults" style="max-height:50vh;overflow-y:auto;padding:0.5rem;">
          <div class="search-empty" style="padding:2rem;text-align:center;color:var(--text-muted);font-size:0.9rem;">Type to search courses...</div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const input = document.getElementById('homeSearchInput');
    const results = document.getElementById('homeSearchResults');

    const closeOverlay = () => {
      overlay.remove();
    };

    document.getElementById('homeSearchClose').addEventListener('click', closeOverlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeOverlay();
    });

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (!q) {
        results.innerHTML = '<div class="search-empty" style="padding:2rem;text-align:center;color:var(--text-muted);font-size:0.9rem;">Type to search courses...</div>';
        return;
      }

      const items = [];
      cards.forEach(card => {
        const title = card.querySelector('h2')?.textContent || '';
        const desc = card.querySelector('.card-description')?.textContent || '';
        const code = card.querySelector('.course-code')?.textContent || '';
        const text = `${title} ${desc} ${code}`.toLowerCase();

        if (text.includes(q)) {
          items.push({ title, desc, card });
        }
      });

      if (items.length === 0) {
        results.innerHTML = '<div class="search-empty" style="padding:2rem;text-align:center;color:var(--text-muted);font-size:0.9rem;">No courses found.</div>';
        return;
      }

      results.innerHTML = items.map(item => `
        <div class="search-result-item" style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem 1rem;border-radius:var(--radius-sm);cursor:pointer;transition:all 0.3s ease;">
          <i class="ph ph-book-open" style="font-size:1rem;color:var(--accent);"></i>
          <div class="search-result-info" style="flex:1;min-width:0;">
            <div class="search-result-title" style="font-size:0.9rem;font-weight:600;color:var(--text-primary);">${item.title}</div>
            <div class="search-result-week" style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">${item.desc}</div>
          </div>
        </div>
      `).join('');

      results.querySelectorAll('.search-result-item').forEach((el, i) => {
        el.addEventListener('click', () => {
          closeOverlay();
          items[i].card.querySelector('.btn')?.click();
        });
        el.addEventListener('mouseenter', () => {
          results.querySelectorAll('.search-result-item').forEach(e => e.style.background = '');
          el.style.background = 'var(--bg)';
        });
        el.addEventListener('mouseleave', () => {
          el.style.background = '';
        });
      });
    });

    setTimeout(() => input.focus(), 100);
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
