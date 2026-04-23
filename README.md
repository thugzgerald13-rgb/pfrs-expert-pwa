# PFRS Expert PWA

A Progressive Web App that acts as an expert system for navigating Philippine Financial Reporting Standards (PFRS) and SEC compliance requirements.

## Features
- Rule-based PFRS guidance based on entity type and transactions
- Works offline as a Progressive Web App
- Searchable glossary of key financial reporting terms
- SEC compliance checklist (current version)
- Installable on mobile and desktop for quick access

## How to Run Locally
Since this is a PWA that uses Service Workers, you need to run it from a local server, not just by opening the HTML file.

### Option 1: Using Node.js (if installed)

npx http-server
Then open http://localhost:8080

### Option 2: Using Python (if installed)
Python 3
python -m http.server 8000

Python 2
python -m SimpleHTTPServer 8000
Then open http://localhost:8000

### Option 3: Using VS Code
1. Install the "Live Server" extension
2. Right-click `index.html` and select "Open with Live Server"

## Project Structure
- index.html - Main application
- offline.html - Offline fallback page
- manifest.json - PWA manifest
- sw.js - Service Worker
- css/ - Stylesheets
- js/ - JavaScript logic
- icons/ - PWA icons
- 
