# Quit Smoking Timer

A Next.js app to help users gradually reduce smoking frequency with phased intervals, urge logging, and progress tracking.

## Prerequisites

- Node.js 20+
- A MySQL database

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your database values:

```bash
cp .env.example .env.local
```

Required variables:

- `MYSQL_HOST`
- `MYSQL_PORT` (optional, defaults to `3306`)
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Quality Checks

```bash
npm run lint
npm run build
```

## Deployment Notes

- Configure the same MySQL environment variables in Vercel.
- PWA support is enabled in production (`next-pwa`) and disabled during local development.
