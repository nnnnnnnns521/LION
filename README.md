# To the Next 40 — Nicole's Birthday Prediction Party

A birthday party prediction game web app for Nicole's 40th birthday. Guests submit their predictions for the future, and results are revealed at the party.

## Setup

### 1. Set up Vercel KV

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Storage** → **Create Database** → **KV**
3. Follow the prompts to create the store
4. Copy the environment variables shown in the dashboard:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### 2. Connect GitHub Repo to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Under **Environment Variables**, add all 4 KV variables from step 1
4. Also add `NEXT_PUBLIC_APP_URL` = your live URL (e.g. `https://nicole40.vercel.app`)
5. Click **Deploy**

### 3. Find the Live URL for the QR Code

- After deploying, Vercel shows your live URL (e.g. `https://your-project.vercel.app`)
- Set this as `NEXT_PUBLIC_APP_URL` in your Vercel environment variables
- Go to `/qr` to see the QR code pointing to the guest form

### 4. Access Admin

- Go to `/admin` on your live site
- Password: `nextforty`
- See all submissions in real time, with a "Copy shareable link" button for `/results`

## Pages

| URL | Description |
|-----|-------------|
| `/` | Guest prediction form |
| `/admin` | Password-protected admin view (password: `nextforty`) |
| `/results` | Public results grouped by question — keepsake-style |
| `/qr` | Large QR code for printing/displaying at the party |

## Local Development

```bash
cp .env.example .env.local
# Fill in your KV env vars
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
