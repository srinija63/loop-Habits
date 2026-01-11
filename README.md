# 🎯 Loop Habits - PWA Habit Tracker

A beautiful, offline-first habit tracking Progressive Web App inspired by [Loop Habit Tracker](https://play.google.com/store/apps/details?id=org.isoron.uhabits) for Android.

![Loop Habits Preview](https://img.shields.io/badge/Platform-PWA-6c5ce7?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-00b894?style=for-the-badge)

## ✨ Features

- 📱 **Installable PWA** - Add to your iPhone home screen for a native app experience
- 🌙 **Dark/Light Mode** - Beautiful themes that are easy on the eyes
- 📊 **Habit Strength Algorithm** - Advanced scoring based on your consistency (not just streaks!)
- 📈 **Detailed Statistics** - Charts and graphs to visualize your progress
- 📅 **Flexible Schedules** - Daily, X times per week, or custom intervals
- 🎉 **Confetti Celebrations** - Fun animations when you complete habits
- 💾 **Offline Support** - Works without internet, data stored locally
- 🔒 **Privacy First** - All data stays on your device
- 📤 **CSV Export** - Export your data anytime

## 🚀 Quick Start

### Option 1: Local Development Server (Recommended)

1. **Install a local server** (choose one):
   
   ```bash
   # Option A: Using Python (usually pre-installed)
   python -m http.server 8080
   
   # Option B: Using Node.js
   npx serve
   
   # Option C: Using PHP
   php -S localhost:8080
   ```

2. **Open in browser**: Navigate to `http://localhost:8080`

3. **Generate icons**: Open `generate-icons.html` in your browser and download the icons

### Option 2: VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html` → "Open with Live Server"

## 📱 Installing on iPhone

1. **Open Safari** on your iPhone
2. **Navigate to your local server** (both devices must be on same WiFi):
   - Find your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac)
   - Open `http://YOUR_IP:8080` in Safari
3. **Tap the Share button** (square with arrow)
4. **Scroll down** and tap "Add to Home Screen"
5. **Name it** and tap "Add"

The app will now appear on your home screen like a native app!

## 🌐 Deploying Online (Free)

To access from anywhere (not just local WiFi), deploy to a free hosting service:

### Netlify (Recommended)
1. Go to [netlify.com](https://www.netlify.com/)
2. Drag and drop your `habits app` folder
3. Get a free URL like `your-app.netlify.app`

### GitHub Pages
1. Create a GitHub repository
2. Upload all files
3. Enable GitHub Pages in Settings
4. Access at `username.github.io/repo-name`

### Vercel
1. Go to [vercel.com](https://vercel.com/)
2. Import your folder
3. Deploy with one click

## 📁 Project Structure

```
habits app/
├── index.html          # Main HTML file
├── manifest.json       # PWA manifest
├── service-worker.js   # Offline support
├── css/
│   └── styles.css      # All styling
├── js/
│   ├── app.js          # Main application logic
│   ├── db.js           # IndexedDB database layer
│   ├── habit-score.js  # Habit strength algorithm
│   ├── charts.js       # Chart.js configurations
│   ├── confetti.js     # Celebration animations
│   └── utils.js        # Utility functions
├── icons/
│   └── icon.svg        # Base icon (generate PNGs)
├── generate-icons.html # Icon generator tool
└── README.md           # This file
```

## 🎨 Generating PWA Icons

PWA apps need PNG icons at various sizes. To generate them:

1. Open `generate-icons.html` in Chrome or Edge
2. Click "Download All" or right-click each icon to save
3. Save all icons to the `icons/` folder

Required sizes: 72, 96, 128, 144, 152, 192, 384, 512 pixels

## 📖 How the Habit Score Works

Unlike simple "don't break the chain" apps, Loop Habits uses an intelligent scoring system:

- **Completions increase strength** gradually (~5% per completion)
- **Misses decrease strength** gradually (~3.5% per miss)
- **Long streaks are protected** - missing one day won't reset everything
- **Score approaches but never reaches 100%** - always room to improve!

This is psychologically healthier and more realistic for habit building.

## 🛠️ Customization

### Changing Colors
Edit CSS variables in `css/styles.css`:
```css
:root {
  --primary: #6c5ce7;
  --accent: #00cec9;
  --success: #00b894;
  /* ... */
}
```

### Adding New Icons
Add emoji options in `index.html` inside the icon-picker div.

### Modifying the Score Algorithm
Edit `js/habit-score.js` to adjust:
- `SCORE_INCREASE` - How much a completion increases strength
- `SCORE_DECREASE` - How much a miss decreases strength

## 📄 License

MIT License - feel free to use, modify, and distribute!

## 🙏 Credits

- Inspired by [Loop Habit Tracker](https://github.com/iSoron/uhabits) by Álinson S Xavier
- Charts powered by [Chart.js](https://www.chartjs.org/)
- Font: [Outfit](https://fonts.google.com/specimen/Outfit) by Rodrigo Fuenzalida

---

Made with 💜 for building better habits
