# File Utility Web App - Professional Edition

This is a premium, professional utility web application focused on client-side processing, meaning it works **100% offline** with zero backend or API dependency. Designed specifically with mobile-first and WebView APK deployments in mind.

## Core MVP Features:
1. **Convert Images to PDF** (Multiple selection, scale-to-fit logic)
2. **Image Compressor** (Canvas-based offline compression with dynamic slider & live preview)
3. **Batch File Renamer** (Custom Prefix+Suffix, Auto-numbering, packaged to `.zip`)
4. **Activity History** (Privacy-first activity ledger)

## What's New in Professional Upgrade:
- **Privacy-First History**: A local offline log of all file operations containing only metadata (file name, type, size before/after, and status). No files are saved anywhere, guaranteeing 100% Android WebView safety. Features auto-pruning to keep memory low (max 50 items).
- **Revamped Minimalist UI**: Neutral color palettes (blue, gray, black, white), system-fonts, structured top App Bar, and Bottom Navigation.
- **Card-Level Design**: Clean and highly accessible touch targets.
- **Settings Menu**:
  - `Dark Mode Toggle` (Instantly switches CSS variables)
  - `Auto Download Toggle` (Bypasses confirmation alerts for smoother UX)
  - `App Data Reset` (Clear localStorage configs cache)
- **Credit Footer**: "Credit By Xen" unobtrusively locked at the bottom of the Settings view and content view.

## Technologies Used
- HTML5 (Semantic Structure)
- CSS3 (`var()`, generic flexbox grid, explicit `.theme-light` and `.theme-dark` classes)
- JavaScript Vanilla (Local storage management, File API, Blob object handling)
- Local libraries: `pdf-lib.min.js`, `jszip.min.js`

## How To Run and Test
1. **Zero build steps needed**: Open `index.html` in Chrome/Safari/Firefox locally.
2. Go to Settings and try toggling the **Dark Mode** & **Auto Download**.
3. Use the tabs to test generating PDF, compressing big image sizes, or renaming bulk files.

## WebView (Web → APK) Deployment Guidelines
1. **Offline Mode**: As long as the initial page loads with the `lib/` files embedded, you can literally turn off WiFi on the device and it will continue to operate with full functionality.
2. **Blob URLs**: JS triggers download using `URL.createObjectURL(blob)`. In old Android WebViews, downloading generated Blobs dynamically via injected HTML `<a>` tags requires your Android `WebViewClient` to implement custom `setDownloadListener` that interprets `blob:` scheme strings correctly. If left unhandled, clicks on generated download prompts may silently do nothing inside a pure mobile wrapper.
3. **Overscroll Reset**: `overscroll-behavior-y: none;` has been set over body to ensure users dragging image sliders don't accidentally "pull-to-refresh" the page.
