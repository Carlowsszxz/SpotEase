# Project Management — Frontend Prototype

Static HTML/CSS/JS frontend for a resource reservation prototype. This repository contains multiple frame pages under the workspace root and static assets in `CSS/`, `JS/`, and `Others/`.

This README includes quick steps to put the project under Git and push to GitHub, plus optional GitHub Pages deployment instructions.

Quick local git + GitHub (recommended)

1. Initialize git, commit, and create a remote repository (replace `<user>` and `<repo>`):

```bash
cd "c:/Users/PC/Desktop/Project Management"
git init
git add --all
git commit -m "Initial commit: Project Management frontend"
# Option A: create remote manually on GitHub and then add it
git remote add origin https://github.com/<user>/<repo>.git
git branch -M main
git push -u origin main
```

2. Create the repo on GitHub:
- Option: use the GitHub website and create a new repo, then follow instructions above.
- Or use GitHub CLI (if installed):
```bash
gh repo create <user>/<repo> --public --source=. --remote=origin --push
```

Deploy options

- Vercel: connect your GitHub repo to Vercel (Import Project) — Vercel will auto-deploy on pushes to `main`.
- GitHub Pages: enable from the repository Settings → Pages and select the branch/folder (for a simple static site you can publish from `main` / root or use `gh-pages` branch). You can also configure a GitHub Action to automatically deploy to Pages.

Authentication

- This project uses Supabase for auth in the provided code. If you use OAuth (Google), make sure your deployed origin(s) are configured in your OAuth provider and in the Supabase project settings.

Notes

- Remove or update any Firebase-related files if you are not using Firebase (the template previously referenced `JS/firebase-init.js`).
- For production, you should implement server-side token verification for sensitive operations.

AI Chatbot (free-tier or local)

This project now includes a chatbot widget on `FrameHome.html` and a local backend proxy at `server/chat-proxy.js`.

1. Create environment file:

```bash
cd "c:/Users/PC/Desktop/Project Management"
copy .env.example .env
```

2. Choose provider in `.env`:
- `AI_PROVIDER=auto` (tries Hugging Face first, then Ollama)
- `AI_PROVIDER=huggingface` (free-tier API; requires `HF_API_KEY`)
- `AI_PROVIDER=ollama` (fully local; install Ollama and pull a model)

3. Start the chatbot backend:

```bash
npm run chat:server
```

4. In another terminal, start frontend:

```bash
npm run dev
```

5. Open `FrameHome.html` via Vite dev URL and use the “Ask SpotEase AI” button at bottom-right.

Optional Ollama setup:

```bash
ollama pull llama3.2:3b
ollama serve
```

Notes

- API keys stay server-side (never exposed in browser JS).
- Proxy includes basic rate limiting, max message size, timeout, and keyword blocking.
- Free API quotas are limited; local Ollama avoids recurring API cost.

Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel, import the repository as a new project.
3. Keep the project root as-is; Vercel will serve the static HTML files and the serverless function in [api/chat.js](api/chat.js).
4. Add these environment variables in Vercel → Project Settings → Environment Variables:

	- `AI_PROVIDER=huggingface`
	- `HF_API_KEY=your_hugging_face_token`
	- `HF_MODEL=your_supported_hf_model`

5. Deploy.

Notes

- The chatbot button and panel are loaded from the static front end, so they will still appear on Vercel.
- The chat will only work if the `/api/chat` function is deployed, which is handled by [api/chat.js](api/chat.js).
- If a Hugging Face model is not supported by your enabled providers, the function will try a fallback model automatically.

If you want, I can create a GitHub Actions workflow to auto-deploy to GitHub Pages, or provide a ready-to-run `vercel.json`. Tell me which option you prefer and I'll add it.
