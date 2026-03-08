# YT-Learn-MINSU

A Next.js learning platform that turns YouTube playlists into a guided course experience for students and professors.

## Overview

YT-Learn-MINSU helps learners follow playlists with structure, progress tracking, quizzes, notes, and certificates. It also includes role-based access for students and professors, plus team features for classroom use.

## Core Features

- Role-based auth with `next-auth` (credentials login, optional Google login)
- Playlist import from YouTube and structured watch flow
- Progress tracking, streak, resume position, and activity log
- Notes and bookmarks per learning content
- Teams with join code (professor creates teams, students join)
- Playlist quiz flow and quiz analytics
- Certificate generation and download (`/certificate`)
- Search, public profile, account settings, and admin dashboard pages
- Service worker + offline fallback page

## Tech Stack

- Next.js 15 (App Router)
- React 18 + TypeScript
- Tailwind CSS + Radix UI
- NextAuth.js
- Local JSON/file storage (`data/*.json`) and browser `localStorage`

## Project Structure

- `app/` routes and API endpoints
- `components/` UI and feature components
- `lib/` core logic (auth, storage, youtube, teams, quizzes)
- `data/` local JSON data storage
- `public/` static assets and service worker
- `scripts/` project scripts (including quiz prebuild)

## Local Setup

1. Clone the repo.
2. Go to the project folder:
   ```bash
   cd Yt-Learn
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy environment template and edit values:
   ```bash
   copy .env.example .env.local
   ```
5. Run development server:
   ```bash
   npm run dev
   ```
6. Open `http://localhost:3000`.

## Environment Variables

Required:

- `NEXTAUTH_URL` (example: `http://localhost:3000`)
- `NEXTAUTH_SECRET` (long random secret)
- `NEXT_PUBLIC_YOUTUBE_API_KEY`

Optional:

- `ENABLE_GOOGLE_AUTH=true` (enable Google provider)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## Scripts

- `npm run dev` start dev server
- `npm run build` create production build
- `npm run start` run production server
- `npm run lint` run lint checks
- `npm run quizzes:prebuild` generate `data/playlist-quizzes.json` from global playlists

## Notes

- User accounts are stored in `data/users.json`.
- Team data is stored in `data/teams.json`.
- Learning progress and notes are stored in browser `localStorage`.
- API routes are under `app/api/*`.

## License

MIT (`LICENSE`).

## Author

Built and customized for the YT-Learn-MINSU project by `TheKanjiTV`.
