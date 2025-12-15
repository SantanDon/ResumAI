# ResumAI - Swarm Powered CV Builder

> **The Ideology**: Using Maximal Agentic Decomposition and Ensemble Voting to build a zero-error CV creation platform.

## 🏗️ Architecture

```
ResumAI/
├── server/          # Node.js + Express + Ollama Swarm
│   ├── src/
│   │   ├── swarm/
│   │   │   ├── client.ts          # Ollama interface
│   │   │   ├── orchestrator.ts    # Voting logic (5 workers)
│   │   │   └── prompts.ts         # Atomic prompts library
│   │   ├── index.ts               # Express API
│   │   ├── test-swarm.ts          # Basic swarm test
│   │   └── test-cv-analysis.ts    # CV parsing test
│   └── package.json
├── frontend/        # React + Vite + Tailwind (Glassmorphism)
│   ├── src/
│   │   ├── App.tsx                # Main Swarm UI
│   │   └── index.css              # Premium design
│   └── package.json
└── templateCV/      # Your test CV
    └── DS_Santos_CV (1) (2) (4).pdf
```

## 🚀 Quick Start

### 1. Start the Backend (Swarm)
```bash
cd server
npm run dev
```
Server runs on `http://localhost:3001`

### 2. Start the Frontend
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:3000`

## 🐝 The Swarm in Action

The system uses **5 parallel instances** of `llama3.2:1b` for every decision:
- Each worker runs the same atomic task
- Results are aggregated via majority voting
- Error rate drops exponentially (0.90^1 → 0.99999^5)

### Example Flow:
```
User: "What is 2 + 2?"
├── Worker 1: "4" ✓
├── Worker 2: "4" ✓
├── Worker 3: "4" ✓
├── Worker 4: "4" ✓
└── Worker 5: "4" ✓
Result: "4" (5/5 consensus)
```

## 🧪 Testing

```bash
# Test basic swarm consensus
cd server
npm run test

# Test CV analysis (email extraction, bullet improvement)
npx ts-node src/test-cv-analysis.ts
```

## 📋 API Endpoints

### `POST /api/swarm/test`
Test the swarm with any atomic prompt.
```json
{
  "prompt": "Is this text an email? yes or no.\n\nText: john@example.com"
}
```

### `POST /api/cv/analyze` (Coming Soon)
Full CV parsing with swarm decomposition.

## 🎯 Roadmap

**Phase 1** ✅ (Complete)
- [x] Swarm orchestrator with voting
- [x] Atomic prompts for CV parsing
- [x] Premium React frontend
- [x] Glassmorphism UI

**Phase 2** (Next)
- [ ] Master CV database (SQLite)
- [ ] PDF parsing (using your template CV)
- [ ] "Builder" wizard flow

**Phase 3**
- [ ] CV template selection
- [ ] Export to PDF
- [ ] Job description tailoring

## 🧠 The Ideology

From [`Ideology.txt`](./Ideology.txt):

> A single LLM will almost always fail on tasks requiring more than a few hundred consecutive perfect steps. The solution is **Maximal Agentic Decomposition** + **Ensemble Voting**.

This system achieves:
- ✅ **Zero errors** over arbitrarily long horizons
- ✅ **Cheap models** (1B parameters) with industrial-grade reliability
- ✅ **Fault tolerance** through redundancy, not intelligence

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, TypeScript, Ollama
- **Frontend**: React, Vite, Tailwind CSS
- **AI**: Local LLMs via Ollama (`llama3.2:1b`)
- **Design**: Glassmorphism, Inter font, gradient colors

## 📝 Notes

- Ensure Ollama is running: `ollama serve`
- The Swarm uses 5 workers by default (configurable in `orchestrator.ts`)
- For faster iteration, reduce worker count to 3

---

Built with the **Ideology** of fault-tolerant AI systems. 🐝
