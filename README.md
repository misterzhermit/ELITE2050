<div align="center">

# ⚽ ELITE 2050

**Football Management in a Cyberpunk Future**

A futuristic football management simulation built with React 19, TypeScript, and Supabase.

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-2.97-3ECF8E?logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&logoColor=white)

</div>

---

## 🎮 About

**ELITE 2050** is a browser-based football management game set in a cyberpunk future. Manage your franchise in a dystopian world where districts compete for supremacy. Draft players, configure tactics, negotiate transfers, and lead your team to glory through a fully simulated match engine.

### Key Features

- **Tick-by-tick Match Engine** — Real-time match simulation with tactical depth (play styles, mentalities, tactical cards)
- **Procedural Generation** — Every world is unique: players, teams, leagues, and calendars generated on the fly
- **Pentagon Rating System** — 5-axis player attributes (FOR, AGI, INT, TAT, TEC) with fusion skills and badges
- **4 District Leagues** — Norte, Sul, Leste, Oeste — each with its own league, cup tournaments, and rankings
- **Transfer Market** — Scout, bid, and negotiate for talent across all districts
- **Multiplayer Worlds** — Shared worlds via Supabase where multiple managers can compete
- **Cyberpunk Aesthetic** — Glassmorphism, neon glows, and premium UI design throughout

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- A [Supabase](https://supabase.com/) project (for auth & cloud saves)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd elite-2050

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials
```

### Running Locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Building for Production

```bash
npm run build
```

---

## 🏗️ Project Structure

```
elite-2050/
├── src/
│   ├── components/           # React UI components
│   │   ├── dashboard/        # Dashboard tab components (Home, Squad, Tactics, etc.)
│   │   ├── ErrorBoundary.tsx  # Global error handling
│   │   ├── Dashboard.tsx      # Main dashboard orchestrator
│   │   ├── Login.tsx          # Authentication flow
│   │   ├── LineupBuilder.tsx  # Tactical lineup editor
│   │   ├── MatchReports.tsx   # Post-match analysis
│   │   ├── NewGameFlow.tsx    # World creation wizard
│   │   └── WorldSelector.tsx  # World/save management
│   ├── constants/             # Centralized game constants
│   ├── docs/                  # Technical documentation
│   ├── engine/                # Core game engine
│   │   ├── gameLogic.ts       # Day advancement, standings, safety net
│   │   ├── generator.ts       # Procedural world generation
│   │   ├── MatchEngine.ts     # Match simulation engine
│   │   ├── CalendarGenerator.ts # Round-robin calendar generation
│   │   └── simulation.ts      # Match event calculations & evolution
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # External service integrations (Supabase)
│   ├── store/                 # State management (Context + Reducer)
│   ├── types.ts               # TypeScript type definitions
│   └── utils/                 # Utility functions
├── supabase/
│   ├── functions/             # Edge Functions (server-side logic)
│   └── migrations/            # Database schema migrations
└── public/                    # Static assets
```

---

## 🧪 Testing

```bash
# Run unit & component tests
npm run test

# Type checking
npx tsc --noEmit
```

---

## 📖 Documentation

- [`src/docs/ARCHITECTURE.md`](src/docs/ARCHITECTURE.md) — System architecture overview
- [`src/docs/GAME_DESIGN.md`](src/docs/GAME_DESIGN.md) — Game rules, rating system, and mechanics
- [`src/docs/UI_PATTERNS.md`](src/docs/UI_PATTERNS.md) — UI design system and patterns

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19 |
| **Build Tool** | Vite 6.2 |
| **Language** | TypeScript 5.8 |
| **Styling** | TailwindCSS 4 |
| **Animation** | Framer Motion 12 |
| **Charts** | Recharts 3.7 |
| **Icons** | Lucide React |
| **Backend** | Supabase (Auth, Database, Edge Functions) |
| **Testing** | Vitest + React Testing Library |

---

## 📄 License

This project is private and not licensed for distribution.
