# Future Implementation Plan

## ✅ Completed

### 1. Replace fs.watch with chokidar
`fs.watch` replaced with `chokidar` in `scripts/generate-config.js` for reliable cross-platform file watching.
- `npm install chokidar` added to dependencies
- Chokidar watcher with debounce replaces recursive `fs.watch`

### 2. Automatic Course Discovery
Hardcoded `COURSE_MAPPING` removed. Generator auto-detects all folders under `Notes/` as courses.
- Course ID generated from folder name via `folderToCourseId()` (strips parentheticals, lowercases)
- Zero-config: new course folders appear automatically

### 3. Automatic Week Discovery
Generator detects all folders matching `/^Week/i` inside each course.
- Numeric-aware sorting (`Week 01`, `Week 02`, ...)
- Skips weeks with no lecture files

### 4. Rich Metadata Generation
Per-lecture metadata now includes:
- `title`, `file`, `path`, `course`, `week`, `order`, `slug`
- `lastModified` (ISO timestamp from filesystem)
- `readingTime` (estimated from file size)
- `tags`, `keywords` (loaded from optional `.meta.json` sidecar files)

### 5. Subject SPA Architecture
Each course has its own `index.html` as an independent SPA with:
- Hash-based routing for lecture navigation
- Accordion sidebar with week/lecture tree
- Prev/next navigation across all lectures
- Iframe-based viewer with theme sync
- Mobile-responsive drawer sidebar

### 6. Subject Search Bar
Each SPA includes a search overlay with:
- Real-time filtering across lecture titles and slugs
- Keyboard shortcut: `Ctrl+K` / `Cmd+K`
- Arrow key navigation and Enter to select
- Highlighted search matches
- Landing page search filters course cards

### 7. Per-Course Config Files
Generator outputs:
- `assets/js/config.js` — master config with all courses (fallback)
- `assets/config/{courseId}.json` — per-course config files
- SPAs load their own per-course JSON with fallback to master

### 8. Future-ready Metadata Schema
Metadata supports optional fields:
- `tags: []` — populated from `{lecture}.meta.json` sidecar files
- `keywords: []` — same source
- Schema is extensible without migrations

## 🚧 Future Enhancements

### Search
- Full-text search through lecture content (headings, body text)
- Search history
- Fuzzy (fuse.js) search
- Cross-course search from landing page

### Performance
- Lazy-load lecture content instead of iframe
- Preload adjacent lectures
- Service worker for offline access

### UI/UX
- Breadcrumb navigation
- Progress tracking per course
- Recently opened lectures list
- Reading statistics dashboard
- Sitemap generation

### Content
- Rich `.meta.json` files per lecture with manual tags/keywords
- Automatic tag extraction from lecture HTML content
- Support for non-HTML content (PDF, Markdown)

### Architecture
- Shared `assets/components/` directory for reusable UI components
- Automated course card generation on landing page from `COURSE_META`
