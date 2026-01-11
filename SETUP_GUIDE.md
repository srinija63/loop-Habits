# 🚀 Loop Habits - Setup Guide

This guide will help you set up the complete Loop Habits app with user authentication and MongoDB.

---

## 📋 Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB Atlas** account (free) - [Sign up](https://cloud.mongodb.com/)

---

## 🗄️ Step 1: Set Up MongoDB Atlas (Free)

1. **Go to** [cloud.mongodb.com](https://cloud.mongodb.com/) and create a free account

2. **Create a new cluster:**
   - Click "Build a Database"
   - Select "FREE" (M0 Sandbox)
   - Choose a cloud provider and region close to you
   - Click "Create Cluster"

3. **Create a database user:**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Enter a username and password (remember these!)
   - Set privileges to "Read and write to any database"
   - Click "Add User"

4. **Allow network access:**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

5. **Get your connection string:**
   - Go to "Database" in the left sidebar
   - Click "Connect" on your cluster
   - Click "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/...`)
   - Replace `<password>` with your actual password

---

## ⚙️ Step 2: Configure the Backend

1. **Navigate to the backend folder:**
   ```bash
   cd "C:\Users\Lenovo\Desktop\habits app\backend"
   ```

2. **Create the .env file:**
   - Copy `env.txt` to `.env`
   - Or create a new file called `.env` with:

   ```env
   MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/loophabits?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-key-make-it-at-least-32-characters-long
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

---

## 🚀 Step 3: Run the App

You need TWO terminals running:

### Terminal 1 - Backend Server:
```bash
cd "C:\Users\Lenovo\Desktop\habits app\backend"
npm start
```

You should see:
```
🚀 Server running on port 5000
✅ Connected to MongoDB
```

### Terminal 2 - Frontend Server:
```bash
cd "C:\Users\Lenovo\Desktop\habits app"
python -m http.server 3000
```

---

## 🌐 Step 4: Open the App

1. Open your browser: **http://localhost:3000**
2. You should see the **Login/Signup** screen
3. Create an account and start tracking habits!

---

## 📱 Step 5: Access on iPhone

1. Find your computer's IP:
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., `192.168.1.3`)

2. On your iPhone (same WiFi), open Safari:
   ```
   http://192.168.1.3:3000
   ```

3. Tap Share → "Add to Home Screen"

---

## 🌍 Step 6: Deploy Online (Optional)

To access from anywhere without running local servers:

### Deploy Backend to Render (Free):

1. Push your code to GitHub
2. Go to [render.com](https://render.com)
3. Create a "Web Service"
4. Connect your GitHub repo
5. Set build command: `npm install`
6. Set start command: `npm start`
7. Add environment variables (MONGODB_URI, JWT_SECRET, etc.)
8. Deploy!

### Deploy Frontend to Netlify (Free):

1. Go to [netlify.com/drop](https://app.netlify.com/drop)
2. Drag your `habits app` folder (without the backend folder)
3. Update `js/api.js` to use your Render backend URL

---

## ❓ Troubleshooting

### "Cannot connect to MongoDB"
- Check your MongoDB connection string
- Make sure you replaced `<password>` with your actual password
- Check Network Access allows your IP

### "Backend not available"
- Make sure the backend server is running on port 5000
- Check the terminal for error messages

### "CORS error"
- Update `FRONTEND_URL` in your `.env` file

### App works locally but not on iPhone
- Both devices must be on the same WiFi
- Use your computer's IP address, not "localhost"
- Make sure firewall allows port 3000 and 5000

---

## 📁 Project Structure

```
habits app/
├── index.html          # Main app
├── manifest.json       # PWA config
├── service-worker.js   # Offline support
├── css/styles.css      # Styling
├── js/
│   ├── app.js          # Main logic
│   ├── api.js          # Backend API client
│   ├── db.js           # Local storage (fallback)
│   └── ...
├── backend/
│   ├── server.js       # Express server
│   ├── package.json    # Dependencies
│   ├── env.txt         # Config template
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API endpoints
│   └── middleware/     # Auth middleware
└── icons/              # PWA icons
```

---

## 🎉 You're Done!

Your habit tracker is now:
- ✅ Running with user authentication
- ✅ Storing data in MongoDB
- ✅ Accessible on your iPhone
- ✅ Working offline (falls back to local storage)

Happy habit tracking! 🎯
