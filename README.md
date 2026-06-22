# CareerCraft Resume Analyzer

CareerCraft is a web application designed to help users optimize their resumes for Applicant Tracking Systems (ATS). It provides actionable feedback, keyword analysis, and compatibility scoring.

## Features

- **ATS Compatibility Scoring:** Get a detailed score based on parsing ease and keyword relevance.
- **Actionable Feedback:** Receive specific suggestions for improvement, including weak wording identification and missing keywords.
- **Job Description Targeting:** Tailor your resume to specific job descriptions for higher interview chances.
- **Secure Authentication:** Built with a custom JSON Web Token (JWT) system.

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- npm
- PostgreSQL database
- Redis (optional, for rate limiting and caching)

### Development Setup

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in the required variables.
4. Run the development server:
   ```bash
   npm run dev
   ```

### Production Setup

1. Build the application:
   ```bash
   npm run build
   ```
2. Set the required environment variables in your production environment.
3. Start the server:
   ```bash
   npm start
   ```

## Environment Variables

| Variable | Description | Required |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REDIS_URL` | Redis connection string | No |
| `GEMINI_API_KEY` | Google Gemini API key | No |
| `ADMIN_EMAIL` | Email for auto-admin access | No |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `APP_URL` | Public URL of the application | Yes |
| `GEMINI_MODEL` | Gemini model override | No |
| `DEMO_MODE` | Enable mock payments | No |

## API Endpoints

### AI Generation
- `POST /api/ai/generate`: Generates analysis for a resume.
  - **Request Body**: `{ prompt: string, type: string, config?: any }`
  - **Response**: `{ text: string }`

### User Management
- `GET /api/user`: Retrieves current user profile.
- `PUT /api/user`: Updates user profile.

### Authentication
- `POST /api/auth/register`: Registers a new user.
- `POST /api/auth/login`: Authenticates a user and returns a JWT.

## Deployment Guide

This application is designed to be deployed on platforms supporting Node.js and PostgreSQL, such as Google Cloud Run.

1. Ensure all required environment variables are set in your deployment platform's secrets management.
2. The build process runs `npm run build` to generate static assets.
3. The server starts using `node server.ts`.

## Contribution Guidelines

1. Fork the repository.
2. Create a new branch for your feature or fix.
3. Commit your changes with clear messages.
4. Open a pull request.
5. Ensure all linting checks pass (`npm run lint`).
