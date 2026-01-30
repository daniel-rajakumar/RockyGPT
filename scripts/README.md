# Scripts Directory

This directory contains all scripts for managing the RockyGPT data pipeline.

## 📁 Directory Structure

```
scripts/
├── fetch/              # Data fetching scripts (used in production)
│   ├── birch-menu.ts          # Fetch daily menu from Sodexo API
│   └── dining-hours.ts        # Fetch dining hours
│
├── database/           # Database management scripts
│   ├── ingest-data.ts         # Ingest cleaned data into Supabase
│   ├── setup-db.ts            # Initialize database schema
│   └── verify-ingestion.ts   # Verify data was ingested correctly
│
└── archive/            # Old/deprecated scripts (kept for reference)
    ├── clean-hours.ts         # Legacy hours cleaner
    ├── clean-menu.ts          # Legacy menu cleaner
    ├── debug-latest-menu.ts   # Debugging tool
    ├── find-json-path.ts      # JSON structure explorer
    └── inspect-soup.ts        # Menu debugging tool
```

## 🚀 Production Scripts

### `fetch/birch-menu.ts`
**Purpose**: Fetches the daily menu from Sodexo API and saves to `clean_data/dining/menu.md`

**Usage**:
```bash
npx tsx scripts/fetch/birch-menu.ts
```

**Automated**: Runs daily at midnight via GitHub Actions

**API Details**:
- Endpoint: `https://api-prd.sodexomyway.net/v0.2/data/menu/97508001/15858`
- Requires `API-Key` header
- Date parameter: `YYYY-MM-DD`

---

### `fetch/dining-hours.ts`
**Purpose**: Fetches dining location hours and information

**Usage**:
```bash
npx tsx scripts/fetch/dining-hours.ts
```

---

### `fetch/academic-calendar.ts`
**Purpose**: Fetches academic calendar events for current and future semesters using Playwright

**Usage**:
```bash
npx tsx scripts/fetch/academic-calendar.ts
```

**Output**: `clean_data/academic/calendar.md`

**Fetches**:
- Current semester (Spring 2026)
- Future semesters (Summer 2026 through Spring 2029)
- Important dates: registration, add/drop deadlines, breaks, finals, graduation

**Requirements**: Playwright (headless browser)

---

## 🗄️ Database Scripts

### `database/ingest-data.ts`
**Purpose**: Ingests cleaned markdown data into Supabase vector database

**Usage**:
```bash
npx tsx scripts/database/ingest-data.ts
```

**Prerequisites**: 
- Supabase credentials in `.env.local`
- Data files in `clean_data/`

---

### `database/setup-db.ts`
**Purpose**: Initialize database tables and schemas

**Usage**:
```bash
npx tsx scripts/database/setup-db.ts
```

---

### `database/verify-ingestion.ts`
**Purpose**: Verify data was correctly ingested into the database

**Usage**:
```bash
npx tsx scripts/database/verify-ingestion.ts
```

---

## 📦 Archive

Scripts in `archive/` are no longer actively used but kept for reference:

- **clean-hours.ts** / **clean-menu.ts**: Old data cleaning scripts (replaced by direct API fetch)
- **debug-latest-menu.ts**: Debugging tool for menu fetching issues
- **find-json-path.ts**: Utility to explore JSON structure
- **inspect-soup.ts**: Soup section debugging tool

---

## 🔄 GitHub Actions Integration

The production fetch scripts are run automatically via `.github/workflows/update-menu.yml`:

- **Schedule**: Daily at midnight EST (5 AM UTC)
- **Runs**: `birch-menu.ts` and `dining-hours.ts`
- **Commits**: Auto-commits updated data files

---

## 📝 Notes

- All TypeScript scripts use `tsx` for execution (no compilation needed)
- Scripts output to `clean_data/dining/`
- Menu data format: Markdown with YAML frontmatter
