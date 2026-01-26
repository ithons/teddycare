# TeddyCare Setup Guide

This guide provides detailed instructions for setting up TeddyCare for local development.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Clerk Configuration](#clerk-configuration)
- [Tune Studio Configuration](#tune-studio-configuration)
- [Terra API Configuration](#terra-api-configuration)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or later
  - Check version: `node --version`
  - Download: [nodejs.org](https://nodejs.org)

- **pnpm**: Version 8.6.3 or later
  - Check version: `pnpm --version`
  - Install: `npm install -g pnpm`

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ithons/TeddyCare.git
   cd TeddyCare
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

## Clerk Configuration

Clerk provides authentication and organization-based role management for TeddyCare.

### Step 1: Create a Clerk Account

1. Go to [clerk.com](https://clerk.com)
2. Sign up for a free account
3. Create a new application

### Step 2: Create Organizations

TeddyCare uses Clerk organizations to manage user roles. You need to create two organizations:

1. **Doctor Organization**:
   - Name: `Doctor` (or any name you prefer)
   - Slug: `doctor` (must be exactly "doctor")

2. **Patient Organization**:
   - Name: `Patient` (or any name you prefer)
   - Slug: `patient` (must be exactly "patient")

**Important**: The slugs must be exactly `doctor` and `patient` as the application routing depends on these values.

### Step 3: Get API Keys

1. In your Clerk dashboard, navigate to **API Keys**
2. Copy the following keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET`

### Step 4: Configure Organizations

1. Go to **Organizations** in your Clerk dashboard
2. Enable organization features if not already enabled
3. Create the two organizations with the slugs mentioned above

### Step 5: Add Test Users

For testing, add users to each organization:

1. Create a test doctor account and add it to the `doctor` organization
2. Create a test patient account and add it to the `patient` organization

## Tune Studio Configuration

Tune Studio provides access to the custom fine-tuned OpenAI model.

### Step 1: Create a Tune Studio Account

1. Go to [tune.studio](https://tune.studio)
2. Sign up for an account
3. Navigate to **Account Settings** > **API Keys**

### Step 2: Get API Key

1. Generate a new API key
2. Copy the key (you won't be able to see it again)
3. Store it securely

**Note**: The application uses the model `rohan/tune-gpt-4o`. Ensure you have access to this model or update the model name in `lib/chat/actions.tsx`.

## Terra API Configuration

Terra API enables integration with health tracking devices and wearables.

### Step 1: Create a Terra Account

1. Go to [tryterra.co](https://tryterra.co)
2. Sign up for a developer account
3. Complete the onboarding process

### Step 2: Create a Developer Application

1. Navigate to the **Dashboard**
2. Create a new application
3. Note down the following credentials:
   - Dev ID
   - API Key
   - Webhook Secret

### Step 3: Configure Webhook URL

For local development:
1. Use a service like [ngrok](https://ngrok.com) to expose your local server
2. Set the webhook URL to: `https://your-ngrok-url.ngrok.io/api/terra/webhook`

For production (when deployed):
1. Set the webhook URL to: `https://your-production-domain.com/api/terra/webhook`

### Step 4: Enable Data Types

In the Terra dashboard, enable the following data types:
- Body measurements
- Heart rate data
- Sleep data
- Activity data
- Any other data types you want to track

## Database Setup

TeddyCare uses Prisma with SQLite for local development.

### Step 1: Generate Prisma Client

```bash
npx prisma generate
```

### Step 2: Create Database

```bash
npx prisma db push
```

This creates a SQLite database at `prisma/dev.db` based on the schema in `prisma/schema.prisma`.

### Step 3: Verify Database

You can open Prisma Studio to view your database:

```bash
pnpm db:studio
```

This opens a web interface at `http://localhost:5555` where you can view and edit database records.

## Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Fill in all the required values:

```bash
# Tune Studio API
TUNE_STUDIO_API_KEY=your_tune_studio_api_key_here

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
CLERK_SECRET=sk_test_xxxxxxxxxxxxx

# Terra API
TERRA_DEV_ID=your_terra_dev_id_here
TERRA_API_KEY=your_terra_api_key_here
TERRA_WEBHOOK_SECRET=your_webhook_secret_here

# Database (default for local development)
DATABASE_URL="file:./dev.db"

# Optional: Only needed for production deployment
VERCEL_URL=your_vercel_url_here
```

### Environment Variable Descriptions

| Variable | Description | Required |
|----------|-------------|----------|
| `TUNE_STUDIO_API_KEY` | API key for accessing Tune Studio's OpenAI proxy | Yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (safe to expose publicly) | Yes |
| `CLERK_SECRET` | Clerk secret key (keep private) | Yes |
| `TERRA_DEV_ID` | Your Terra developer ID | Yes |
| `TERRA_API_KEY` | Terra API key for authentication | Yes |
| `TERRA_WEBHOOK_SECRET` | Secret for verifying Terra webhook signatures | Yes |
| `DATABASE_URL` | Database connection string | Yes |
| `VERCEL_URL` | Your Vercel deployment URL | No (only for production) |

## Running the Application

### First Time Setup

Run the complete setup script:

```bash
pnpm setup
```

This command will:
1. Install all dependencies
2. Generate Prisma client
3. Create and push database schema

### Start Development Server

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Testing the Application

1. **Sign In**: Navigate to `http://localhost:3000`
2. **Select Organization**: Choose either the doctor or patient organization
3. **Access Dashboard**: You'll be redirected to the appropriate dashboard
4. **Test Features**:
   - For patients: Try connecting a health device via Terra Widget
   - For doctors: View the patient list and appointment schedules
   - For both: Test the AI chat functionality

## Troubleshooting

### Common Issues

#### Issue: "Organization not found"

**Solution**: Make sure you've created both `doctor` and `patient` organizations in Clerk with exact slug names.

#### Issue: "Missing environment variable"

**Solution**: Double-check your `.env` file and ensure all required variables are set.

#### Issue: "Terra widget not opening"

**Solution**: 
- Check that `TERRA_DEV_ID` and `TERRA_API_KEY` are correct
- Ensure your Terra account is active
- Check browser console for errors

#### Issue: "Database connection error"

**Solution**: 
- Run `pnpm setup` to regenerate the database
- Check that the `prisma/dev.db` file has write permissions
- Try deleting `prisma/dev.db` and running `npx prisma db push` again

#### Issue: "AI chat not responding"

**Solution**: 
- Verify `TUNE_STUDIO_API_KEY` is correct
- Check that you have access to the `rohan/tune-gpt-4o` model
- Look at the server logs for error messages

#### Issue: "pnpm command not found"

**Solution**: Install pnpm globally:
```bash
npm install -g pnpm
```

### Getting Help

If you encounter issues not covered here:

1. Check the [main README](README.md)
2. Review the [API documentation](API.md)
3. Open an issue on GitHub with:
   - Description of the problem
   - Steps to reproduce
   - Error messages (if any)
   - Your environment (OS, Node version, etc.)

## Next Steps

After successful setup:

1. Review the [API Documentation](API.md) to understand the endpoints
2. Read the [Architecture Guide](ARCHITECTURE.md) to understand the system design
3. Explore the codebase and start building!

## Production Deployment

For production deployment instructions, see the [Deployment section in the main README](README.md#deployment).
