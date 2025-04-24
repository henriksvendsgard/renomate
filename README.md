# 🛠️ Oppuss – Room-by-Room Renovation Planner (PWA)

**Oppuss** is a minimalist and collaborative renovation planning app designed for couples or homeowners. Built as a Progressive Web App (PWA), it works offline and syncs your renovation tasks, budgets, and progress room by room.

![Oppuss Logo](static/favicon.png)

## Features

- 🏡 **Room Overview**: View each room with budget, tasks, and deadlines.
- ✅ **Tasks**: Add, check off, and comment on subtasks per room.
- 💸 **Budgets**: Track spending per room and per task.
- 📸 **Photos**: Upload before/after images for each room.
- ⏰ **Timeline**: Set and follow deadlines for each task or room.
- 📦 **Offline Support**: Full offline mode using IndexedDB.
- 🔄 **Data Export/Import**: Backup and restore your renovation data.

## Getting Started

### Running Locally

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd oppuss
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to http://localhost:5173

### Building for Production

```bash
npm run build
```

The built application will be in the `build` directory.

### Installing as a PWA

1. Visit the deployed app in a supported browser (Chrome, Edge, Firefox)
2. Open the browser menu
3. Look for "Install Oppuss" or "Add to Home Screen"
4. Follow the prompts to install

## Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Storage**: IndexedDB via [Dexie.js](https://dexie.org/)
- **PWA**: [@vite-pwa/sveltekit](https://vite-pwa-org.netlify.app/frameworks/sveltekit.html)

## Project Structure

```
oppuss/
├── src/                      # Source code
│   ├── lib/                  # Library code
│   │   ├── components/       # Svelte components
│   │   │   ├── room/         # Room-related components
│   │   │   ├── task/         # Task-related components
│   │   │   └── photo/        # Photo-related components
│   │   ├── services/         # Service modules
│   │   │   ├── db.ts         # Database service (IndexedDB)
│   │   │   ├── photos.ts     # Photo handling service
│   │   │   └── data.ts       # Data import/export service
│   │   ├── stores/           # Svelte stores
│   │   │   └── rooms.ts      # Rooms store
│   │   └── types.ts          # TypeScript types
│   ├── routes/               # SvelteKit routes
│   │   ├── +layout.svelte    # App layout
│   │   ├── +page.svelte      # Home page (Dashboard)
│   │   ├── room/[roomId]/    # Room detail page
│   │   └── settings/         # Settings page
│   └── app.css               # Global CSS
├── static/                   # Static assets
├── vite.config.ts            # Vite configuration
└── tailwind.config.js        # Tailwind CSS configuration
```

## Color Palette

| Purpose        | Name     | Hex       |
| -------------- | -------- | --------- |
| Primary        | Sand     | `#D8CAB8` |
| Accent         | Clay     | `#9E7C5D` |
| Text           | Charcoal | `#2E2E2E` |
| Contrast       | Snow     | `#FDFCF9` |
| Active/Success | Pine     | `#4B635E` |

## Development Notes

- Use optimistic UI updates for task completion
- Ensure accessibility (aria labels, keyboard nav)
- Add subtle animations for better user experience
- Test offline functionality regularly

## Future Enhancements

- Supabase Auth + Database for cloud sync
- QR code-based room sharing
- Push notifications for reminders
- Before/after photo comparison

## Supabase Setup

The app uses Supabase for authentication and database. Follow these steps to set up Supabase:

1. **Create a Supabase Project**:
   - Sign up at [Supabase](https://supabase.com/) and create a new project
   - Go to Project Settings > API to get your API credentials
   - Copy the URL and anon key to your `.env` file (see `.env.example`)

2. **Run Database Migrations**:
   - The SQL migration files are in the `supabase/migrations` directory
   - You can run them manually in the Supabase SQL Editor, or
   - Use the [Supabase CLI](https://supabase.com/docs/reference/cli) to apply migrations:
     ```bash
     supabase link --project-ref your-project-id
     supabase db push
     ```

3. **Configure Authentication**:
   - Go to Authentication > Settings in your Supabase dashboard
   - Set the Site URL to your app's URL (e.g. `http://localhost:5173` for local development)
   - Enable Email/Password provider if not already enabled

4. **Set Up Row Level Security (RLS)**:
   - The migrations include RLS policies for all tables
   - These policies ensure users can only access their own data
   - You can verify them in Database > Tables > (select table) > Policies

5. **Restart Your App**:
   ```bash
   npm run dev
   ```

## Database Schema

The app uses the following database tables:

- **houses**: Stores information about houses
- **rooms**: Stores information about rooms in houses
- **shopping_items**: Stores shopping list items

See the migration files in `supabase/migrations` for the complete schema.

---

Made with ❤️ by two people renovating their first home together.
