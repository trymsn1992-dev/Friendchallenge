# Deploying ChallengeFriends to Vercel

Follow these steps to deploy your application to production.

## 1. ⚠️ CRITICAL: Update Database Schema
The error you saw (`Could not find the 'full_name' column`) happens because we updated the code but not the actual database.

1.  **Log in to [Supabase Dashboard](https://supabase.com/dashboard)**.
2.  Go to your project.
3.  Click on **SQL Editor** (icon looking like `_>_` in the left sidebar).
4.  Click **New Query**.
5.  Paste the following SQL code and click **Run**:

```sql
alter table profiles 
add column if not exists full_name text;

alter table profiles 
add column if not exists avatar_url text;
```

## 2. Push Code to GitHub
You need to get your code onto GitHub so Vercel can access it.

1.  **Create a new repository** on [GitHub](https://github.com/new). Name it `friendchallenge`.
2.  **Don't** initialize it with README/gitignore (we already have them).
3.  Copy the commands under "…or push an existing repository from the command line".
4.  Run them in your terminal (I can run them for you if you paste the URL here).

Example commands:
```bash
git remote add origin https://github.com/YOUR_USERNAME/friendchallenge.git
git branch -M main
git push -u origin main
```

## 3. Deploy on Vercel
1.  **Log in to [Vercel](https://vercel.com)**.
2.  Click **"Add New..."** -> **"Project"**.
3.  Select your `friendchallenge` repository and click **Import**.
4.  **Configure Project**:
    *   **Framework Preset**: Vite (should be auto-detected).
    *   **Root Directory**: `./` (default).
    *   **Build Command**: `npm run build` (default).
    *   **Output Directory**: `dist` (default).
5.  **Environment Variables** (Open the tab):
    You need to copy these from your local `.env` file:
    *   `VITE_SUPABASE_URL`
    *   `VITE_SUPABASE_ANON_KEY`
    *   `VITE_GEMINI_API_KEY`
6.  Click **Deploy**.

## 4. Final Verify
Once Vercel gives you a URL (e.g., `friendchallenge.vercel.app`):
1.  Go to Supabase Dashboard -> **Authentication** -> **URL Configuration**.
2.  Add your new Vercel URL to **Site URL** and **Redirect URLs**.
    *   This ensures Google Login works in production.
