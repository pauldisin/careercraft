# System Architecture: CareerCraft Resume Analyzer

CareerCraft is a full-stack web application designed for resume analysis and ATS optimization. It follows a client-server architecture with a React frontend and an Express backend, leveraging several external services.

## High-Level Architecture

The system consists of the following primary components:

1.  **Frontend (React + Vite):** A single-page application (SPA) that handles user interaction, resume submission, and report visualization.
2.  **Backend (Express + Node.js):** A server-side application that manages API requests, authentication orchestration, database interactions, and integrations with external AI/payment services.
3.  **Database (PostgreSQL + Drizzle ORM):** Stores user profiles, resume data, transaction history, and subscription information.
4.  **Authentication (JWT):** Handles user registration, login, and secure session management via JSON Web Tokens.
5.  **Gemini API (Google):** Powers the AI-driven resume analysis and optimization.
6.  **Stripe:** Manages payment processing and subscription billing.
7.  **Redis:** Used for distributed token caching and rate limiting.

## Data Flow & Service Interactions

### 1. Authentication Flow
- **Frontend** provides email and password to the **Backend** (`/api/auth/login`).
- **Backend** verifies credentials against the **PostgreSQL** database.
- **Backend** issues a signed **JWT** to the **Frontend**.
- **Frontend** includes the JWT in the `Authorization` header for subsequent API requests to the **Backend**, where it is verified.

### 2. Resume Analysis Flow
- **Frontend** sends resume text and job description to the **Backend** (`/api/ai/generate`).
- **Backend** checks user credits/subscription status in **PostgreSQL**.
- **Backend** performs rate limiting check via **Redis**.
- **Backend** calls the **Gemini API** with the structured prompt.
- **Gemini API** returns the analysis JSON.
- **Backend** updates user trial/credit state in **PostgreSQL** and returns the analysis to the **Frontend**.

### 3. Payment Flow
- **Frontend** initiates checkout via **Stripe**.
- **Stripe** handles the payment UI and redirects back to the app.
- **Stripe** sends a webhook event to the **Backend** (`/api/webhooks/stripe`).
- **Backend** verifies the webhook and updates the user's subscription status in **PostgreSQL**.

## Service Interaction Diagram

```mermaid
graph TD
    User[User/Browser] -->|HTTPS| FE[Frontend (React)]
    FE -->|API Requests| BE[Backend (Express)]
    BE -->|Query/Update| DB[(PostgreSQL)]
    BE -->|Auth Verify| Auth[Auth Module (JWT)]
    BE -->|AI Prompt| GA[Gemini API]
    BE -->|Payment/Webhook| ST[Stripe]
    BE -->|Rate Limit/Cache| RD[(Redis)]
```

## Key Considerations

- **Security:** All API requests are authenticated. Sensitive keys (Gemini, Stripe, Database) are managed server-side and never exposed to the frontend.
- **Scalability:** The backend is stateless, allowing for horizontal scaling on platforms like Google Cloud Run.
- **Performance:** Redis is used to cache frequent data and enforce rate limits, reducing database load.
