# HomeCat

A cat management web application built with React + Vite and Supabase.

## Tech Stack

- **Frontend:** React 18 with React Router v6
- **Build:** Vite 5
- **Styling:** Tailwind CSS with custom `primary` and `cat` color tokens
- **Backend:** Supabase (Auth, Database, Storage)
- **Auth:** Email/password + Google/GitHub OAuth with PKCE flow
- **Deployment:** Vercel (SPA rewrite configured in `vercel.json`)

## Project Structure

```
src/
├── App.jsx                    # Routes and app shell
├── main.jsx                   # React entry point (StrictMode enabled)
├── index.css                  # Tailwind imports and global styles
├── lib/
│   └── supabase.js            # Supabase client initialization
├── contexts/
│   └── AuthContext.jsx        # Auth state, session management, profile creation
├── components/
│   ├── Layout.jsx             # Header, nav, mobile menu
│   └── ProtectedRoute.jsx     # Auth guard for protected pages
└── pages/
    ├── Login.jsx              # Email/password + OAuth login
    ├── Signup.jsx             # Registration with password validation
    ├── AuthCallback.jsx       # OAuth redirect handler (PKCE code exchange)
    ├── Dashboard.jsx          # Overview with stats, cats, recent activity
    ├── Cats.jsx               # Cat CRUD with image upload
    ├── FoodTracker.jsx        # Feeding log management
    ├── HealthLog.jsx          # Health record tracking
    ├── Profile.jsx            # User profile view/edit with stats
    └── Admin.jsx              # Admin panel (user management, all data)
```

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run preview` — Preview production build

## Database Schema

See `supabase-schema.sql` for the full schema. Key tables:

- **profiles** — User profiles (synced from auth.users via trigger)
- **cats** — Cat records with `date_of_birth` (not `age`), `image_url`, `color`, `gender`, `chip_id`, `indoor_outdoor`
- **feedings** — Feeding logs linked to cats
- **health_logs** — Health records with typed entries (vet_visit, vaccination, etc.)

Storage bucket: `cat-images` (public read, user-scoped write via RLS)

## Architecture Notes

### Auth Flow
- `AuthContext` manages session via `getSession()` + `onAuthStateChange()`
- Has an 8-second timeout safety net — if auth init hangs (network issues), the app still loads
- `ensureProfile()` creates a profile row on first OAuth sign-in if the database trigger missed it
- `AuthCallback` handles PKCE code exchange with 15-second timeout and error UI

### Loading State Pattern
All pages follow this pattern to prevent infinite loading spinners:
```jsx
const [loading, setLoading] = useState(true);

useEffect(() => {
  if (user?.id) {
    loadData();
  } else {
    setLoading(false);  // Fallback: don't hang if user unavailable
  }
}, [user?.id]);

async function loadData() {
  setLoading(true);
  try {
    // ... Supabase queries
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);  // Always resolves, even on network errors
  }
}
```

### Key Design Decisions
- `App.jsx` exempts `/auth/callback` from the auth loading gate to prevent OAuth deadlocks
- Cat age is calculated from `date_of_birth` at render time, not stored
- Image uploads go to `cat-images/{user_id}/{timestamp}.{ext}` in Supabase Storage
- PKCE flow is explicitly set (not relying on SDK defaults)

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
