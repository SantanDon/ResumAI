# StudyPodLM — Multi-Modal AI Learning Workspace 🎧

[![React](https://img.shields.io/badge/React-18-blue.svg)]()
[![Vite](https://img.shields.io/badge/Vite-5.0-purple.svg)]()
[![Groq Cloud](https://img.shields.io/badge/Groq-Accelerated_Inference-red.svg)]()
[![Tesseract OCR](https://img.shields.io/badge/OCR-Tesseract.js-blue.svg)]()

StudyPodLM transforms textbooks, lecture slides, video links, and handwritten notes into interactive learning pod experiences, complete with high-speed text-to-speech audio rendering and self-assessment tools.

---

## 🚀 Key Features

*   **Multi-Modal Entrainment**: Supports textbook PDFs, video links, and image documents.
*   **In-Browser OCR**: Uses Tesseract.js to extract text from slides or notes directly client-side.
*   **Audio Generation Pipeline**: Synthesizes structured podcasts and guides via a Groq-accelerated text-to-speech engine.
*   **Interactive Quizzing**: Generates flashcards and multiple-choice questions automatically from study assets.
*   **Local-First Persistence**: Saves your workspace, notes, and progress in IndexedDB for offline-ready study sessions.

---

## 🛠️ Tech Stack

*   **Frontend**: React, TypeScript, Vite
*   **Audio**: Web Audio API & HTML5 Audio players
*   **AI Inference**: Groq API (High-speed Llama-3-70B/8B inference)
*   **OCR Parsing**: Tesseract.js (Client-side Optical Character Recognition)
*   **Styling**: Premium Glassmorphism CSS & Framer Motion
*   **Persistence**: IndexedDB / LocalStorage

---

## 📦 Getting Started

### 1. Set Up Variables
Create a `.env` file in the root folder:
```env
VITE_GROQ_API_KEY=your_groq_api_key_here
VITE_OPENAI_API_KEY=your_openai_key_here (optional, for alternative TTS)
```

### 2. Install and Start
```bash
# Install package dependencies
npm install

# Start Vite dev server
npm run dev
```
Access the client workbench at `http://localhost:5173`.

---

Build time, review notes, listen on the go — study smarter with StudyPodLM. 🎧
