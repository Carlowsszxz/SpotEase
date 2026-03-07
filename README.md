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

If you want, I can create a GitHub Actions workflow to auto-deploy to GitHub Pages, or provide a ready-to-run `vercel.json`. Tell me which option you prefer and I'll add it.
