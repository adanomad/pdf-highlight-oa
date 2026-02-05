# Setup Guide

## Prerequisites

- **Node.js** >= 22
- **pnpm** package manager

## Installation

```bash
git clone <repository-url>
cd pdf-highlight-oa
pnpm install
```

## Environment Variables

Create a `.env` file in the project root:

```env
# Storage backend: "sqlite" (default) or "supabase"
STORAGE_METHOD=sqlite

# Required only if STORAGE_METHOD=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Optional: Google OAuth (currently disabled in code)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Storage Method

- **`sqlite`** (default) — Uses a local SQLite database file at `process.cwd()/highlights.db`. No additional setup required. The database and table are created automatically on first use.
- **`supabase`** — Uses a Supabase cloud database. Requires a `highlights` table in your Supabase project with columns matching the `StoredHighlight` interface (see [Utilities > types.ts](./utilities.md#typests)).

## Running the Application

### Development

```bash
pnpm run dev
```

The dev server starts at [http://localhost:3000](http://localhost:3000).

### Production

```bash
pnpm run build
pnpm start
```

### Linting

```bash
pnpm lint
```

Uses ESLint with the Next.js core-web-vitals configuration.

## Choosing a Storage Backend

### SQLite (recommended for local development)

- No configuration needed beyond `STORAGE_METHOD=sqlite` (or omitting the variable entirely)
- Database file is created automatically
- Supports word indexing via the `/api/index` route
- Data is stored locally on the server filesystem

### Supabase (recommended for production/cloud)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Create a `highlights` table with this schema:

   | Column | Type | Constraints |
   |--------|------|-------------|
   | `id` | text | Primary key |
   | `pdfId` | text | Not null |
   | `pageNumber` | integer | Not null |
   | `x1` | real | Not null |
   | `y1` | real | Not null |
   | `x2` | real | Not null |
   | `y2` | real | Not null |
   | `width` | real | |
   | `height` | real | |
   | `text` | text | |
   | `image` | text | |
   | `keyword` | text | |

3. Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in your `.env` file
4. Set `STORAGE_METHOD=supabase`
