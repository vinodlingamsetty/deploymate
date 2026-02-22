---
sidebar_position: 1
title: Introduction
---

# Introduction

DeployMate is an open-source, self-hosted platform for distributing beta iOS (.ipa) and Android (.apk) apps to testers. It provides over-the-air (OTA) installation, distribution groups, role-based access control, and a RESTful API.

## Key Features

- **iOS & Android OTA Distribution** — Upload .ipa and .apk files and distribute them to testers via OTA install links.
- **Distribution Groups** — Organize testers into groups at the app or organization level for targeted releases.
- **Role-Based Access Control** — Super Admin plus org/app roles: Admin, Manager, and Tester.
- **RESTful API** — Automate releases and manage resources programmatically with API tokens.
- **Storage Adapters** — Local disk, AWS S3, Google Cloud Storage, Azure Blob, and enterprise GCP dual-bucket mode.
- **Self-Hosted** — Deploy on your own infrastructure. Docker Compose and enterprise GCP guidance are both documented.

## Architecture

DeployMate is built with Next.js 14 (App Router), TypeScript, Prisma ORM with PostgreSQL, and NextAuth.js v5 for authentication. Background jobs (binary parsing, notifications) are processed with BullMQ and Redis.
