# Pathetic

The Pathetic website and embedded content studio. It is a Next.js application
with Sanity-managed pages, Supabase authentication/data, and integrations for
Gemini image generation, Stripe payments, Beehiiv newsletters, and SMTP contact
email.

## Quick start

Known-good local versions:

- Node.js 22
- pnpm 10

Install and run:

```sh
corepack enable
pnpm install --frozen-lockfile
cp .env.local.example .env.local
# Fill in the values in .env.local
pnpm dev
```

Open:

- Website: <http://localhost:3000>
- Sanity Studio: <http://localhost:3000/studio>

The homepage depends on a valid Sanity project and dataset. The other
integrations are only needed for their corresponding features.

Before committing changes, run:

```sh
pnpm typecheck
pnpm build
```

## Environment

`.env.local` is intentionally ignored by Git because it contains secrets. Start
from `.env.local.example` and retrieve the real values from the relevant service
dashboards or a secure password manager.

The variables are grouped by feature:

- Site: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`,
  `NEXT_PUBLIC_SITE_ENV`
- Sanity: `NEXT_PUBLIC_SANITY_API_VERSION`,
  `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`,
  `SANITY_API_READ_TOKEN`, `SANITY_API_WRITE_TOKEN`
- Gemini: `GEMINI_API_KEY`, `GEMINI_MODEL_ID`
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`
- Stripe: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
  `STRIPE_WEBHOOK_SECRET`
- Beehiiv: `BEEHIIV_API_KEY`, `BEEHIIV_PUBLICATION_ID`
- Contact email: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`,
  `EMAIL_PASS`, `CONTACT_TO_EMAIL`

Never commit `.env.local` or paste its values into this README.

## Project map

- `app/` — Next.js routes, layouts, pages, and API endpoints
- `components/` — UI, page blocks, effects, and Meme Booth components
- `sanity/` — Sanity schemas, queries, Studio structure, and clients
- `supabase/schema.sql` — database schema for the Meme Booth credit system
- `public/` — fonts, images, model files, and other static assets
- `lib/` — shared server/client utilities
- `sample-data.tar.gz` — the bundled starter Sanity export; do not assume it is
  a current production backup

## Common commands

```sh
pnpm dev        # Start the development server
pnpm build      # Create a production build
pnpm start      # Run the production build
pnpm typecheck  # Check TypeScript
pnpm typegen    # Regenerate Sanity schema/types
```

For local Stripe webhook testing:

```sh
stripe listen --forward-to localhost:3000/api/booth/webhook
```

Copy the webhook signing secret printed by the Stripe CLI into
`STRIPE_WEBHOOK_SECRET`.

## Archiving the project

The large local folders are reproducible and should not be archived:

- `node_modules/` — restored by `pnpm install`
- `.next/` — restored by `pnpm dev` or `pnpm build`
- `tsconfig.tsbuildinfo` — restored by TypeScript
- `.DS_Store` — macOS metadata

Keep these:

- all source files and `public/` assets
- `pnpm-lock.yaml`
- `.git/` (preserves branches and history)
- `.env.local` if the archive is stored securely

Before archiving, confirm the working tree and remote:

```sh
git status
git remote -v
```

Commit and push anything that should also exist on GitHub. The current remote is:

```text
https://github.com/Pathetic-Studio/pathetic.com.git
```

### Option A: copy a compact folder to the SSD

Run this from the directory containing `pathetic`, replacing `YOUR_SSD` with the
mounted drive name:

```sh
rsync -a \
  --exclude='node_modules/' \
  --exclude='.next/' \
  --exclude='tsconfig.tsbuildinfo' \
  --exclude='.DS_Store' \
  pathetic/ /Volumes/YOUR_SSD/pathetic/
```

This keeps hidden files such as `.git`, `.gitignore`, and `.env.local`.

### Option B: create one compressed archive

Also run this from the directory containing `pathetic`:

```sh
COPYFILE_DISABLE=1 tar \
  --exclude='pathetic/node_modules' \
  --exclude='pathetic/.next' \
  --exclude='pathetic/tsconfig.tsbuildinfo' \
  --exclude='.DS_Store' \
  -czf "/Volumes/YOUR_SSD/pathetic-$(date +%F).tar.gz" \
  pathetic
```

Test the archive before removing the original:

```sh
tar -tzf "/Volumes/YOUR_SSD/pathetic-YYYY-MM-DD.tar.gz" | head
```

Because the archive may contain `.env.local`, keep the SSD encrypted or store
the secrets separately. A Git-only archive is not enough to preserve
`.env.local`.

## Restoring from the SSD

For a compressed archive:

```sh
tar -xzf pathetic-YYYY-MM-DD.tar.gz
cd pathetic
corepack enable
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
pnpm dev
```

For a copied folder, start at `cd pathetic` and run the same commands.

Then verify:

1. `.env.local` exists and contains the current service credentials.
2. `git status` recognizes the repository and expected branch.
3. The homepage loads using the correct Sanity dataset.
4. `/studio` opens.
5. Any integrations still in use (contact, newsletter, generation, auth, and
   payments) work with their current external accounts.

If `.git/` was not preserved, clone the GitHub repository into a fresh folder
instead of running `git init`, then restore `.env.local`:

```sh
git clone https://github.com/Pathetic-Studio/pathetic.com.git pathetic-restored
cp /path/to/secure-backup/.env.local pathetic-restored/.env.local
cd pathetic-restored
pnpm install --frozen-lockfile
```

## Data that is not inside this folder

Copying this project does not back up remotely hosted data:

- Sanity documents and uploaded Sanity assets
- Supabase database rows and Auth users
- Stripe products, customers, payments, and webhook configuration
- Beehiiv subscribers
- Gemini, hosting, DNS, and other service account settings

Export any Sanity dataset and Supabase database that must survive independently
of those services, and keep those exports with the secure archive. Record where
the domain, hosting project, and credentials are managed.

Keep at least two verified copies before deleting the working copy—for example,
the SSD archive plus the GitHub repository and separate cloud-data exports.


http://localhost:3000/api/draft-mode/local?path=/