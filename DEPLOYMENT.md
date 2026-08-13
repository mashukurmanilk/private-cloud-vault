# Private Cloud Vault - Deployment & Multi-Device Access Guide

This guide details all the ways you can access and deploy your **Private Cloud Vault** from any device (PC, Mac, iPhone, Android, iPad, etc.).

---

## 📱 Option 1: Instant Local Wi-Fi / LAN Access (Zero Cost, Instant)

You can run the vault on your main computer and immediately access it from any phone or tablet on the same Wi-Fi.

1. **Start the server on your computer**:
   ```bash
   npm run dev
   # or for production:
   npm run build && npm start
   ```
2. **Find your computer's IP address**:
   - Go to `Settings & Sync` in the web app or check your local Wi-Fi IP (e.g. `192.168.1.150`).
3. **Open on your phone**:
   - On your phone browser (Safari / Chrome), go to: `http://192.168.1.150:3000`
   - Or simply scan the **QR Code** displayed in the `Settings & Sync` tab!
4. **Install as Native App (PWA)**:
   - **iOS (Safari)**: Tap the Share button $\rightarrow$ Select **"Add to Home Screen"**.
   - **Android (Chrome)**: Tap the 3-dots menu $\rightarrow$ Select **"Install App"** or **"Add to Home screen"**.

---

## 🌐 Option 2: Free 24/7 Global HTTPS Access with Cloudflare Tunnel (Recommended)

Cloudflare Tunnel lets you access your local vault securely from anywhere in the world (even outside your home Wi-Fi) without opening ports on your router:

1. Download and install `cloudflared`:
   - **On Windows**: Open PowerShell and run:
     ```powershell
     winget install --id Cloudflare.cloudflared
     ```
   - **On Mac**: `brew install cloudflare/cloudflare/cloudflared`
   - **On Linux**: 
     ```bash
     curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
     sudo dpkg -i cloudflared.deb
     ```
2. Start an instant quick tunnel to your vault:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
3. Cloudflare will output a free, secure `https://xxx.trycloudflare.com` URL. Open that URL on your phone anytime, anywhere!

---

## ☁️ Option 3: 1-Click Cloud Hosting (Railway / Render / Fly.io)

For 24/7 always-on hosting in the cloud:

### Deploy to Vercel (Requires Cloud DB & Storage)
**Important Note:** Vercel uses a serverless architecture with a read-only, ephemeral file system. If you deploy this project as-is on Vercel, your local SQLite database and uploaded files will reset randomly.
To deploy to Vercel properly, you must:
1. Switch to a Cloud Database (like Supabase or Neon PostgreSQL) in `prisma/schema.prisma`.
2. Modify `src/lib/storage.ts` to upload files to cloud storage like AWS S3, Cloudflare R2, or Firebase.
3. After those changes, you can link your GitHub repository to Vercel and it will deploy perfectly!

### Deploy to Railway
1. Push this project to your GitHub repository.
2. Go to [railway.app](https://railway.app) $\rightarrow$ New Project $\rightarrow$ **Deploy from GitHub repo**.
3. Add a **Persistent Volume** mounted at `/app/uploads` and `/app/prisma` so your uploaded files and database persist across restarts.
4. Set Environment Variables:
   - `JWT_SECRET`: A long random secret key
   - `DATABASE_URL`: `file:/app/prisma/vault.db`
   - `STORAGE_DIR`: `/app/uploads`

### Deploy with Docker
```bash
docker compose up -d --build
```
Your vault will be running at `http://localhost:3000` with persistent volumes stored in `vault_data` and `vault_uploads`.

---

## 🔒 Security Best Practices

1. **Master Password**: Pick a strong password during first-time setup (`/setup`).
2. **Quick PIN**: Set a 4-6 digit numeric PIN in Settings for fast unlock on phone touchscreens.
3. **Temporary Share Links**: If you ever want to share a file or video with someone else, generate a share link with an expiration time (e.g. 24 hours) and optional password protection.
