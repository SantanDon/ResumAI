# ResumAI - Comprehensive Project Overview

## 🏗️ Project Architecture

ResumAI is a full-stack application built on the "Ideology" of fault-tolerant AI systems using Maximal Agentic Decomposition and Ensemble Voting. The system uses multiple parallel instances of cheap LLMs (llama3.2:1b) working together to achieve zero-error CV parsing and enhancement.

### Directory Structure
```
ResumAI/
├── server/          # Node.js + Express + Ollama Swarm
│   ├── src/
│   │   ├── swarm/
│   │   │   ├── client.ts          # Ollama interface
│   │   │   ├── orchestrator.ts    # Voting logic (5 workers)
│   │   │   └── prompts.ts         # Atomic prompts library
│   │   ├── index.ts               # Express API
│   │   ├── cvparser.ts            # CV parsing with swarm verification
│   │   ├── test-swarm.ts          # Basic swarm test
│   │   ├── test-cv-analysis.ts    # CV parsing test
│   │   └── db.ts                  # SQLite database setup
│   └── package.json
├── frontend/        # React + Vite + Tailwind (Glassmorphism)
│   ├── src/
│   │   ├── components/            # React UI components
│   │   ├── App.tsx                # Main Swarm UI
│   │   └── index.css              # Premium design
├── templateCV/      # Your test CV
├── CV.txt          # Sample CV text
├── Ideology.txt     # Core ideology documentation
├── README.md        # Main project documentation
├── QUICK_START.md   # Quick start guide
└── IMPLEMENTATION_SUMMARY.md # Implementation summary
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Ollama running locally (`ollama serve`)
- `llama3.2:1b` model installed (`ollama pull llama3.2:1b`)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Backend (Swarm)
```bash
cd server
npm run dev
```
Server runs on `http://localhost:3001`

### 3. Start the Frontend
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:3000`

### 4. Alternative: Run Both Together
```bash
npm run dev  # From project root
```

## 🧠 The Ideology

The breakthrough concept behind ResumAI is using **Maximal Agentic Decomposition** and **Ensemble Voting**:

- **Maximal Agentic Decomposition**: Breaking complex tasks into atomic sub-tasks that are trivial for 1B models to handle with 90-95% accuracy.
- **Ensemble Voting**: Using 5-15 parallel instances of the same cheap model and taking majority vote - if a single model has 0.90 accuracy, 9-vote majority has >0.99999 accuracy.
- **Result**: Systems composed of weak models can achieve zero errors over arbitrarily long horizons.

## 🐝 Swarm Architecture

### Core Components

1. **SwarmOrchestrator** (`server/src/swarm/orchestrator.ts`):
   - Manages N parallel workers (default 5)
   - Distributes identical atomic prompts to all workers
   - Aggregates results via majority voting
   - Implements consensus algorithm for reliable results

2. **SwarmClient** (`server/src/swarm/client.ts`):
   - Communicates with Ollama API
   - Uses `llama3.2:1b` model by default
   - Handles individual LLM requests

3. **Atomic Prompts** (`server/src/swarm/prompts.ts`):
   - Library of single-purpose prompts
   - Each asks for ONE simple decision
   - Designed for 1-5 token responses from 1B models

4. **CV Parser** (`server/src/cvparser.ts`):
   - Extracts text from PDFs
   - Decomposes into atomic lines
   - Classifies each line using swarm verification
   - Saves to MasterCV database

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

## 📋 API Endpoints

### `POST /api/swarm/test`
Test the swarm with any atomic prompt.
```json
{
  "prompt": "Is this text an email? yes or no.\n\nText: john@example.com"
}
```

### `POST /api/cv/parse`
Parse a CV PDF file using the swarm.
- Accepts multipart form data with 'cv' field
- Returns parsed CV data with classifications
- Saves results to MasterCV database

### `GET /api/cv/master/:userId`
Retrieve MasterCV entries for a specific user.

### `GET /api/cv/master`
Retrieve default MasterCV entries.

### `PUT /api/cv/master/:id`
Update a specific MasterCV entry.

### `DELETE /api/cv/master/:id`
Delete a specific MasterCV entry.

### `POST /api/cv/master`
Create a new MasterCV entry.

### `POST /api/cv/analyze-gaps`
Analyze skill gaps between CV and job description.

### `POST /api/cv/summary`
Get CV overview from master_cv database.

### `POST /api/cv/chat`
Context-aware chat responses about CV.

### `POST /api/cv/enhance`
Generate CV enhancement suggestions.

### `POST /api/cv/tailor`
Tailor CV for specific job description.

### `POST /api/mail/check-cooldown`
Validate emails against 4-day cooldown rule.

### `POST /api/mail/generate`
Generate professional email using AI.

### `POST /api/mail/send`
Send batch emails and log to database.

## 🎯 Development Conventions

### Atomic Prompt Design
- Each prompt should ask for ONE simple decision
- Target 1-5 token responses from 1B models
- Use yes/no or single-number responses when possible
- Validate responses with simple logic

### Code Structure
- Server-side code in TypeScript
- Client-side code in React with TypeScript
- Database operations use SQLite with better-sqlite3
- Error handling with try-catch blocks
- Asynchronous operations with async/await

### Testing
```bash
# Test basic swarm consensus
cd server
npm run test

# Test CV analysis (email extraction, bullet improvement)
npx ts-node src/test-cv-analysis.ts
```

## 🧪 Testing

The project includes comprehensive testing for the swarm functionality:

- `test-swarm.ts` - Basic consensus verification
- `test-cv-analysis.ts` - CV parsing and enhancement tests
- Various atomic prompt tests in `prompts.ts`

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js v24+
- **Framework**: Express.js v5.1.0
- **Language**: TypeScript
- **AI Integration**: Ollama client
- **Database**: SQLite via better-sqlite3
- **Document Processing**: pdf-parse

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite
- **Styling**: Tailwind CSS, Framer Motion
- **UI Components**: Lucide React, Custom glassmorphism components
- **State Management**: React hooks

### AI/ML
- **Model**: llama3.2:1b (local)
- **Architecture**: 5-worker ensemble voting
- **Prompt Strategy**: Atomic decomposition

## 🎨 UI Features

### Premium Design
- Glassmorphism with backdrop blur effects
- Aurora background animations
- Framer Motion animations
- Spotlight card effects
- Animated lists and transitions

### Core Functionality
- Drag & drop PDF upload
- Real-time CV parsing with swarm verification
- MasterCV database editing
- Skills gap analysis
- CV template selection
- PDF export functionality

### Navigation
- Sidebar dock with Editor, Analysis, and Templates tabs
- Responsive multi-column layout
- Interactive card components with hover effects

## 📊 MasterCV Database

The MasterCV is a centralized SQLite database that stores CV information:

- **Schema**: id, user_id, section_type, content, created_at
- **Section Types**: email, phone, date, skill, unknown
- **Storage**: Per-user entries with default as fallback
- **Access**: Full CRUD operations via REST API

## 🔧 Configuration

### Server Configuration
- Port: 3001 (configurable via PORT environment variable)
- Worker count: 5 (configurable in orchestrator)
- Model: llama3.2:1b (configurable in client)

### Frontend Configuration
- Port: 3000 (Vite default)
- Proxy: Connects to backend at http://localhost:3001

## 🔄 Development Workflow

1. Ensure Ollama is running with `llama3.2:1b` model available
2. Install dependencies in both server and frontend
3. Run backend: `cd server && npm run dev`
4. Run frontend: `cd frontend && npm run dev`
5. Access UI at http://localhost:3000
6. Test API endpoints directly or through UI

## 📋 Roadmap

### Phase 1 (Complete)
- ✅ Swarm orchestrator with voting
- ✅ Atomic prompts for CV parsing
- ✅ Premium React frontend
- ✅ Glassmorphism UI
- ✅ MasterCV database implementation

### Phase 2 (Next)
- [ ] Advanced PDF parsing improvements
- [ ] More sophisticated CV analysis
- [ ] Enhanced gap analysis and recommendations
- [ ] User authentication system

### Phase 3
- [ ] CV template selection
- [ ] Export to PDF
- [ ] Job description tailoring
- [ ] Advanced skill matching algorithms

After completing a task only provide summary of changes. YOU ARE FORBIDDEN FROM STARTING YOUR OWN DEVELOPMENT SERVER- ask user to refrsh or restart server when needed .