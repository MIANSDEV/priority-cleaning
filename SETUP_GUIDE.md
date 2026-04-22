# Cleaning Quote App — Setup & Deployment Guide

## What you're getting

- A **Next.js 14** app that looks and works like Stanley Steemer's quote builder
- Multi-step quote wizard: Select Services → Schedule → Contact Info → Review & Book
- Password-protected admin panel at `/admin/dashboard`
- Free hosting on **Vercel** + free database on **Supabase**
- Embeds in WordPress via a single `<iframe>` tag

---

## Step 1 — Create a Supabase project (free database)

1. Go to [https://supabase.com](https://supabase.com) and sign up (free)
2. Click **New Project** → give it any name → choose a password → pick a region close to you
3. Wait ~2 minutes for it to start
4. Go to **SQL Editor** (left sidebar)
5. Click **New query**
6. Open the file `database/schema.sql` from this project, paste the entire contents, and click **Run**
   - This creates all tables and seeds them with services + sample promo codes
7. Go to **Settings → API**
8. Copy these two values — you'll need them in Step 3:
   - **Project URL** (looks like `https://xxxxxxxxxxxx.supabase.co`)
   - **anon / public** key (long string starting with `eyJ...`)
   - **service_role** key (keep this secret — never expose it publicly)

---

## Step 2 — Push this code to GitHub

1. Create a new **private** repository on [github.com](https://github.com)
2. In your terminal, inside this project folder, run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

---

## Step 3 — Deploy to Vercel (free hosting)

1. Go to [https://vercel.com](https://vercel.com) and sign up (use your GitHub account)
2. Click **Add New → Project**
3. Import your GitHub repository
4. In the **Environment Variables** section, add these:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL from Step 1 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key from Step 1 |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service_role key from Step 1 |
   | `ADMIN_PASSWORD` | Choose a strong password (e.g., `MySecurePass123!`) |
   | `JWT_SECRET` | Any random long string (e.g., generate at https://generate-secret.vercel.app/32) |

5. Click **Deploy** — Vercel will build and deploy your app in ~2 minutes
6. Your app is now live at something like `https://cleaning-quote-app.vercel.app`

---

## Step 4 — Embed in WordPress

Copy this HTML code and paste it into any WordPress page using the **HTML block** (Gutenberg) or the **Custom HTML widget**:

```html
<iframe
  src="https://YOUR-APP-NAME.vercel.app"
  width="100%"
  height="900"
  style="border: none; min-height: 900px;"
  scrolling="yes"
  title="Cleaning Quote Tool"
></iframe>

<script>
  // Auto-resize iframe to content height
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'resize') {
      document.querySelector('iframe').style.height = e.data.height + 'px';
    }
  });
</script>
```

**Replace** `YOUR-APP-NAME.vercel.app` with your actual Vercel URL.

**Tips for WordPress:**
- Use **Elementor** or **WPBakery**? Use their HTML embed widget
- Set the iframe height to at least `900px` for best display
- If using a page builder, set the section to 100% width with no padding/margins

---

## Step 5 — Access the Admin Panel

- Go to: `https://YOUR-APP-NAME.vercel.app/admin/login`
- Enter the `ADMIN_PASSWORD` you set in Step 3
- You'll be taken to `/admin/dashboard`

**What you can do in the admin:**

| Section | What you can control |
|---------|---------------------|
| **Dashboard** | See total bookings, revenue, and recent activity |
| **Bookings** | View all customer bookings, filter by status, update status (pending → confirmed → completed) |
| **Services & Pricing** | Change prices for every service and level. Toggle entire categories on/off |
| **Promo Codes** | Create/delete promo codes, set %, fixed discounts, min orders, expiry dates |
| **Online Specials** | Add/remove the promotional banners shown in the sidebar |

---

## How pricing works

Each service item has one or more "levels" (e.g., Clean / Protect / Deodorize). Each level has its own price per unit.

- To change a price: go to **Admin → Services & Pricing**, find the service, edit the `$` input next to the level name, and click the save button
- To hide a service: toggle the switch in the category header
- Changes take effect **immediately** — customers see the new prices on their next page load

---

## Updating the app later

Any time you make code changes:
1. Push to GitHub (`git add . && git commit -m "update" && git push`)
2. Vercel automatically rebuilds and deploys within 1–2 minutes

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank page after deploy | Check Vercel logs for errors; make sure all env vars are set |
| "Invalid API key" errors | Double-check your Supabase URL and anon key in Vercel env vars |
| Admin login not working | Make sure `ADMIN_PASSWORD` and `JWT_SECRET` are set in Vercel |
| Services not loading | Run the `database/schema.sql` file in Supabase SQL Editor |
| iframe not showing in WordPress | Make sure your WordPress theme allows iframes; try a page builder HTML block |

---

## Tech Stack Summary

| Component | Technology | Cost |
|-----------|-----------|------|
| Frontend + Backend | Next.js 14 (App Router) | Free |
| Hosting | Vercel | Free (Hobby plan) |
| Database | Supabase (PostgreSQL) | Free (500MB) |
| Styling | Tailwind CSS | Free |
| Admin auth | JWT cookie (no third-party) | Free |

**Total monthly cost: $0**

---

*Built to match the Stanley Steemer cleaning quote experience.*
