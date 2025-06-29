# image-quality-scanner

A headless Puppeteer + Sharp tool to audit your site’s images for blur/pixelation  
Supports Desktop & Mobile lazy-load triggers, exports a CSV, and can push to Google Sheets.

---

## 📋 Table of Contents

1. [Features](#features)  
2. [Prerequisites](#prerequisites)  
3. [Installation](#installation)  
4. [Configuration](#configuration)  
5. [Usage](#usage)  
6. [Uploading CSV to Google Sheets](#uploading-csv-to-google-sheets)  
7. [Best Practices](#best-practices)  
8. [Contributing](#contributing)  
9. [License](#license)  

---

## 🔍 Features

- Audits images in both **Desktop** and **Mobile** viewports  
- Smooth scroll (desktop) & touch taps (mobile) to awaken lazy-loading  
- Detects `src`, `data-*lazy*` attributes and forces them into view  
- Computes a quick blur-variance score with [Sharp](https://github.com/lovell/sharp)  
- Outputs `image-check-report.csv` with detailed dimensions & pixelation status  
- Optional script to append the CSV to a Google Sheet via the Sheets API  

---

## 🛠️ Prerequisites

- Node.js v14+  
- npm or Yarn  
- A Google Cloud service account with **Sheets API** enabled  
- (Optional) Google Sheet shared with that service account  

---

## ⚙️ Installation

```bash
# 1. Clone
git clone https://github.com/<your-org>/image-quality-scanner.git
cd image-quality-scanner

# 2. Install dependencies
npm install