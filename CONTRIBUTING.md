# Contributing to DeployMate

Thank you for your interest in contributing. This guide covers everything you need to get your development environment running, the workflow for submitting changes, and the standards we expect in all contributions.

---

## Getting Started

### 1. Fork and Clone

Fork the repository on GitHub, then clone your fork locally:

```bash
git clone https://github.com/<your-username>/deploymate.git
cd deploymate
```

### 2. Install Dependencies

DeployMate uses [pnpm](https://pnpm.io) as its package manager:

```bash
pnpm install
```

### 3. Configure Environment

Copy the example environment file and fill in the required values:

```bash
cp .env.example .env
```

At minimum you need a running PostgreSQL instance. Set `DATABASE_URL` in `.env` to a valid connection string. See `README.md` for the full list of environment variables.

### 4. Run Database Migrations

```bash
npx prisma migrate dev
```

### 5. Start the Development Server

```bash
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Development Workflow

1. **Create a feature branch** off of `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes.** Keep commits focused and atomic.

3. **Run checks before committing:**
   ```bash
   pnpm lint        # ESLint
   pnpm typecheck   # TypeScript compiler check (tsc --noEmit)
   pnpm build       # Verify production build succeeds
   ```

4. **Commit your changes** with a clear, descriptive message:
   ```bash
   git commit -m "feat: add release download count tracking"
   ```

5. **Push your branch** and open a pull request against `main`:
   ```bash
   git push origin feat/your-feature-name
   ```

---

## Code Style

Consistency matters more than personal preference. Please follow these rules:

### TypeScript

- **Strict mode is enforced** — the `tsconfig.json` has `"strict": true`. Do not disable it.
- **No `any` types.** Use `unknown` and narrow with type guards, or define a proper interface or type alias.
- Prefer `interface` for object shapes and `type` for unions and utility types.
- All public function parameters and return types should be explicitly typed.

### React and Next.js

- **Server Components by default.** Only add the `'use client'` directive when you genuinely need hooks or browser APIs.
- Keep components focused. If a component grows beyond ~200 lines it almost certainly needs to be split.
- Co-locate component-specific utilities with the component rather than adding to a shared utilities barrel.

### Styling

- **Tailwind CSS only** — do not write raw CSS or add CSS-in-JS libraries.
- **Mobile-first:** unprefixed utilities apply at all breakpoints; use `md:` and `lg:` to layer up.
- Do not use magic numbers for colors — use the design tokens defined in `tailwind.config.ts`.

### API Routes

- All routes live under `/api/v1/` and return JSON.
- Success responses use the shape `{ data: ..., meta: ... }`.
- Error responses use the shape `{ error: { code: string, message: string } }`.
- Validate all request input with Zod before touching the database.
- Use parameterized queries through Prisma — never concatenate user input into queries.

### General

- No hardcoded secrets, credentials, or environment-specific values — use environment variables.
- Handle all promise rejections; never leave `.catch()` off or `await` without a try/catch.
- Clean up resources (event listeners, timers, open connections) in teardown paths.
- Write self-documenting code. Add a comment only when the *why* is not obvious from the *what*.

---

## Pull Request Process

1. **Fill out the PR template** completely. The description should explain what changed and why.
2. **Ensure CI passes.** All checks (lint, typecheck, build) must be green before requesting review.
3. **Request a review** from a maintainer. Address all feedback before the PR is merged.
4. PRs are merged with a squash commit to keep the `main` history clean.

### PR Checklist

Before marking your PR ready for review, confirm:

- [ ] TypeScript compiles without errors (`pnpm typecheck`)
- [ ] ESLint passes with no warnings (`pnpm lint`)
- [ ] Production build succeeds (`pnpm build`)
- [ ] UI changes are tested at mobile, tablet, and desktop widths
- [ ] Interactive elements are keyboard-accessible and have appropriate ARIA labels
- [ ] New API routes return correct `{ data }` / `{ error }` shapes
- [ ] No `any` types introduced
- [ ] No hardcoded secrets or credentials

---

## Reporting Bugs

Please use the **Bug Report** issue template on GitHub. A useful bug report includes:

- A clear, descriptive title
- Steps to reproduce the issue exactly
- What you expected to happen
- What actually happened (including any error messages or screenshots)
- Your environment: OS, Node.js version, browser (if UI-related), and DeployMate version/commit

---

## Requesting Features

Please use the **Feature Request** issue template on GitHub. A useful feature request includes:

- A clear description of the problem you are trying to solve
- Your proposed solution or the behavior you would like to see
- Any alternatives you have considered
- Context on the use case — who benefits and how often

Feature requests with a clear use case and a concrete proposal are much more likely to be picked up.

---

## Questions

If you have a question that is not a bug or feature request, please open a GitHub Discussion rather than an issue.
