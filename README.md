# Habits — Minimal habit-tracking PWA

A minimal, mobile-first habit and task tracking PWA built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma, and Supabase Postgres. Single-user, no authentication. Installable on iPhone via Safari “Add to Home Screen”.

## Tech stack

- **Next.js 14+** (App Router)
- **TypeScript** (strict, no JS files)
- **Tailwind CSS** (no other CSS frameworks)
- **Supabase Postgres** (hosted DB)
- **Prisma ORM**
- **Server-only DB** (no Supabase client in the browser)
- **PWA**: manifest, `display: standalone`, theme color, apple-touch-icon

## Run instructions

### 1. Install dependencies

```bash
yarn install
```

### 2. Supabase and environment

1. Create a [Supabase](https://supabase.com) project.
2. In **Project Settings → Database** get:
   - **Connection string → URI** (use the **pooled** connection for `DATABASE_URL`)
   - **Connection string → Direct connection** (use for `DIRECT_URL`, recommended for migrations)
3. Create `.env` in the project root:

```env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

Optional: set `APP_PASSWORD` to protect the app with a simple lock screen (session cookie on success):

```env
APP_PASSWORD=your-secret-password
```

### 3. Prisma

Generate the client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

For production:

```bash
npx prisma migrate deploy
```

### 4. Dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Note:** For `yarn build` you need `DATABASE_URL` (and `DIRECT_URL`) set. Use your real Supabase URLs, or a dummy Postgres URL if you only need to build without running the app.

### 5. PWA / Add to Home Screen (iPhone)

- Serve over HTTPS (or use `next dev` and add to home screen from your dev URL if accessible from the phone).
- In Safari: Share → **Add to Home Screen**. The app opens in standalone mode.
- Replace placeholder icons in `public/icons/` and `public/apple-touch-icon.png` with your own (e.g. 192×192, 512×512, 180×180 for Apple).

## Project structure (file tree)

```
├── app/
│   ├── (main)/
│   │   ├── layout.tsx       # Auth gate + bottom nav
│   │   ├── page.tsx         # Week view (/)
│   │   ├── tasks/
│   │   │   └── page.tsx     # Tasks view (/tasks)
│   │   └── habits/
│   │       └── page.tsx     # Habits manage (/habits)
│   ├── actions/
│   │   ├── auth.ts          # Password gate
│   │   ├── habits.ts        # create/update/archive habit
│   │   ├── habit-logs.ts    # log/unlog completion
│   │   ├── week-data.ts     # getWeekData
│   │   └── tasks.ts         # create/toggle/delete/list tasks
│   ├── globals.css
│   ├── layout.tsx           # Root layout, PWA meta
│   └── manifest.ts         # PWA manifest (standalone, icons)
├── components/
│   ├── BottomNav.tsx
│   ├── DayModal.tsx        # Week cell modal (+ / undo)
│   ├── HabitsManageView.tsx
│   ├── LockScreen.tsx      # APP_PASSWORD gate
│   ├── TasksView.tsx
│   └── WeekView.tsx
├── lib/
│   ├── db.ts               # Prisma singleton
│   ├── date-utils.ts       # todayISO, formatShortDay, etc.
│   ├── timezone.ts         # Local day boundaries (America/New_York)
│   └── validations.ts      # Zod schemas
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       └── 20250218000000_init/
│           └── migration.sql
├── public/
│   ├── icons/
│   │   ├── icon-192.png    # Placeholder
│   │   └── icon-512.png    # Placeholder
│   └── apple-touch-icon.png # Placeholder
├── .env.example
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## Data model

- **Habit**: `id`, `name`, `targetPerDay` (≥ 1), `archived` (default false), `createdAt`
- **HabitLog**: `id`, `habitId` (FK → Habit, on delete cascade), `occurredAt` (timestamptz)
- **Task**: `id`, `title`, `dueDate` (date), `completed` (default false), `createdAt`

Habits are event-based: each completion is a `HabitLog` row. “Day” is defined by local date in `America/New_York` (see `lib/timezone.ts`). Week starts Monday.

## Scripts

| Command            | Description                    |
|--------------------|--------------------------------|
| `yarn dev`         | Start dev server               |
| `yarn build`       | Production build               |
| `yarn start`       | Start production server        |
| `yarn db:generate` | Prisma generate                |
| `yarn db:migrate`  | Prisma migrate dev             |
| `yarn db:deploy`   | Prisma migrate deploy (prod)   |
