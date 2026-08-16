<p align="center">
  <img src="./.github/readme-assets/signal.gif" alt="Animated signal / product visual for royal-state" width="100%" />
</p>

<h1 align="center">royal-state</h1>

<p align="center"><strong>A single-repo React + Vite frontend for a room-rental app (branded RentEasy / Royal Stay) that uses Firebase (Auth, Firestore, Storage) for backend services.</strong></p>

<p align="center"><code>REPO//SIGNAL</code> · <code>SIGNAL / PRODUCT</code> · <code>LOOPING README EXPERIENCE</code></p>

## Live signal

| Lens | Readout |
| --- | --- |
| Portfolio lane | **SIGNAL / PRODUCT** |
| Code surface | **46** tracked files observed |
| Primary materials | **CSS, React JSX, JavaScript, JSON** |
| Verification | **0** test-related files observed |

> A moving scan of the project surface. The animated frame above is a lightweight visual signature; the sections below remain the source of truth for implementation details.

## Motion map

`SIGNAL` → `SHAPE` → `RELEASE`

Use the animated banner as the first signal, then move into the implementation dossier. The recommended next step is to verify the documented setup command against the repository scripts before extending the project.

<details open>
<summary><strong>Open the full project dossier</strong></summary>

## Overview
A client-side single-page application built with React (Vite) that provides a room-listing and management UI. The repository contains the frontend app, Firebase configuration hooks, and deployment configuration for Netlify and Vercel.

## What it does
- Lets room owners (admins) post and manage room listings via an admin dashboard (admin pages are gated client-side).
- Lets room seekers (customers) browse and filter rooms and contact owners.
- Uses Firebase SDK for authentication, Firestore for room data, and Firebase Storage (or Cloudinary) for media.
- Includes UX features such as a video background, custom cursor, and a back-to-top button.

## Key capabilities
- Role-based authentication flow with a client-side admin mode (AuthContext + ProtectedRoute).
- Admin dashboard for creating and managing room posts.
- Explore/Browse page for rooms with client-side filtering; intended real-time updates via Firestore.
- Media handling support (Storage and optional Cloudinary configuration).
- SPA-friendly deployment config for Netlify (netlify.toml) and Vercel (vercel.json).
- UX components: VideoBackground, TargetCursor, BackToTop; animations via Framer Motion and GSAP; maps via react-leaflet.

## Technology
- React 18 + Vite
- Firebase (Auth, Firestore, Storage)
- Cloudinary (optional, env-driven)
- Framer Motion, GSAP
- Leaflet / react-leaflet
- JavaScript (ESM), CSS
- Netlify / Vercel deployment targets

## Repository structure
Key files and folders (as present in repo):
- public/
  - bg.mp4 (background video expected in public/)
- src/
  - config/firebaseConfig.js
  - context/AuthContext.jsx
  - components/ProtectedRoute.jsx
  - components/VideoBackground.jsx
  - components/TargetCursor.jsx
  - components/BackToTop/BackToTop.jsx
  - pages/ (Home, Auth, AdminDashboard, ExploreRooms)
  - App.jsx, main.jsx
- package.json (dev/build/lint/preview scripts)
- netlify.toml, vercel.json
- eslint.config.js, vite.config.js
- README.md (this file)

A fuller tree is shown in the repository README excerpt if you need more detail.

## Getting started
The repository includes npm scripts for local development and build:
- npm run dev — start Vite development server (script present in package.json)
- npm run build — build for production
- npm run preview — preview the build
- npm run lint — run ESLint

The existing README contains step-by-step Firebase setup guidance (create project, enable Email/Password auth, enable Firestore and Storage) and an example firebaseConfig object. To run locally (evidence in README and package.json):
1. Install dependencies: npm install
2. Start dev server: npm run dev

If you follow those steps, inspect src/ to confirm configuration and implementation details.

## Configuration
- Firebase and Cloudinary configuration are read from environment variables via import.meta.env in the code (see src/config/firebaseConfig.js). The repo does not contain a .env.example; that file is absent.
- The background video is expected at public/bg.mp4 (the README instructs adding it there).
- Deployment configuration files are present at netlify.toml and vercel.json to support SPA routing.

To inspect runtime configuration and required env keys, review:
- src/config/firebaseConfig.js
- any cloudinary-related config referenced from src/config/firebaseConfig.js or other src/config files
- netlify.toml and vercel.json for deploy-time settings

## Development and quality notes
- package.json lists dependencies and devDependencies (firebase, framer-motion, gsap, leaflet, react, react-dom, react-router-dom, vite, eslint, etc.).
- ESLint is configured (eslint.config.js) and a lint script is provided, but:
  - There are no automated tests (no test files or test framework present).
  - No CI workflow files for GitHub Actions are present; only Netlify/Vercel configs exist.
  - No pre-commit hooks or test runners are included in the repository evidence.
- The app is componentized and uses AuthContext for auth state and ProtectedRoute for client-side route protection (see src/context/AuthContext.jsx and src/components/ProtectedRoute.jsx).

## Safety and responsible use
Applicable security findings (present in repository code and README):
- The repository contains a client-side “admin” flow implemented in src/context/AuthContext.jsx that can be bypassed via localStorage and hardcoded client checks. This allows elevation to admin in the client and is insufficient for production admin privileges.
- ProtectedRoute enforces access based on client-side state (userRole), which can be spoofed if admin checks remain client-only.
- Firestore and Storage security rules are provided as examples in the README but are not enforced by the client; production rules are not committed to the repo.
- Environment secrets (Firebase and Cloudinary keys) are expected via import.meta.env; there is no .env.example or documentation in-repo describing required VITE_* variables.
- No evidence of server-side validation or file-type/size checks for uploads; uploads may be sent directly to Storage/Cloudinary.
- No automated tests, CI, or server-side protections (e.g., Firebase custom claims, App Check, Cloud Functions) are present in the repository.

Recommended immediate mitigations (referenced from the project audit and present in repo suggestions):
- Remove client-side hardcoded admin credentials and localStorage-based admin flags from src/context/AuthContext.jsx.
- Use Firebase Authentication with server-side verification (custom claims) for admin privileges and validate tokens server-side where any admin-only mutation occurs.
- Add a .env.example listing required VITE_* variables referenced in src/config/firebaseConfig.js.
- Commit and enforce Firestore and Storage rules in the repo (suggested path: firebase/rules/).
- Add basic input validation and file checks for uploads client-side and enforce server-side checks where possible.

## Contributing
- The repo contains no explicit CONTRIBUTING.md; contributions are expected via standard GitHub flow (issues and pull requests).
- Useful files to inspect before contributing:
  - src/context/AuthContext.jsx (auth logic and admin flow)
  - src/components/ProtectedRoute.jsx (route protection)
  - src/config/firebaseConfig.js (env usage and Firebase initialization)
  - package.json and eslint.config.js (scripts and linting)
  - netlify.toml, vercel.json (deployment routing)
- If you plan to change authentication or security-critical code, prefer implementing server-side verification (Firebase custom claims / Cloud Functions) rather than client-only checks.

## License
The repository README includes an MIT License notice. (The repository does not contain a separate LICENSE file in the supplied evidence.)

</details>

---

<p align="center"><sub>README motion system · visual layer by RepoSignal · implementation details remain project-specific</sub></p>
