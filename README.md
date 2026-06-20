# Carbonlytix – Carbon Footprint Awareness Platform

Carbonlytix is a production-ready, full-stack climate-tech SaaS web application designed to help users calculate, analyze, track, and offset their carbon footprint. The platform combines advanced interactive dashboards, personalized AI-modeled recommendations, budget-setting targets, educational resources, and gamified challenges to empower long-term sustainable behavior.

---

## 🚀 Key Features

- **Granular Calculator & Logs Engine**: Log daily footprints across transportation (car fuels, EV, train, short/long flight), electricity (mixed grid, solar, coal, wind), food habits (vegan, mixed, heavy meat), waste, and water usage.
- **Dynamic Recommendations**: Custom advice compiled based on the user's trailing 30-day activities, including dynamic calculations of projected carbon savings.
- **Sustainability Goals**: Set monthly, quarterly, or yearly emission budget targets and track limit utility percentages.
- **Interactive Analytics**: Interactive Recharts detailing emission trends over time, category ratios, and cumulative stacked bars.
- **Gamified Engagement**: Earn points, build streaks, level up (from Beginner to Earth Guardian), and unlock achievements/badges.
- **Educational Awareness Hub**: Categorized guidebooks explaining green transportation, circular economies, and diet swaps. Earn points (+15 XP) upon reading articles.
- **Administrative Console**: Site-wide statistics tracking, challenge builder campaigns manager, and educational publisher tools.
- **Professional PDF Exports**: Generate custom formatted, multi-page sustainability summaries and graphs in PDF using `pdfkit`.

---

## 🛠 Tech Stack

- **Frontend**: React.js (Vite), Tailwind CSS (custom class configurations), React Router v6, Recharts, Framer Motion, React Hook Form, Zod, Axios, Lucide React.
- **Backend**: Node.js, Express.js, JWT, bcryptjs, dotenv, helmet, cors, express-rate-limit, PDFKit.
- **Database**: PostgreSQL (Supabase compatible) + automatic **SQLite fallback** for local-first zero-config execution.

---

## 📂 Project Structure

```text
├── backend/                  # Node/Express API service layer
│   ├── config/               # Database pool and SQLite fallbacks
│   ├── controllers/          # Request controllers (auth, activities, dashboard, admin, etc.)
│   ├── middleware/           # Auth protectors, rate limiters, Zod validators
│   ├── routes/               # Modular API endpoint routers
│   ├── services/             # Carbon calculator, gamification, recommendation, PDF services
│   ├── package.json          # Node dependencies
│   └── server.js             # Express application entrypoint
├── frontend/                 # React client-side application
│   ├── src/
│   │   ├── components/       # Reusable components (Sidebar, Protected routes)
│   │   ├── context/          # Auth state provider
│   │   ├── pages/            # View pages (Dashboard, Goals, Challenges, Education, etc.)
│   │   ├── services/         # Axios API interceptor configurations
│   │   ├── App.jsx           # Main client router
│   │   ├── index.css         # Global design styles (glassmorphic cards, typography)
│   │   └── main.jsx          # React app DOM loader
│   ├── index.html            # Core HTML structure
│   └── package.json          # Frontend Vite dependencies
├── database/                 # Schema blueprints and seeds
│   ├── schema.sql            # Postgres tables, triggers and RLS policies
│   └── seeds.sql             # Default factors, badges and articles data
├── package.json              # Monorepo scripts root
└── README.md                 # Main platform documentation
```

---

## ⚙️ Local Installation & Setup

Follow these steps to set up and run the Carbonlytix application locally.

### 1. Prerequisites
Ensure you have **Node.js** (v18+) and **npm** installed on your system.

### 2. Clone and Install Dependencies
Navigate to your project folder and run the root installation helper:
```bash
npm run install:all
```
This automatically installs node modules across the root, `backend`, and `frontend` subdirectories.

### 3. Database Configurations
The application supports **dual-database modes** to simplify development:

- **Local Zero-Config (SQLite)**: By default, if the `DATABASE_URL` environment variable is not defined in the backend `.env` file, the backend will automatically create a local `carbonlytix.db` SQLite file on startup, generate the table schemas, and populate all default seed data (emission factors, badges, challenges, articles). **No setup required!**
- **Production (PostgreSQL / Supabase)**:
  1. Open the [Supabase SQL Editor](https://supabase.com).
  2. Copy the contents of `database/schema.sql` and run the script to initialize tables, indexes, triggers, and Row Level Security (RLS) policies.
  3. Copy and run `database/seeds.sql` to populate default coefficients.
  4. Create a `.env` file inside the `backend` folder and add your connection string:
     ```env
     DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres
     ```

### 4. Running the Development Servers
From the root directory, start both the Express API server and Vite client concurrently:
```bash
npm run dev
```
- Frontend will open on `http://localhost:3000`
- Backend API will start on `http://localhost:5000`

---

## 🔒 Security and Best Practices Enforced

- **Password Hashing**: Passwords stored securely using `bcryptjs` with 10 salt rounds.
- **JWT Authorization**: Enforced protected routes on the backend and frontend client routes using HTTP Bearer Tokens.
- **Headers Protection**: `helmet` headers configure XSS protections and browser policy securities.
- **API Rate Limiting**: General endpoints limited to 100 requests per 15 mins; authentication endpoints limited to 10 attempts to prevent brute-forcing.
- **Input Sanitization**: Payload Zod schemas check and filter bad parameters before entering business layers.

---

## 🧪 Verification & Manual Testing Scenarios

1. **Authentication Flow**:
   - Register a new account, log out, attempt to access `/dashboard` (verify redirection to `/login`).
   - Log back in, check token preservation in localStorage.
2. **Logging Footprint**:
   - Navigate to **Log Activity**, select **Transport**, choose **Car (Petrol)**, input `100` km, and check the impact preview is exactly `18.0 kg CO2e`.
   - Click log. Verify that the logged record is appended to the history list, points are incremented (+10 XP base + streak), and the dashboard charts update in real-time.
3. **Target Budgets**:
   - Go to **Sustainability Goals**, activate a Monthly Overall Footprint goal with a limit of `50 kg`.
   - Log an activity exceeding `50 kg` (e.g. Flight for 1000km). Verify progress bar reaches `100%` and switches color indicating a budget breach.
4. **PDF Generation**:
   - Click **Download Report** on the Dashboard. Verify that a professional multi-page PDF document is generated, containing metadata, summaries, category breakdowns, and recommendations.
