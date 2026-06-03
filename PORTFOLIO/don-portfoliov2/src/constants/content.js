export const HERO_CONTENT = {
  title: "HI, I'M DON SANTOS",
  subtitle: 'Full Stack Engineer & AI Systems Architect',
  tagline: "Don't try. Do."
};

export const ABOUT_CONTENT = {
  title: 'About Me',
  bio: "Operating at the intersection of complex software engineering and agentic automation, I design and ship high-performance digital systems that eliminate operational bottlenecks. As an engineer, my mission is simple: to dismantle friction and reclaim human time through technology. I don't just write scripts; I build robust, production-grade applications that solve real-world problems.\n\nMy development philosophy is rooted in architectural reliability. By leveraging concepts like Swarm Intelligence and Maximal Agentic Decomposition, I transform volatile, single-agent AI systems into predictable, fault-tolerant pipelines. Whether architecting custom legal-tech platforms or high-throughput automation engines, I focus on performance, safety, and visual precision.",
  skills: [
    { category: 'AI & Systems Design', items: [{name: 'Swarm Intelligence'}, {name: 'Ensemble Voting'}, {name: 'Maximal Decomposition'}, {name: 'RAG Architectures'}, {name: 'Vector Databases'}, {name: 'LangChain'}, {name: 'Ollama / Groq'}] },
    { category: 'Frontend Engineering', items: [{name: 'React'}, {name: 'Next.js 14'}, {name: 'TypeScript'}, {name: 'Tailwind CSS'}, {name: 'Framer Motion'}, {name: 'WebGL Shaders'}] },
    { category: 'Backend & Tooling', items: [{name: 'Node.js / Express'}, {name: 'REST & WebSockets'}, {name: 'SQLite / Postgres'}, {name: 'Puppeteer Rendering'}, {name: 'Docker'}, {name: 'Git / CI-CD'}] }
  ],
  education: [
    {
      degree: 'Diploma in Paralegal Studies',
      institution: 'University of Johannesburg (UJ)',
      description: 'Rigorous legal studies specializing in statutory interpretation, legal research, and legal drafting.',
      modules: ['Contract Law', 'Legal Drafting', 'Litigation & Procedures', 'Labour Law', 'Criminal Law', 'Business Law', 'Law of Succession']
    },
    {
      degree: 'Full-Stack Web Development',
      institution: 'HyperionDev',
      description: 'Advanced software engineering, systems design, and full-stack web architectures.',
      modules: ['React & Node.js', 'System Architecture', 'TypeScript & State Safety', 'REST & WebSockets', 'Database Design']
    }
  ],
  profileImage: '/profile.jpg',
  cvUrl: '/cv.pdf'
};

export const STATS = [
  { value: "3", label: "Live Products" },
  { value: "1,000+", label: "Commits" },
  { value: "5-Worker", label: "AI Swarms" },
  { value: "0%", label: "Hallucination Rate" }
];

export const PROJECTS = [
  {
    id: 'docketdive',
    title: 'DocketDive',
    description: "South Africa's first AI-native legal research assistant. Architected a multi-stage RAG (Retrieval-Augmented Generation) pipeline that lets legal professionals query, analyze, and cite SA case law with zero hallucinations.",
    tech: ['Next.js 14', 'TypeScript', 'LangChain', 'Vector DB', 'Ollama', 'Semantic Search'],
    liveLink: 'https://docketdive.vercel.app/',
    sourceLink: '#'
  },
  {
    id: 'studypodlm',
    title: 'StudyPodLM',
    description: 'A multi-modal AI learning workspace. Converts files, textbook PDFs, and video links into structured study guides, complete with a Groq-accelerated text-to-speech audio player and interactive self-quizzing.',
    tech: ['React', 'Vite', 'Groq AI', 'Tesseract OCR', 'OpenAI', 'HTML5 Audio'],
    liveLink: 'https://studypod-lm.vercel.app/',
    sourceLink: '#'
  },
  {
    id: 'photoshop-portfolio',
    title: 'Design Systems Lab',
    description: 'A playground for high-fidelity user interface concepts, interactive layouts, and custom WebGL background shader integrations built to test physics-based UI springs and motion paths.',
    tech: ['HTML5', 'CSS3', 'JavaScript', 'WebGL', 'Framer Motion'],
    liveLink: 'https://santandon-photoshop-v2.vercel.app/',
    sourceLink: '#'
  }
];

export const CONTACT_CONTENT = {
  title: "Let's Connect",
  subtitle: "Ready to design or build your next production system? I'm available for freelance contracts and startup engagements.",
  email: 'don16santos@gmail.com',
  phone: '+27679215702',
  links: [
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/don-santos-8440bb337/' },
    { label: 'GitHub', url: 'https://github.com/SantanDon' }
  ]
};
