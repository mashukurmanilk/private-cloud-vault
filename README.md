# 🛡️ Private Cloud Vault

A minimal, private personal cloud storage hub built with **Next.js 14**, **React**, **TypeScript**, **Tailwind CSS**, **Prisma**, and **SQLite**.

Store files, stream videos with range requests, save web links with auto-previews, write markdown notes, and access everything across your devices (PC, Mac, iPhone, Android) with master authentication.

---

## ✨ Features

- **🛡️ Master Authentication**: 100% private with bcrypt password hashing, JWT session cookies, and numeric PIN keypad for mobile.
- **📁 File & Document Vault**: Drag-and-drop batch upload, clipboard screenshot paste (`Ctrl+V`), and inline previews for images, PDFs, audio, code, and text.
- **🎬 Video Theater & Streaming**: Native HTTP 206 Partial Content range requests for instant scrubbing/seeking on mobile browsers.
- **🔗 Smart Link Hub**: Automatic OpenGraph metadata extraction (titles, descriptions, favicons).
- **📝 Markdown Notes & Snippets**: Clean markdown editor, pinned notes, and code block copy.
- **📱 Multi-Device & Mobile Ready**: Automatic local network IP detection, QR code for phone pairing, and PWA support ("Add to Home Screen").
- **⚡ Minimal & Distraction-Free UI**: Clean monochrome design system.

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/your-username/private-cloud-vault.git
cd private-cloud-vault
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```
Generate a random secret for `JWT_SECRET` in `.env`.

### 3. Initialize Database
```bash
npx prisma db push
```

### 4. Run Locally
```bash
# Development:
npm run dev

# Production:
npm run build
npm start
```
Open **`http://localhost:3000`** in your browser. On your first visit, the setup wizard will guide you to create your master username, password, and unlock PIN.

---

## 📱 Mobile & Cross-Device Access (Wi-Fi)

1. Make sure your phone is connected to the same Wi-Fi as your computer.
2. Go to the **Settings** page in Vault to see your local IP and QR Code.
3. Scan the QR code or visit `http://YOUR_LOCAL_IP:3000` on your phone.
4. Tap **"Add to Home Screen"** in Safari / Chrome for a native app experience.

---

## ☁️ 24/7 Cloud Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step guides on:
- **Cloudflare Tunnel** (100% free secure global HTTPS access without port forwarding)
- **Railway / Render / Fly.io** (1-click cloud container with persistent volume)
- **Docker Compose**:
  ```bash
  docker compose up -d --build
  ```

---

## 🔒 Security Notice

- `.env`, `prisma/*.db`, and `uploads/` are excluded by `.gitignore` by default.
- Never commit your `.env` file or local `vault.db` containing password hashes to GitHub.
