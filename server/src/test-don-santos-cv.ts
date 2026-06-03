/**
 * Test CV Generation for Don Samuel Santos
 * Creates a professional CV showcasing the ResumAI project
 */

import { templateRenderer } from './services/templateRenderer';
import { qualityScorer } from './services/qualityScorer';
import { JSONResume } from './types/jsonResume';

// Don Samuel Santos CV Data (Overly Marketable, Date-Free)
const donSantosCV: JSONResume = {
  basics: {
    name: 'Don Santos',
    email: 'don16santos@gmail.com',
    phone: '+27 67 921 5702',
    summary: 'Systems Architect and Full-Stack Engineer specializing in designing fault-tolerant AI orchestration pipelines, distributed multi-agent swarms, and high-performance React architectures. Expert in resolving the compounding error rates of single-instance large language models through system-level redundancy, consensus-based voting protocols, and recursive task decomposition. Partnering with startups and founders to build production-grade, deterministic AI platforms and user interfaces that maximize throughput and visual excellence.',
    location: {
      city: 'Gauteng',
      region: 'South Africa',
      countryCode: 'ZA'
    },
    profiles: [
      {
        network: 'LinkedIn',
        url: 'https://www.linkedin.com/in/don-santos-8440bb337/'
      },
      {
        network: 'GitHub',
        url: 'https://github.com/SantanDon'
      }
    ]
  },
  work: [
    {
      name: 'ResumAI',
      position: 'Full-Stack Architect & Creator',
      startDate: '', // Intentionally blank for date-free branding
      endDate: '',
      highlights: [
        'Architected and built ResumAI, an industrial-grade CV builder and job application ecosystem designed to replace unstable, single-agent AI text generation with a 5-worker consensus Swarm Engine.',
        'Designed and implemented Maximal Agentic Decomposition protocols, splitting complex document parsing and optimization workflows into granular, low-token decisions to mathematically suppress generation errors.',
        'Created a Gold Standard PDF rendering pipeline leveraging headless Puppeteer and custom print stylesheets, ensuring pixel-perfect, ATS-optimized, Harvard-style PDF generation.',
        'Engineered a multi-threaded batch application workflow ("Mass Apply") that tails job applications, dynamically customizes resumes, and manages batch submissions with redundant worker verification.',
        'Developed a real-time Quality Intelligence service providing semantic scoring, metric-driven text suggestions, and resume enhancement feedback using local LLM models.'
      ]
    }
  ],
  education: [
    {
      institution: 'University of Johannesburg (UJ)',
      area: 'Paralegal Studies',
      studyType: 'Diploma',
      startDate: '',
      endDate: '',
      courses: [
        'Contract Drafting',
        'Civil Litigation',
        'Business & Labour Law',
        'Criminal Procedure',
        'Law of Succession'
      ]
    },
    {
      institution: 'HyperionDev',
      area: 'Web Development',
      studyType: 'Full-Stack Certificate',
      startDate: '',
      endDate: '',
      courses: [
        'Advanced React Patterns',
        'System Architecture',
        'TypeScript State Safety',
        'REST & WebSockets',
        'Database Design'
      ]
    },
    {
      institution: 'Independent Engineering Research',
      area: 'Distributed Systems & LLM Error Correction',
      studyType: 'Ongoing Research',
      startDate: '',
      endDate: '',
      courses: [
        'Consensus Voting Mechanics',
        'Multi-Model Ensemble Architectures',
        'Hallucination Mitigation Pipelines'
      ]
    }
  ],
  skills: [
    {
      name: 'AI & Systems Design',
      keywords: ['Swarm Intelligence', 'Ensemble Voting', 'Maximal Decomposition', 'RAG Architectures', 'Vector Databases', 'LangChain', 'Ollama / Groq']
    },
    {
      name: 'Frontend Engineering',
      keywords: ['React', 'Next.js 14', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'WebGL Shaders']
    },
    {
      name: 'Backend & Tooling',
      keywords: ['Node.js / Express', 'REST & WebSockets', 'SQLite / Postgres', 'Puppeteer Rendering', 'Docker', 'Git / CI-CD']
    }
  ],
  projects: [
    {
      name: 'DocketDive — AI Legal Research Assistant',
      description: 'South Africa’s first AI-native legal research assistant. Created a multi-stage Retrieval-Augmented Generation (RAG) system that allows legal professionals to query, analyze, and cite case law with zero hallucinations.',
      keywords: ['Next.js 14', 'TypeScript', 'LangChain', 'Vector Database', 'Ollama', 'Semantic Search'],
      url: 'https://docketdive.vercel.app/'
    },
    {
      name: 'StudyPodLM — Multi-Modal Learning Workspace',
      description: 'An interactive AI education platform converting textbooks, lecture notes, and video assets into structured study guides, complete with custom text-to-speech rendering and self-assessment engines.',
      keywords: ['React', 'Vite', 'Groq AI', 'Tesseract OCR', 'OpenAI API', 'Web Audio API'],
      url: 'https://studypod-lm.vercel.app/'
    },
    {
      name: 'Design Systems Lab — High-Fidelity UI Playground',
      description: 'An experimental showcase for cutting-edge user interfaces, containing complex WebGL shaders, fluid dynamics, glassmorphism components, and spring-physics micro-animations.',
      keywords: ['HTML5', 'CSS3', 'JavaScript', 'WebGL', 'Framer Motion'],
      url: 'https://santandon-photoshop-v2.vercel.app/'
    }
  ],
  meta: {
    version: '1.0.0',
    lastModified: new Date().toISOString()
  }
};

async function generateDonSantosCV() {
  console.log('🚀 Generating CV for Don Santos\n');
  console.log('='.repeat(50));

  // Step 1: Calculate Quality Score
  console.log('\n📊 Step 1: Quality Score Analysis');
  const scoreResult = qualityScorer.calculateScore(donSantosCV);
  console.log(`   Score: ${scoreResult.score}/100`);
  console.log(`   Breakdown:`, scoreResult.breakdown);
  if (scoreResult.suggestions.length > 0) {
    console.log(`   Suggestions:`, scoreResult.suggestions);
  }

  // Step 2: Generate HTML
  console.log('\n🖼️ Step 2: Generating HTML');
  const html = templateRenderer.renderToHTML(donSantosCV);
  console.log(`   HTML generated: ${html.length} characters`);

  // Step 3: Generate PDF
  console.log('\n📑 Step 3: Generating PDF');
  try {
    const pdfBuffer = await templateRenderer.renderToPDF(donSantosCV);
    console.log(`   PDF generated: ${pdfBuffer.length} bytes`);

    // Save PDF
    const filename = 'Don_Santos_CV.pdf';
    const downloadsDir = '../../downloads';
    const filepath = await templateRenderer.savePDF(donSantosCV, filename);
    console.log(`   ✅ Saved to: ${filepath}`);
    
    // Also copy to MY CV folder for user convenience
    const fs = require('fs');
    const path = require('path');
    const destPath = path.join(__dirname, '../../MY CV/Don_Santos_CV.pdf');
    fs.writeFileSync(destPath, pdfBuffer);
    console.log(`   ✅ Also copied to: ${destPath}`);
  } catch (error) {
    console.error('   ❌ PDF generation failed:', error);
  }

  // Step 4: Generate Text (ATS-friendly)
  console.log('\n📝 Step 4: Generating ATS-friendly Text');
  const text = templateRenderer.exportToText(donSantosCV);
  console.log(`   Text generated: ${text.length} characters`);
  console.log('\n--- TEXT PREVIEW ---');
  console.log(text.substring(0, 1000) + '...');

  console.log('\n' + '='.repeat(50));
  console.log('✅ CV Generation Complete!');
}

generateDonSantosCV().catch(console.error);
