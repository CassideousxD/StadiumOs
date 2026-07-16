# StadiumOS 🏟️ Deployment Guide

Follow these steps to deploy StadiumOS with the backend on **Render** (as a persistent Web Service) and the frontend on **Vercel**.

> [!IMPORTANT]
> **Deployment Order**: You MUST deploy the **Backend on Render first**, as the Frontend on Vercel requires the deployed Render backend URL to compile its static bundle.

---

## 🐍 Part 1: Deploy Backend to Render

1. **Sign in to Render**: Go to [https://render.com](https://render.com).
2. **Create a New Web Service**:
   - Click **New +** > **Web Service**.
   - Connect your GitHub repository.
3. **Configure Project Settings**:
   Render will automatically detect the `render.yaml` file at the root. If deploying manually, ensure:
   - **Name**: `stadiumos-backend`
   - **Runtime**: `Python 3`
   - **Root Directory**: `(Leave empty - root level)`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
4. **Configure Environment Variables**:
   Under **Environment**, Render will prompt you to fill in the variables marked `sync: false` in `render.yaml`:
   - `GEMINI_API_KEY`: Enter your Google AI Gemini API Key.
   - `CORS_ORIGINS`: Enter your future Vercel frontend URL and local dev origin (comma-separated, e.g., `https://stadiumos.vercel.app,http://localhost:5173`).
   - `PYTHONPATH`: `.` (Set automatically by `render.yaml`).
5. **Deploy**: Click **Deploy Web Service**.
6. **Note the URL**: Once deployed successfully, copy the service URL (e.g., `https://stadiumos-backend.onrender.com`).

---

## ⚛️ Part 2: Deploy Frontend to Vercel

1. **Sign in to Vercel**: Go to [https://vercel.com](https://vercel.com).
2. **Import Repository**:
   - Click **Add New** > **Project**.
   - Import your GitHub repository.
3. **Configure Framework & Root Settings**:
   - **Framework Preset**: `Vite` (Vercel will auto-detect this).
   - **Root Directory**: Set this to **`frontend`** (Click Edit, select the `frontend` folder, and save).
4. **Configure Environment Variables**:
   Open the **Environment Variables** accordion and add:
   - **Key**: `VITE_API_URL`
   - **Value**: Enter your deployed Render backend URL (e.g., `https://stadiumos-backend.onrender.com` — **Do not include a trailing slash**).
5. **Deploy**: Click **Deploy**.
6. **SPA Routing**: Vercel will build Vite cleanly and use the `frontend/vercel.json` file automatically to route all SPA requests (like `/control-tower` or `/fan`) to `/index.html`.

---

## ⚡ Verification

1. **Backend Uptime**: Open `https://<your-backend>.onrender.com/health` in your browser. It should respond with `{"status":"ok", ...}`.
2. **Operations Dashboard**: Open your Vercel URL. You should be able to transition to the Control Tower dashboard, observe fluctuating telemetry, trigger incidents, generate shift reports, and export raw logs.
