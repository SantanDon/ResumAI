# ResumAI — Swarm-Powered CV Engine 🐝

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)]()
[![React](https://img.shields.io/badge/React-18-blue.svg)]()
[![Ollama](https://img.shields.io/badge/Ollama-Local_LLM-orange.svg)]()

> **The Architectural Philosophy**: Reliability is a property of system design, not individual model intelligence. ResumAI eliminates LLM hallucinations and generation errors using a consensus-driven multi-agent voting swarm.

---

## 🏗️ The Problem & The Solution

Single LLMs, no matter how large or capable, inevitably fail on multi-step workflows. Even a minor **0.5% error rate** per step compounds exponentially to near-certain failure over a sequence of 100+ steps.

ResumAI solves this through:
1.  **Maximal Agentic Decomposition**: Recursively breaking down complex CV parsing, optimization, and generation tasks into a sequence of atomic, low-token decisions.
2.  **Ensemble Voting with Redundancy**: Querying **5 parallel instances** of local, lightweight LLM workers (`llama3.2:1b`) for every single atomic decision and taking the majority consensus. If a single model has a 90% individual accuracy rate, a 5-worker majority vote pushes reliability to **99.999%**.

### 🐝 Swarm Consensus Flow

```
                      [ User Input / CV Draft ]
                                  │
                  (Maximal Agentic Decomposition)
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
               [Atomic Q1]   [Atomic Q2]   [Atomic Q3] ...
                    │
           ┌────────┴────────┬────────────────┬────────────────┬────────┐
           ▼                 ▼                ▼                ▼        ▼
       [Worker 1]        [Worker 2]       [Worker 3]       [Worker 4] [Worker 5]
     (llama3.2:1b)     (llama3.2:1b)    (llama3.2:1b)    (llama3.2:1b) (llama3.2:1b)
           │                 │                │                │        │
           └────────┬────────┴────────────────┼────────────────┴────────┘
                    ▼                         ▼
             [Voter Output 1]          [Voter Output 2] ...
                    │
            (Majority Consensus: 5/5 or 4/1 or 3/2)
                    │
                    ▼
           [Determinstic Output: 0% Hallucinations]
```

---

## 📁 Repository Structure

```
ResumAI/
├── server/                 # Node.js + Express backend
│   ├── src/
│   │   ├── swarm/
│   │   │   ├── client.ts         # Ollama API interface
│   │   │   ├── orchestrator.ts   # Consensus/Voting logic (5 workers)
│   │   │   └── prompts.ts        # Atomic prompt library
│   │   ├── services/
│   │   │   ├── templateRenderer.ts # Headless Puppeteer PDF rendering
│   │   │   └── qualityScorer.ts   # ATS formatting check & suggestions
│   │   ├── routes/
│   │   │   └── autoJobHunter.ts  # Job scout & auto-apply workflow
│   │   └── index.ts              # Server bootstrap
│   └── package.json
├── frontend/               # React client with glassmorphism UI
│   ├── src/
│   │   ├── components/
│   │   │   ├── JobHunterDashboard.tsx # Scout interface with tab structure
│   │   │   ├── AutoApplyProgress.tsx # Application batch monitoring
│   │   │   └── AIChatInterface.tsx    # Interactive parsing chat
│   │   ├── App.tsx         # Main entrypoint
│   │   └── index.css       # Styling configuration
│   └── package.json
└── templateCV/             # Reference assets for parsing validation
```

---

## 🚀 Quick Start

### Prerequisites
Ensure [Ollama](https://ollama.com/) is installed and running locally, and pull the required model:
```bash
ollama pull llama3.2:1b
```

### 1. Run the Backend
```bash
cd server
npm install
npm run dev
```
The server will boot on `http://localhost:3001` and expose 15+ API endpoints for CV parsing, quality scoring, and auto-applying.

### 2. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
The client app will boot on `http://localhost:3000` with a full Glassmorphism design system.

---

## 🧪 Verification & Testing

Verify backend swarm behavior and parser correctness by running:

```bash
# Verify swarm consensus mechanics
cd server
npm run test

# Run the strict CV parsing audit
npx ts-node src/test-cv-analysis.ts

# Generate Don Santos's custom PDF CV via Puppeteer
npx ts-node src/test-don-santos-cv.ts
```

---

## 🛡️ Core Services

*   **Quality Intelligence Service**: Provides real-time ATS semantic scoring, spelling corrections, and metric-driven bullet enhancers.
*   **Gold Standard Renderer**: Uses Puppeteer in headless mode to render print-optimized CSS templates into high-quality PDFs.
*   **Auto Job Hunter / Mass Apply**: Integrates job boards (RemoteOK, Adzuna) with a queue-based batch outreach engine that customizes cover letters and coordinates email submissions.

---

Built with 🖤 and the **Ideology** of fault-tolerant AI architectures. 🐝
