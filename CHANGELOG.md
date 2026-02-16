# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-02-15

### Added

- Authentication with NextAuth.js v5 using a credentials provider and JWT sessions; passwords hashed with Argon2
- Dashboard with app grid and list view, filtering by platform and release type, and full-text search
- App management — create, update, and delete apps with metadata (name, bundle ID, platform, description)
- Release management — create and delete releases with file upload for `.ipa` and `.apk` artifacts
- iOS OTA installation via the `itms-services://` protocol with dynamically generated `.plist` manifests
- Android direct APK download with appropriate `Content-Disposition` headers
- Distribution groups at both the app level and the organization level for scoping release access
- Organization management — create and manage organizations with invite-only membership
- Member invitation system — invite users by email with tokenized invitation links
- Role-based access control with five roles: Super Admin, Admin, Manager, Member, and Viewer
- Settings page with four tabs: Profile, Notifications, Organizations, and API Tokens
- API token management — create scoped bearer tokens for CI/CD integration, with last-used tracking
- Storage adapters for Local filesystem, AWS S3, Google Cloud Storage, and Azure Blob Storage
- RESTful API under `/api/v1/` with Bearer token authentication and consistent `{ data, meta }` / `{ error }` response shapes
- Docker deployment configuration with a `docker-compose.yml` covering the app, PostgreSQL, and Redis
- Background job processing with BullMQ and Redis for notifications and async artifact handling
- Audit logging and structured application logging with Pino

[Unreleased]: https://github.com/deploymate/deploymate/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/deploymate/deploymate/releases/tag/v0.1.0
