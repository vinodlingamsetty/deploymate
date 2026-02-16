---
sidebar_position: 1
title: Introduction
---

# Introduction

DeployMate is an open-source, self-hosted platform for distributing beta iOS (.ipa) and Android (.apk) apps to testers. It provides over-the-air (OTA) installation, distribution groups, role-based access control, and a RESTful API.

## Key Features

- **iOS & Android OTA Distribution** — Upload .ipa and .apk files and distribute them to testers via over-the-air installation links.
- **Distribution Groups** — Organize testers into groups at the app or organization level for targeted releases.
- **Role-Based Access Control** — Five roles (Super Admin, Admin, Manager, Member, Viewer) control what each user can do.
- **RESTful API** — Automate releases and manage resources programmatically with API tokens.
- **Storage Adapters** — Store builds on local disk, AWS S3, Google Cloud Storage, or Azure Blob Storage.
- **Self-Hosted** — Deploy on your own infrastructure with Docker Compose. No vendor lock-in.

## Architecture

DeployMate is built with Next.js 14 (App Router), TypeScript, Prisma ORM with PostgreSQL, and NextAuth.js v5 for authentication. Background jobs (binary parsing, notifications) are processed with BullMQ and Redis.
