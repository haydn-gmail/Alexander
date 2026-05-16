# 🍼 Alexander Baby Tracker

A mobile-first web app for tracking newborn feeding and elimination records. Built for sleep-deprived parents who need a fast, one-tap logging experience at 3 AM.

## Features

- **Feeding Session Tracking** — Optional start and completion times for all feeding types (Breast, Formula, Bottle) with automatic session duration calculation
- **Quick-tap logging** — Breast (L/R), Formula/Bottle (mL presets), Urine, Stool with color, and Bath
- **Timeline view** — Chronological card-based log with session durations highlighted
- **Daily summary** — Feeding counts, total mL, **Total Feeding Time**, diaper stats, and days since last bath at a glance
- **Log Exports** — Download neatly formatted PDFs, raw CSVs, or structured Markdown files (includes session times and daily feeding totals)
- **Robust Web App** — Replaces buggy native mobile browser dialogs with custom modals to ensure PWA integrity on iOS
- **Role-based access** — Dad & Mom get full CRUD, Family members get view-only
- **Bilingual** — English (default) and 中文 with one-tap toggle
- **Dark mode** — Easy on the eyes for nighttime feedings

## Quick Start (Docker)

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/Alexander.git
cd Alexander

# Configure
cp .env.example .env
# Edit .env — set JWT_SECRET and HOST_PORT (default: 3001)

# Start the container
docker compose up -d

# Open in browser
# http://<your-server-ip>:3001
```

## Default Login PINs

| Role   | PIN    | Permissions        |
|--------|--------|--------------------|
| Dad    | `1234` | View, Add, Edit, Delete |
| Mom    | `5678` | View, Add, Edit, Delete |
| Family | `0000` | View only          |

> ⚠️ Change these PINs after first login (or modify `server/db.js` seed data before first run).

## Deploy on Ubuntu VM

```bash
# 1. Install Docker (if not already)
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
# Log out and back in for group change to take effect

# 2. Clone and start
git clone https://github.com/YOUR_USERNAME/Alexander.git
cd Alexander
cp .env.example .env
nano .env  # Set a random JWT_SECRET

docker compose up -d

# 3. Verify
docker compose logs -f
# Should see: 🍼 Baby Tracker running at http://localhost:3000

# 4. Access from any device on your network
# http://<ubuntu-vm-ip>:3000
```

### Auto-start on boot

Docker's `restart: unless-stopped` policy handles this. The container will automatically restart after a reboot as long as Docker is enabled:

```bash
sudo systemctl enable docker
```

## Seed Historical Data

If you have records to import, edit `seed-from-photos.js` and run:

```bash
# On local machine (before Docker)
node seed-from-photos.js

# Or copy the DB into the container
docker cp data/baby_tracker.db baby-tracker:/app/data/
docker compose restart
```

## Project Structure

```
├── server/
│   ├── index.js          # Express server
│   ├── db.js             # SQLite (sql.js) database layer
│   ├── middleware/
│   │   └── auth.js       # JWT verification & role check
│   └── routes/
│       ├── auth.js       # PIN login → JWT
│       └── entries.js    # CRUD + summary + CSV export
├── public/
│   ├── index.html        # SPA shell
│   ├── manifest.json     # PWA manifest
│   ├── sw.js             # Service worker
│   ├── css/
│   │   └── style.css     # Design system
│   └── js/
│       ├── app.js        # Main orchestrator
│       ├── api.js        # Fetch client with JWT
│       ├── i18n.js       # Language module
│       ├── utils.js      # Date/time helpers
│       ├── lang/         # en.json, zh.json
│       └── components/   # login, entry-form, timeline, summary
├── data/                 # SQLite DB (gitignored, volume-mounted)
├── Dockerfile
├── docker-compose.yml
├── seed-from-photos.js   # One-time import script
└── .env.example
```

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | Vanilla JS (ES modules), CSS |
| Backend  | Express.js |
| Database | SQLite via sql.js (pure WASM, zero native deps) |
| Auth     | bcrypt + JWT (7-day expiry) |
| Deploy   | Docker (Alpine Node 20) |

## Backup

The SQLite database lives in `./data/baby_tracker.db`. To backup:

```bash
# Simple file copy
cp data/baby_tracker.db data/baby_tracker.db.bak

# Or from running container
docker cp baby-tracker:/app/data/baby_tracker.db ./backup_$(date +%Y%m%d).db
```

## License

MIT
