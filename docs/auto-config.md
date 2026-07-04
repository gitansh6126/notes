# Auto-Generating Config on File Changes

## Problem
Whenever a new course folder, week folder, or lecture file is added to `Notes/`, the config files (`assets/js/config.js` and `assets/config/*.json`) must be regenerated. Previously this required manually running `npm run build-config`.

## Solution
Run `generate-config.js --watch` alongside the dev server. The watch script uses `chokidar` to monitor `Notes/` for changes and automatically regenerates config files.

## How It Works
1. `dev.bat` launches both `live-server` and `npm run watch` in separate terminal windows.
2. When a file/folder is added or removed in `Notes/`, chokidar triggers a config regeneration.
3. `live-server` detects the updated config files and triggers a browser live-reload.
4. The SPA loads the fresh config on reload.

## Files Modified
- `dev.bat` — Added `start "" cmd /k "npm run watch"` to launch the watch script.

## Files Involved
| File | Purpose |
|---|---|
| `scripts/generate-config.js` | Scans `Notes/` and generates config (already had `--watch` mode) |
| `assets/js/config.js` | Generated global config (fallback) |
| `assets/config/*.json` | Generated per-course configs |

## Running Without dev.bat
If you start `live-server` manually, also run in a separate terminal:
```
npm run watch
```
