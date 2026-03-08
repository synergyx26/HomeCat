# Home & Cats - Pet Care Management App

A modern web application for managing your cats' profiles, feeding schedules, and health records. Built with React, Supabase, and Tailwind CSS.

## Features

- **OAuth Authentication** - Sign in with Google, GitHub, or email/password
- **Cat Profiles** - Add, edit, and manage your cat profiles with breed, age, weight, and notes
- **Food Tracker** - Log feeding sessions with food type, amount, and timestamps
- **Health Log** - Track vet visits, vaccinations, medications, symptoms, and weight checks
- **Admin Panel** - App owner dashboard to view all users, cats, and activity data
- **Responsive Design** - Works on desktop and mobile devices
- **Row Level Security** - Each user's data is isolated and protected at the database level

## Tech Stack

- **Frontend**: React 18, React Router v6, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Build Tool**: Vite
- **Deployment**: Vercel

## Setup

### 1. Supabase Configuration

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL in `supabase-schema.sql` in the Supabase SQL Editor
3. Enable OAuth providers in **Authentication > Providers**:
   - **Google**: Add your Google OAuth client ID and secret
   - **GitHub**: Add your GitHub OAuth app client ID and secret
4. Set the **Site URL** in **Authentication > URL Configuration** to your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
5. Add your deployment URL to **Redirect URLs**: `https://your-app.vercel.app/auth/callback`
6. Make yourself an admin by running in SQL Editor:
   ```sql
   UPDATE profiles SET is_admin = true WHERE email = 'your-email@example.com';
   ```

### 2. Environment Variables

Create a `.env` file (or set in Vercel dashboard):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Run Locally

```bash
npm install
npm run dev
```

### 4. Deploy to Vercel

1. Push code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add the environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
4. Deploy - Vercel auto-detects the Vite framework
5. Update Supabase **Site URL** and **Redirect URLs** with your Vercel domain

## Admin Panel

The admin panel is available at `/admin` for users with `is_admin = true` in the `profiles` table. It provides:

- **Overview** - Total users, cats, feedings, and health log counts
- **User Management** - View all users and grant/revoke admin access
- **Data Views** - Browse all cats, feedings, and health logs across all users

## Authentication Flow

1. Users can sign in via Google, GitHub, or email/password
2. OAuth providers redirect back to `/auth/callback` after authentication
3. New users automatically get a profile created via database trigger
4. Email/password signup sends a confirmation email with a link back to the app (not localhost)

## Project Structure

```
src/
├── main.jsx                  # App entry point
├── App.jsx                   # Router and auth provider
├── index.css                 # Tailwind directives
├── lib/supabase.js           # Supabase client config
├── contexts/AuthContext.jsx  # Auth state management
├── components/
│   ├── Layout.jsx            # Header, nav, and page wrapper
│   └── ProtectedRoute.jsx    # Auth guard component
└── pages/
    ├── Login.jsx             # Login with OAuth + email
    ├── Signup.jsx            # Signup with OAuth + email
    ├── AuthCallback.jsx      # OAuth redirect handler
    ├── Dashboard.jsx         # Overview dashboard
    ├── Cats.jsx              # Cat profile management
    ├── FoodTracker.jsx       # Feeding log
    ├── HealthLog.jsx         # Health event tracker
    └── Admin.jsx             # Admin panel
```
