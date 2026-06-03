# DocketDive — AI Legal Research Assistant for South African Law ⚖️

[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)]()
[![LangChain](https://img.shields.io/badge/LangChain-Enabled-green.svg)]()
[![Ollama](https://img.shields.io/badge/Ollama-Local_LLM-orange.svg)]()

DocketDive is South Africa's first AI-native legal research assistant. It leverages RAG (Retrieval-Augmented Generation) technology to help legal professionals and researchers find, analyze, and cite South African case law with zero hallucinations.

---

## 🚀 Key Features

*   **Hallucination-Free Responses**: Grounded search queries directly bound to South African statutory frameworks and judicial precedents.
*   **Custom Semantic Chunking**: Indexes complex legal documents and precedents, retaining contextual hierarchy for better retrieval relevance.
*   **Contextual Citation Matching**: Automatically formats citations in compliance with South African court citation standards.
*   **Local-First Privacy**: Can run entirely locally using Ollama, keeping sensitive client litigation details private.

---

## 🏗️ System Architecture

```
                       [ Legal Search Query ]
                                  │
                  (Embedding & Vector Similarity)
                                  │
                                  ▼
                     [ SA Law Database / RAG ]
                                  │
                        (Context Extraction)
                                  │
                                  ▼
                     [ LLM Reasoning (Ollama) ]
                                  │
                                  ▼
                   [ Verified Response & Citations ]
```

---

## 🛠️ Tech Stack

*   **Framework**: Next.js 14 (App Router)
*   **Language**: TypeScript
*   **AI/RAG Orchestration**: LangChain
*   **Vector Database**: Chroma / Local Vector Store
*   **LLM Integration**: Ollama (Local) & Groq Cloud (API)
*   **Styling**: CSS Modules & Tailwind CSS

---

## 📦 Getting Started

### 1. Set Up Ollama
Download and run the legal reasoning model:
```bash
ollama run llama3-groq-tool-use # or your preferred model
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Installation & Run
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
Open `http://localhost:3000` to access the research workbench.

---

Designed to streamline litigation preparation and make South African legal research highly accessible.
