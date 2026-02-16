---
sidebar_position: 1
title: Environment Variables
---

# Environment Variables

DeployMate is configured through environment variables. Copy `.env.example` to `.env` and adjust the values for your deployment.

## Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/deploymate` |
| `AUTH_SECRET` | Secret for signing JWTs (generate with `openssl rand -base64 32`) | `your-secret-here` |
| `NEXTAUTH_URL` | Public URL of the application | `https://deploymate.example.com` |

## Storage Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `STORAGE_PROVIDER` | Storage backend: `local`, `s3`, `gcs`, or `azure` | `local` |
| `LOCAL_STORAGE_PATH` | Path for local file storage | `./uploads` |
| `AWS_ACCESS_KEY_ID` | AWS access key (S3 only) | — |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key (S3 only) | — |
| `AWS_S3_BUCKET` | S3 bucket name (S3 only) | — |
| `AWS_REGION` | AWS region (S3 only) | `us-east-1` |

## Email Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | — |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | — |
| `SMTP_PASS` | SMTP password | — |
| `EMAIL_FROM` | Sender email address | `noreply@deploymate.dev` |

## Background Jobs

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection URL for BullMQ | `redis://localhost:6379` |
