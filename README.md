# 🖼️ image-quality-scanner

A headless **Puppeteer** + **Sharp** based tool to audit image quality on your site (blur/pixelation detection).  
Supports **Desktop** & **Mobile** viewports, handles lazy-loaded images, exports a CSV report, and can push results to **Google Sheets**.  
Deployable on GitHub and free to fork, extend, or automate further.

---

## 📋 Table of Contents

- [🖼️ image-quality-scanner](#️-image-quality-scanner)
  - [📋 Table of Contents](#-table-of-contents)
  - [🔍 Features](#-features)
  - [🛠️ Prerequisites](#️-prerequisites)
  - [🚀 Installation](#-installation)
  - [⚙️ Configuration](#️-configuration)
    - [🔗 URLs List](#-urls-list)
    - [🌱 Environment Variables](#-environment-variables)
  - [▶️ Usage](#️-usage)
    - [1️⃣ Run the Image Quality Scanner](#1️⃣-run-the-image-quality-scanner)
    - [2️⃣ Push to Google Sheets (Optional)](#2️⃣-push-to-google-sheets-optional)
  - [🤝 Contributing](#-contributing)
  - [📜 License](#-license)

---

## 🔍 Features

- 🖥️ Audits images across both **Desktop** and **Mobile** viewports  
- 🚀 Triggers lazy-loaded content using smooth scroll & tap simulation  
- 🧠 Detects and loads `src`, `data-src`, `data-lazy*`, and similar attributes  
- 🔍 Calculates blur/pixelation using fast variance scoring via [Sharp](https://github.com/lovell/sharp)  
- 📊 Exports results to `image-quality-scanner.csv` including:
  - Image URL
  - Dimensions
  - Blur/pixelation status: `blurry`, `pixelated`, or `ok`  
- 📤 Optional push to Google Sheets using the Sheets API  

---

## 🛠️ Prerequisites

- [Node.js](https://nodejs.org/) v20 or newer  
- npm or yarn  
- Google Cloud Project with **Sheets API** enabled  
- Service Account JSON file
- If you are changing the CSV filename:
  - Create a new empty file with the name (e.g., image-quality-scanner.csv) in the project root.
  - Update the .env file with the new filename under the CSV_NAME_AND_PATH variable.
- (Optional) A Google Sheet shared with the service account email  

---

## 🚀 Installation

```bash
# Clone the repository
git clone https://github.com/yogendrabhadera19/image-quality-scanner.git
cd image-quality-scanner

# Install dependencies
npm install

# (Optional) install globally if CLI use is needed
npm install -g
```

---

## ⚙️ Configuration

### 🔗 URLs List

Edit the `urls.json` file with a list of pages you want to audit:

```json
[
  "https://example.com/page1",
  "https://example.com/page2"
]
```

---

### 🌱 Environment Variables

Create a `.env` file in your project root:

```env
# Path to your GCP service account JSON key
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json

# ID of your target Google Sheet
SHEET_ID=your_google_sheet_id_here

# CSV file name and path (update if changed)
CSV_NAME_AND_PATH=./image-quality-scanner.csv
```

✅ Make sure your Google Sheet is shared with the **client_email** from your `credentials.json`.

---

## ▶️ Usage

### 1️⃣ Run the Image Quality Scanner

```bash
node image-quality-scanner.js
```

📁 This will create `image-quality-scanner.csv` in the project root containing all audit results.

---

### 2️⃣ Push to Google Sheets (Optional)

```bash
node upload-to-sheets.js
```

- Reads from `image-quality-scanner.csv`
- Appends the results to the configured Google Sheet/tab
 

---

## 🤝 Contributing

We welcome contributions from everyone!

1. Fork the repository  
2. Create a feature branch  
   ```bash
   git checkout -b feature/your-feature-name
   ```  
3. Make your changes  
4. Commit and push  
   ```bash
   git commit -m "Add: your change description"
   git push origin feature/your-feature-name
   ```  
5. Open a Pull Request  

---

## 📜 License

Distributed under the MIT License.  
See [`LICENSE`](./LICENSE) for full details.