# ResumAI

**ResumAI** is a swarm-powered CV builder and mass outreach platform designed to create zero-error CVs using "Maximal Agentic Decomposition and Ensemble Voting". It leverages local LLMs (Ollama) to parse, analyze, and enhance resumes with industrial-grade reliability.

## Project Overview

*   **Goal:** To replace single-agent LLM failure points with a consensus-based "swarm" of smaller models (llama3.2:1b) that vote on every decision.
*   **Core Components:**
    *   **CV Chat:** Interactive analysis, summarization, and enhancement of CVs.
    *   **Mass Mail:** Bulk email outreach tool with automated drafting and cooldown tracking.
    *   **Swarm Engine:** A 5-worker voting system for high-fidelity text processing.

## Architecture

The project follows a monorepo-like structure:

*   **`frontend/`**: React application built with Vite and Tailwind CSS.
    *   Uses a "Glassmorphism" design system.
    *   Key components: `LandingPage`, `AIChatInterface`, `MassMailInterface`.
*   **`server/`**: Node.js + Express backend.
    *   Handles API requests, database interactions (SQLite), and the Swarm orchestration.
    *   **`src/swarm/`**: Contains the core logic for the AI swarm (`orchestrator.ts`, `client.ts`, `prompts.ts`).
*   **`templateCV/`**: Stores reference/template CVs for testing and parsing logic.

## Tech Stack

*   **Frontend:** React, TypeScript, Vite, Tailwind CSS.
*   **Backend:** Node.js, Express, TypeScript, SQLite.
*   **AI/ML:** Ollama (Local LLMs), specifically `llama3.2:1b`.
*   **Testing:** Jest (implied), Custom TS scripts.

## Key Commands

### Setup
Ensure [Ollama](https://ollama.com/) is installed and running (`ollama serve`), and pull the required model:
```bash
ollama pull llama3.2:1b
```

### Development
The project requires running both backend and frontend servers.

**Backend:**
```bash
cd server
npm install
npm run dev
# Runs on http://localhost:3001
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### Testing
**Run Swarm Consensus Tests:**
```bash
cd server
npm run test
```

**Run CV Analysis Tests:**
```bash
cd server
npx ts-node src/test-cv-analysis.ts
```

## Development Conventions

*   **AI Interaction:** All AI tasks must go through the Swarm Orchestrator (`server/src/swarm/orchestrator.ts`) to ensure consensus. Do not use raw LLM calls for critical logic.
*   **Styling:** Use Tailwind CSS with the established glassmorphism utility classes (`glass`, `glass-dark`).
*   **State Management:** React functional components with Hooks.
*   **Database:** SQLite is used for local data persistence (e.g., `email_logs`).

## Roadmap

*   **Phase 1 (Complete):** Swarm orchestrator, basic CV parsing, frontend UI.
*   **Phase 2 (Current):** Master CV database, PDF parsing implementation, Builder Wizard.
*   **Phase 3 (Planned):** Template selection, PDF export, Job description tailoring.
