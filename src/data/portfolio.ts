// Single source of truth for all site content.
// Voice: an experienced engineer stating facts. Specific over superlative.

export const profile = {
  name: 'Sushant Kadam',
  role: 'Senior Software Engineer',
  positioning: 'I build backend systems and AI products that ship.',
  intro:
    'Backend engineer with 5+ years of experience building production systems across e-commerce, data platforms, intelligent document processing, and AI-powered products.',
  location: 'India',
  email: 'kadam.sushant@yahoo.com',
  resumeHref: '/resume', // in-site PDF viewer page
};


// Compact factual ledger for the hero.
// Keep these aligned with claims explained later in Experience.

export const impact = [
  {
    metric: '100k+',
    label: 'orders processed daily',
    context: 'JioMart / Fynd OMS',
  },
  {
    metric: '10k+',
    label: 'posts processed daily',
    context: 'AI intelligence pipeline',
  },
  {
    metric: '90%',
    label: 'faster content-tool loads',
    context: 'EDRA Labs',
  },
  {
    metric: 'IEEE',
    label: 'published research',
    context: 'Real-time helmet detection',
  },
];


export type Experience = {
  index: string;
  start: string;
  end: string;
  role: string;
  company: string;
  companyHref?: string;
  note?: string;
  summary: string;
  highlights: string[];
  links?: { label: string; href: string }[];
  stack: string[];
};


export const experience: Experience[] = [
  {
    index: '01',
    start: 'Oct 2024',
    end: 'Present',
    role: 'Senior Software Engineer',
    company: 'EDRA Labs',
    companyHref: 'https://www.linkedin.com/company/edra-labs',
    note: 'A BrowserStack company',
    summary:
      'Currently leading development of Havi.ai, an LLM-driven slide-generation platform, with ownership of agentic workflows and backend architecture from design through production.',
    highlights: [
      'Building Havi.ai, an LLM-driven slide-generation platform (React + FastAPI), with agentic workflows for conversational editing, PPTX/PDF export, and share-based access; 90% faster page loads.',
      'Built and productionized Make A Viz, an AI diagram-generation SaaS, with full-stack development (React, FastAPI) and LangChain prompt orchestration, shipped as a ChatGPT app with SigNoz observability.',
      'Built async pipelines processing 10k+ posts/day for an LLM-based Reddit intelligence platform, surfacing actionable insights for strategy teams.',
      'Automated manufacturer onboarding with Python pipelines orchestrated in Prefect, cutting dev-to-production cycle time by 50%.',
    ],
    links: [
      { label: 'Havi.ai', href: 'https://havi.ai' },
      { label: 'Make A Viz', href: 'https://makeaviz.com' },
    ],
    stack: [
      'React',
      'FastAPI',
      'Python',
      'LangChain',
      'LLMs',
      'Prefect',
    ],
  },

  {
    index: '02',
    start: 'Mar 2023',
    end: 'Sep 2024',
    role: 'Software Development Engineer I',
    company: 'Fynd',
    companyHref: 'https://www.fynd.com',
    note: 'A Reliance company',
    summary:
      'Built backend services for the Order Management System powering commerce workflows across JioMart and Fynd.',
    highlights: [
      'Built and scaled order workflows handling 100k+ daily orders and 200k+ during peak sale events.',
      'Designed return quality-check workflows and APIs that reduced fraudulent returns by 20%.',
      'Built asynchronous integrations across order, inventory, logistics, and fulfillment systems.',
      'Shipped Buy Online, Pick Up In Store workflows for international commerce markets.',
    ],
    stack: [
      'Python',
      'Microservices',
      'Kafka',
      'MongoDB',
      'Redis',
      'E-commerce',
    ],
  },

  {
    index: '03',
    start: 'Jun 2021',
    end: 'Feb 2023',
    role: 'Senior Product Engineer',
    company: 'LTIMindtree',
    companyHref: 'https://www.ltimindtree.com',
    summary:
      'Built backend services for Aspect, an Intelligent Document Processing platform for extracting structured data from complex documents.',
    highlights: [
      'Integrated Google Vision, AWS Textract, Kofax, and Tesseract into unified document-processing workflows.',
      'Led development of tabular data extraction algorithms, improving extraction accuracy by 25% and reducing false positives by 30%.',
      'Researched and implemented text-zoning techniques to improve document structure detection and downstream extraction.',
    ],
    stack: [
      'Python',
      'OCR',
      'AWS Textract',
      'Google Vision',
      'Document AI',
      'Microservices',
    ],
  },
];


export type Project = {
  index: string;
  title: string;
  tagline: string;
  description: string;
  stack: string[];
  links: {
    label: string;
    href: string;
    kind: 'github' | 'external' | 'store';
  }[];
};


export const projects: Project[] = [
  {
    index: '01',
    title: 'LeetWhisper',
    tagline: 'Progressive AI coding mentor',
    description:
      'Chrome extension that reviews LeetCode solutions and provides progressive hints, bug analysis, and optimization guidance without revealing the answer upfront.',
    stack: [
      'JavaScript',
      'Chrome Extension',
      'OpenAI API',
      'Gemini API',
    ],
    links: [
      {
        label: 'Chrome Web Store',
        href: 'https://chromewebstore.google.com/detail/leetwhisper-ai-coding-men/eghonmghogmafopcibkjjlbdeghkibhd',
        kind: 'store',
      },
    ],
  },

  {
    index: '02',
    title: 'Gemini Desk',
    tagline: 'Web workspace for Gemini CLI',
    description:
      'Chat-based interface for Gemini CLI with project workspaces, context switching, persistent conversations, and syntax-highlighted code rendering.',
    stack: [
      'React',
      'TypeScript',
      'Node.js',
      'SQLite',
    ],
    links: [
      {
        label: 'GitHub',
        href: 'https://github.com/sushant66/gemini-cli-ui',
        kind: 'github',
      },
    ],
  },

  {
    index: '03',
    title: 'Automatic Helmet Detection',
    tagline: 'Real-time computer vision · IEEE',
    description:
      'Real-time YOLOv4 system for detecting helmet violations and identifying vehicle license plates for automated traffic enforcement. Published in IEEE.',
    stack: [
      'YOLOv4',
      'Python',
      'Computer Vision',
      'Deep Learning',
    ],
    links: [
      {
        label: 'IEEE',
        href: 'https://ieeexplore.ieee.org/document/9579898',
        kind: 'external',
      },
      {
        label: 'GitHub',
        href: 'https://github.com/sushant66/Helmet_Detection',
        kind: 'github',
      },
    ],
  },

  {
    index: '04',
    title: 'Blockchain Voting',
    tagline: 'Decentralized e-voting system',
    description:
      'Voting system built on Ethereum using Solidity smart contracts, hardware-based voter interaction, and a real-time results dashboard.',
    stack: [
      'Ethereum',
      'Solidity',
      'Python',
      'ESP32',
    ],
    links: [
      {
        label: 'GitHub',
        href: 'https://github.com/sushant66/Project_Blockchain',
        kind: 'github',
      },
    ],
  },
];


export type StackGroup = {
  label: string;
  items: {
    name: string;
    icon?: string; // devicon class
    img?: string; // raster logo url
    si?: string; // brand-icon key (Simple Icons / inline path), rendered in ink
  }[];
};


export const stack: StackGroup[] = [
  {
    label: 'Languages',
    items: [
      { name: 'Python', icon: 'devicon-python-plain colored' },
      { name: 'JavaScript', icon: 'devicon-javascript-plain colored' },
      { name: 'SQL' },
      { name: 'HTML', icon: 'devicon-html5-plain colored' },
      { name: 'CSS', icon: 'devicon-css3-plain colored' },
    ],
  },

  {
    label: 'Frontend',
    items: [
      { name: 'React', icon: 'devicon-react-original colored' },
      { name: 'Vite', icon: 'devicon-vitejs-plain colored' },
      { name: 'Next.js', icon: 'devicon-nextjs-plain' },
    ],
  },

  {
    label: 'Backend',
    items: [
      { name: 'FastAPI', icon: 'devicon-fastapi-plain colored' },
      { name: 'Flask', icon: 'devicon-flask-original' },
      { name: 'Django', icon: 'devicon-django-plain colored' },
      { name: 'Node.js', icon: 'devicon-nodejs-plain colored' },
    ],
  },

  {
    label: 'Systems',
    items: [
      { name: 'Kafka', icon: 'devicon-apachekafka-original' },
      { name: 'Redis', icon: 'devicon-redis-plain colored' },
      { name: 'Celery', si: 'celery' },
      { name: 'RabbitMQ', icon: 'devicon-rabbitmq-plain colored' },
    ],
  },

  {
    label: 'Cloud',
    items: [
      { name: 'AWS', icon: 'devicon-amazonwebservices-plain-wordmark colored' },
      { name: 'GCP', icon: 'devicon-googlecloud-plain colored' },
      { name: 'Docker', icon: 'devicon-docker-plain colored' },
      { name: 'Kubernetes', icon: 'devicon-kubernetes-plain colored' },
    ],
  },

  {
    label: 'AI / LLM',
    items: [
      { name: 'LangChain', si: 'langchain' },
      { name: 'LangGraph' },
      { name: 'RAG' },
      { name: 'OpenAI', si: 'openai' },
      { name: 'Claude', si: 'claude' },
    ],
  },

  {
    label: 'Databases',
    items: [
      { name: 'PostgreSQL', icon: 'devicon-postgresql-plain colored' },
      { name: 'MySQL', icon: 'devicon-mysql-plain colored' },
      { name: 'MongoDB', icon: 'devicon-mongodb-plain colored' },
    ],
  },
];


export const about = [
  'I’m a backend engineer who enjoys taking ambiguous product ideas and turning them into production systems. Over the past 5+ years, I’ve worked across high-scale e-commerce, intelligent document processing, data platforms, and AI-powered products.',

  'My work has ranged from order workflows handling 100k+ daily orders to document extraction systems and asynchronous AI pipelines processing thousands of conversations every day. I’m particularly interested in the engineering behind reliable AI products: orchestration, structured generation, async processing, and the backend systems that make them production-ready.',

  'I enjoy owning problems end-to-end: understanding the problem, designing the architecture, building the system, deploying it, and improving it from production feedback.',
];


export const socials = [
  {
    label: 'GitHub',
    href: 'https://github.com/sushant66',
    kind: 'github',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/sushant66',
    kind: 'linkedin',
  },
  {
    label: 'LeetCode',
    href: 'https://leetcode.com/sushant66',
    kind: 'leetcode',
  },
  {
    label: 'Email',
    href: 'mailto:kadam.sushant@yahoo.com',
    kind: 'email',
  },
] as const;