# DeployMate — Tech Stack

| Technology | Version | Role | Why Chosen |
|---|---|---|---|
| **Next.js 14** (App Router) | 14.x | Full-stack framework | Server Components, API routes, and file-based routing in one package — eliminates the need for a separate backend |
| **TypeScript** (strict) | 5.x | Type safety | Catches bugs at compile time; strict mode enforces exhaustive checks |
| **Tailwind CSS v3** | 3.x | Styling | Utility-first CSS with zero runtime; pairs well with component libraries |
| **shadcn/ui** | latest | UI component library | Copy-paste components built on Radix UI — fully customizable, no vendor lock-in |
| **PostgreSQL** | 15+ | Relational database | Robust, open-source RDBMS with strong JSON support and battle-tested reliability |
| **Prisma** | 7.x | ORM / database toolkit | Type-safe queries generated from schema; painless migrations |
| **NextAuth.js v5** | 5.0-beta | Authentication | First-party Next.js auth with session/JWT support; credentials + OTP providers |
| **Argon2** (@node-rs/argon2) | 2.x | Password hashing | Memory-hard algorithm recommended over bcrypt; native Rust binding for speed |
| **Nodemailer** | 8.x | Email transport | De-facto Node.js email library; works with any SMTP provider |
| **BullMQ + Redis** | 5.x / 7.x | Background jobs | Reliable job queue for binary parsing and notifications; Redis-backed persistence |
| **Caddy** | 2.x | Reverse proxy | Automatic HTTPS via Let's Encrypt; simple Caddyfile config |
| **pino** | 10.x | Structured logging | High-performance JSON logger; pino-pretty for dev readability |
| **Docusaurus** | 3.x | Documentation site | React-based static site generator optimized for docs |
| **pnpm** | 10.x | Package manager | Fast, disk-efficient installs with strict dependency resolution |
