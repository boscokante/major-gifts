# HiiiWAV Budgeting Platform

End-to-end budgeting, grant allocation, and scenario planning system for HiiiWAV. The app is built on Next.js 14 with a Supabase/Postgres backend, AG Grid for data management, and Recharts for analytics.

## Prerequisites

- Node.js 18+
- Supabase project (cloud or self-hosted)
- `supabase` CLI (optional but recommended for applying migrations)

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Copy the example file and populate with your Supabase project keys (service role key is used server-side for server actions & migrations).

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Description |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Service role key for privileged server actions |

3. **Apply database migrations & seed data**

   ```bash
   npx supabase db reset --local \
     --db-url "$SUPABASE_DB_URL" \
     --seed supabase/seed/seed.sql
   ```

   Alternatively, run the SQL files manually inside the Supabase dashboard (`supabase/migrations/0001_init.sql` then `supabase/seed/seed.sql`).

4. **Start the dev server**

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000) to use the app. Default navigation links cover dashboard, budgets, grants, allocations, actuals, scenarios, and the shareable donor dashboard.

## Testing & QA

- Unit tests (Vitest):

  ```bash
  npm run test
  ```

- Playwright smoke test (requires dev server running on port 3000):

  ```bash
  npm run test:e2e
  ```

## Project Structure

```
app/
  dashboard/
  budgets/
  grants/
  allocations/
  actuals/
  scenarios/
  share/[slug]/
components/
lib/
supabase/
  migrations/
  seed/
tests/
  unit/
  e2e/
```

## Key Features

- **Realtime budgeting**: Budgets, grants, allocations, and actuals managed via AG Grid with inline validation.
- **Scenario modeling**: Clone live data, adjust allocations/budgets, and apply back to production.
- **Analytics**: Coverage, gap, and probability-weighted projections with live updates.
- **Access control**: Supabase RLS policies grant staff full CRUD access and donors read-only dashboards.
- **Import-friendly SQL**: Comprehensive schema & seed scripts bootstrap programs, grants, allocations, scenarios, and metrics.

## Deployment

1. Deploy the Next.js app to Vercel (or your platform of choice). Set the environment variables listed above.
2. Host the Postgres database on Supabase and run the migrations/seed there.
3. Configure Supabase Auth policies and JWT custom claims so staff accounts include `role=staff` and donors `role=donor`.
4. Enable Supabase Realtime on the `budgets`, `grants`, `grant_year_amounts`, `allocation_rules`, and `actuals` tables to power live updates.

## Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **AG Grid**: https://www.ag-grid.com/react-data-grid/
- **shadcn/ui**: https://ui.shadcn.com

