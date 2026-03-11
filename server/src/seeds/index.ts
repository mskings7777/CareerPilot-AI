import mongoose from 'mongoose';
import { Skill } from '../models/Skill';
import { CareerPath } from '../models/CareerPath';
import connectDB from '../config/database';

const skills = [
  // Programming
  { name: 'javascript', category: 'programming', demandLevel: 'high', relatedCareers: ['Full Stack Developer', 'Frontend Developer', 'Backend Developer'], relatedSkills: ['typescript', 'react', 'node.js'] },
  { name: 'typescript', category: 'programming', demandLevel: 'high', relatedCareers: ['Full Stack Developer', 'Frontend Developer', 'Backend Developer'], relatedSkills: ['javascript', 'react', 'angular'] },
  { name: 'python', category: 'programming', demandLevel: 'high', relatedCareers: ['Data Scientist', 'ML Engineer', 'Backend Developer'], relatedSkills: ['pandas', 'numpy', 'django'] },
  { name: 'java', category: 'programming', demandLevel: 'high', relatedCareers: ['Backend Developer', 'Android Developer', 'Enterprise Developer'], relatedSkills: ['spring', 'spring boot', 'kotlin'] },
  { name: 'c++', category: 'programming', demandLevel: 'medium', relatedCareers: ['Systems Programmer', 'Game Developer', 'Embedded Engineer'], relatedSkills: ['c#', 'rust'] },
  { name: 'go', category: 'programming', demandLevel: 'high', relatedCareers: ['Backend Developer', 'DevOps Engineer', 'Cloud Engineer'], relatedSkills: ['docker', 'kubernetes'] },
  { name: 'rust', category: 'programming', demandLevel: 'medium', relatedCareers: ['Systems Programmer', 'Backend Developer'], relatedSkills: ['c++', 'go'] },
  { name: 'sql', category: 'programming', demandLevel: 'high', relatedCareers: ['Data Analyst', 'Backend Developer', 'Database Administrator'], relatedSkills: ['postgresql', 'mysql'] },
  { name: 'html', category: 'programming', demandLevel: 'high', relatedCareers: ['Frontend Developer', 'Full Stack Developer'], relatedSkills: ['css', 'javascript'] },
  { name: 'css', category: 'programming', demandLevel: 'high', relatedCareers: ['Frontend Developer', 'Full Stack Developer'], relatedSkills: ['html', 'tailwind', 'bootstrap'] },
  { name: 'r', category: 'programming', demandLevel: 'medium', relatedCareers: ['Data Scientist', 'Data Analyst', 'Statistician'], relatedSkills: ['python', 'statistics'] },
  { name: 'bash', category: 'programming', demandLevel: 'medium', relatedCareers: ['DevOps Engineer', 'Systems Administrator'], relatedSkills: ['linux', 'shell scripting'] },
  { name: 'graphql', category: 'programming', demandLevel: 'medium', relatedCareers: ['Full Stack Developer', 'Backend Developer'], relatedSkills: ['javascript', 'node.js', 'react'] },
  { name: 'statistics', category: 'programming', demandLevel: 'high', relatedCareers: ['Data Scientist', 'Data Analyst', 'ML Engineer'], relatedSkills: ['python', 'r', 'machine learning'] },

  // Frameworks
  { name: 'react', category: 'framework', demandLevel: 'high', relatedCareers: ['Frontend Developer', 'Full Stack Developer'], relatedSkills: ['javascript', 'typescript', 'next.js'] },
  { name: 'angular', category: 'framework', demandLevel: 'medium', relatedCareers: ['Frontend Developer', 'Full Stack Developer'], relatedSkills: ['typescript', 'rxjs'] },
  { name: 'vue', category: 'framework', demandLevel: 'medium', relatedCareers: ['Frontend Developer', 'Full Stack Developer'], relatedSkills: ['javascript', 'nuxt'] },
  { name: 'next.js', category: 'framework', demandLevel: 'high', relatedCareers: ['Full Stack Developer', 'Frontend Developer'], relatedSkills: ['react', 'typescript'] },
  { name: 'node.js', category: 'framework', demandLevel: 'high', relatedCareers: ['Backend Developer', 'Full Stack Developer'], relatedSkills: ['express', 'javascript', 'typescript'] },
  { name: 'express', category: 'framework', demandLevel: 'high', relatedCareers: ['Backend Developer', 'Full Stack Developer'], relatedSkills: ['node.js', 'javascript'] },
  { name: 'django', category: 'framework', demandLevel: 'medium', relatedCareers: ['Backend Developer', 'Full Stack Developer'], relatedSkills: ['python'] },
  { name: 'spring boot', category: 'framework', demandLevel: 'high', relatedCareers: ['Backend Developer', 'Enterprise Developer'], relatedSkills: ['java', 'spring'] },
  { name: 'tailwind', category: 'framework', demandLevel: 'high', relatedCareers: ['Frontend Developer', 'Full Stack Developer'], relatedSkills: ['css', 'html', 'react'] },
  { name: 'fastapi', category: 'framework', demandLevel: 'medium', relatedCareers: ['Backend Developer', 'ML Engineer'], relatedSkills: ['python'] },
  { name: 'keras', category: 'framework', demandLevel: 'high', relatedCareers: ['ML Engineer', 'Data Scientist'], relatedSkills: ['tensorflow', 'python', 'deep learning'] },

  // Databases
  { name: 'postgresql', category: 'database', demandLevel: 'high', relatedCareers: ['Backend Developer', 'Data Engineer', 'Database Administrator'], relatedSkills: ['sql', 'mysql'] },
  { name: 'mongodb', category: 'database', demandLevel: 'high', relatedCareers: ['Backend Developer', 'Full Stack Developer'], relatedSkills: ['node.js', 'express'] },
  { name: 'redis', category: 'database', demandLevel: 'high', relatedCareers: ['Backend Developer', 'DevOps Engineer'], relatedSkills: ['node.js'] },
  { name: 'mysql', category: 'database', demandLevel: 'medium', relatedCareers: ['Backend Developer', 'Database Administrator'], relatedSkills: ['sql', 'postgresql'] },
  { name: 'elasticsearch', category: 'database', demandLevel: 'medium', relatedCareers: ['Backend Developer', 'Data Engineer'], relatedSkills: ['node.js', 'python'] },

  // Cloud
  { name: 'aws', category: 'cloud', demandLevel: 'high', relatedCareers: ['Cloud Engineer', 'DevOps Engineer', 'Solutions Architect'], relatedSkills: ['docker', 'kubernetes', 'terraform'] },
  { name: 'azure', category: 'cloud', demandLevel: 'high', relatedCareers: ['Cloud Engineer', 'DevOps Engineer'], relatedSkills: ['docker', 'kubernetes'] },
  { name: 'google cloud', category: 'cloud', demandLevel: 'medium', relatedCareers: ['Cloud Engineer', 'Data Engineer'], relatedSkills: ['docker', 'kubernetes'] },

  // DevOps
  { name: 'docker', category: 'devops', demandLevel: 'high', relatedCareers: ['DevOps Engineer', 'Cloud Engineer', 'Backend Developer'], relatedSkills: ['kubernetes', 'linux'] },
  { name: 'kubernetes', category: 'devops', demandLevel: 'high', relatedCareers: ['DevOps Engineer', 'Cloud Engineer'], relatedSkills: ['docker', 'aws'] },
  { name: 'terraform', category: 'devops', demandLevel: 'high', relatedCareers: ['DevOps Engineer', 'Cloud Engineer'], relatedSkills: ['aws', 'docker'] },
  { name: 'ci/cd', category: 'devops', demandLevel: 'high', relatedCareers: ['DevOps Engineer', 'Backend Developer'], relatedSkills: ['github actions', 'jenkins'] },
  { name: 'git', category: 'devops', demandLevel: 'high', relatedCareers: ['Full Stack Developer', 'Backend Developer', 'Frontend Developer'], relatedSkills: ['github', 'gitlab'] },
  { name: 'linux', category: 'devops', demandLevel: 'high', relatedCareers: ['DevOps Engineer', 'Systems Administrator', 'Backend Developer'], relatedSkills: ['bash', 'docker'] },
  { name: 'ansible', category: 'devops', demandLevel: 'medium', relatedCareers: ['DevOps Engineer', 'Cloud Engineer'], relatedSkills: ['terraform', 'linux', 'python'] },
  { name: 'prometheus', category: 'devops', demandLevel: 'medium', relatedCareers: ['DevOps Engineer', 'SRE'], relatedSkills: ['grafana', 'kubernetes'] },
  { name: 'grafana', category: 'devops', demandLevel: 'medium', relatedCareers: ['DevOps Engineer', 'SRE'], relatedSkills: ['prometheus', 'kubernetes'] },

  // Data Science / AI-ML
  { name: 'pandas', category: 'data-science', demandLevel: 'high', relatedCareers: ['Data Scientist', 'Data Analyst', 'ML Engineer'], relatedSkills: ['python', 'numpy'] },
  { name: 'numpy', category: 'data-science', demandLevel: 'high', relatedCareers: ['Data Scientist', 'ML Engineer'], relatedSkills: ['python', 'pandas'] },
  { name: 'scikit-learn', category: 'data-science', demandLevel: 'high', relatedCareers: ['Data Scientist', 'ML Engineer'], relatedSkills: ['python', 'pandas'] },
  { name: 'tensorflow', category: 'ai-ml', demandLevel: 'high', relatedCareers: ['ML Engineer', 'AI Researcher', 'Data Scientist'], relatedSkills: ['python', 'keras'] },
  { name: 'pytorch', category: 'ai-ml', demandLevel: 'high', relatedCareers: ['ML Engineer', 'AI Researcher'], relatedSkills: ['python', 'deep learning'] },
  { name: 'machine learning', category: 'data-science', demandLevel: 'high', relatedCareers: ['ML Engineer', 'Data Scientist', 'AI Researcher'], relatedSkills: ['python', 'scikit-learn', 'tensorflow'] },
  { name: 'deep learning', category: 'ai-ml', demandLevel: 'high', relatedCareers: ['ML Engineer', 'AI Researcher'], relatedSkills: ['tensorflow', 'pytorch', 'python'] },
  { name: 'nlp', category: 'ai-ml', demandLevel: 'high', relatedCareers: ['NLP Engineer', 'ML Engineer', 'AI Researcher'], relatedSkills: ['python', 'transformers'] },
  { name: 'tableau', category: 'data-science', demandLevel: 'medium', relatedCareers: ['Data Analyst', 'Business Analyst'], relatedSkills: ['sql', 'power bi'] },
  { name: 'power bi', category: 'data-science', demandLevel: 'medium', relatedCareers: ['Data Analyst', 'Business Analyst'], relatedSkills: ['sql', 'tableau'] },
  { name: 'data visualization', category: 'data-science', demandLevel: 'high', relatedCareers: ['Data Analyst', 'Data Scientist'], relatedSkills: ['tableau', 'power bi', 'matplotlib'] },

  // Testing
  { name: 'jest', category: 'testing', demandLevel: 'high', relatedCareers: ['Frontend Developer', 'Full Stack Developer'], relatedSkills: ['javascript', 'react'] },
  { name: 'cypress', category: 'testing', demandLevel: 'medium', relatedCareers: ['QA Engineer', 'Frontend Developer'], relatedSkills: ['javascript', 'selenium'] },
  { name: 'selenium', category: 'testing', demandLevel: 'medium', relatedCareers: ['QA Engineer', 'Test Automation Engineer'], relatedSkills: ['python', 'java'] },

  // Mobile
  { name: 'react native', category: 'mobile', demandLevel: 'high', relatedCareers: ['Mobile Developer', 'Full Stack Developer'], relatedSkills: ['react', 'javascript'] },
  { name: 'flutter', category: 'mobile', demandLevel: 'high', relatedCareers: ['Mobile Developer'], relatedSkills: ['dart'] },
  { name: 'swift', category: 'mobile', demandLevel: 'medium', relatedCareers: ['iOS Developer', 'Mobile Developer'], relatedSkills: ['ios', 'xcode'] },
  { name: 'kotlin', category: 'mobile', demandLevel: 'medium', relatedCareers: ['Android Developer', 'Mobile Developer'], relatedSkills: ['java', 'android'] },

  // Security
  { name: 'owasp', category: 'security', demandLevel: 'high', relatedCareers: ['Security Engineer', 'Full Stack Developer'], relatedSkills: ['penetration testing', 'web security'] },
  { name: 'encryption', category: 'security', demandLevel: 'medium', relatedCareers: ['Security Engineer', 'Backend Developer'], relatedSkills: ['owasp', 'authentication'] },

  // Soft Skills
  { name: 'agile', category: 'soft-skill', demandLevel: 'high', relatedCareers: ['Project Manager', 'Scrum Master', 'Product Manager'], relatedSkills: ['scrum', 'project management'] },
  { name: 'scrum', category: 'soft-skill', demandLevel: 'high', relatedCareers: ['Scrum Master', 'Project Manager'], relatedSkills: ['agile', 'project management'] },
  { name: 'leadership', category: 'soft-skill', demandLevel: 'high', relatedCareers: ['Engineering Manager', 'Tech Lead', 'CTO'], relatedSkills: ['communication', 'project management'] },
  { name: 'communication', category: 'soft-skill', demandLevel: 'high', relatedCareers: ['Product Manager', 'Project Manager', 'Tech Lead'], relatedSkills: ['leadership', 'teamwork'] },
  { name: 'system design', category: 'soft-skill', demandLevel: 'high', relatedCareers: ['Full Stack Developer', 'Backend Developer', 'Solutions Architect'], relatedSkills: ['aws', 'docker', 'kubernetes'] },
];

const careerPaths = [
  {
    title: 'Full Stack Developer',
    slug: 'full-stack-developer',
    description: 'Build complete web applications from frontend to backend. Full stack developers are versatile engineers who can work on all layers of a web application, from UI design to server-side logic and database management.',
    category: 'Software Engineering',
    requiredSkills: ['javascript', 'typescript', 'react', 'node.js', 'express', 'mongodb', 'git', 'html', 'css'],
    optionalSkills: ['next.js', 'tailwind', 'postgresql', 'docker', 'aws', 'redis', 'graphql'],
    averageSalary: { min: 80000, max: 150000, currency: 'USD' },
    demandLevel: 'high',
    growthOutlook: 'Strong growth expected as companies continue to build web applications. Remote opportunities abundant.',
    learningResources: [
      { title: 'The Odin Project', url: 'https://www.theodinproject.com', type: 'course', provider: 'The Odin Project', isFree: true },
      { title: 'Full Stack Open', url: 'https://fullstackopen.com', type: 'course', provider: 'University of Helsinki', isFree: true },
      { title: 'Meta Full-Stack Engineer Certificate', url: 'https://www.coursera.org/professional-certificates/meta-front-end-developer', type: 'certification', provider: 'Meta/Coursera', isFree: false },
      { title: 'JavaScript: Understanding the Weird Parts', url: 'https://www.udemy.com/course/understand-javascript/', type: 'course', provider: 'Udemy', isFree: false },
      { title: 'React Official Tutorial', url: 'https://react.dev/learn', type: 'tutorial', provider: 'React', isFree: true },
      { title: 'Node.js Official Guides', url: 'https://nodejs.org/en/learn', type: 'tutorial', provider: 'Node.js', isFree: true },
      { title: 'MongoDB University', url: 'https://learn.mongodb.com', type: 'course', provider: 'MongoDB', isFree: true },
      { title: 'Docker Getting Started', url: 'https://docs.docker.com/get-started/', type: 'tutorial', provider: 'Docker', isFree: true },
    ],
    roadmap: [
      { phase: 1, title: 'Web Fundamentals', description: 'Learn HTML, CSS, and JavaScript basics', skills: ['html', 'css', 'javascript'], durationWeeks: 4 },
      { phase: 2, title: 'Frontend Framework', description: 'Learn React and TypeScript for building modern UIs', skills: ['react', 'typescript', 'tailwind'], durationWeeks: 6 },
      { phase: 3, title: 'Backend Development', description: 'Build APIs with Node.js and Express', skills: ['node.js', 'express', 'mongodb'], durationWeeks: 6 },
      { phase: 4, title: 'DevOps & Deployment', description: 'Learn deployment, Docker, and CI/CD', skills: ['git', 'docker', 'aws', 'ci/cd'], durationWeeks: 4 },
      { phase: 5, title: 'Advanced Topics', description: 'Next.js, GraphQL, testing, and system design', skills: ['next.js', 'jest', 'redis'], durationWeeks: 4 },
    ],
  },
  {
    title: 'Frontend Developer',
    slug: 'frontend-developer',
    description: 'Specialize in building user interfaces and web experiences. Frontend developers create the visual and interactive elements that users interact with directly.',
    category: 'Software Engineering',
    requiredSkills: ['javascript', 'typescript', 'react', 'html', 'css', 'git'],
    optionalSkills: ['next.js', 'tailwind', 'vue', 'angular', 'jest', 'cypress', 'figma'],
    averageSalary: { min: 70000, max: 140000, currency: 'USD' },
    demandLevel: 'high',
    growthOutlook: 'Consistent demand as user experience becomes increasingly important.',
    learningResources: [
      { title: 'Frontend Masters', url: 'https://frontendmasters.com', type: 'course', provider: 'Frontend Masters', isFree: false },
      { title: 'freeCodeCamp', url: 'https://www.freecodecamp.org', type: 'course', provider: 'freeCodeCamp', isFree: true },
      { title: 'CSS for JavaScript Developers', url: 'https://css-for-js.dev', type: 'course', provider: 'Josh W Comeau', isFree: false },
      { title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/', type: 'tutorial', provider: 'TypeScript', isFree: true },
      { title: 'React Official Tutorial', url: 'https://react.dev/learn', type: 'tutorial', provider: 'React', isFree: true },
      { title: 'Testing JavaScript with Jest', url: 'https://jestjs.io/docs/getting-started', type: 'tutorial', provider: 'Jest', isFree: true },
    ],
    roadmap: [
      { phase: 1, title: 'HTML & CSS Mastery', description: 'Build responsive layouts with modern CSS', skills: ['html', 'css', 'tailwind'], durationWeeks: 4 },
      { phase: 2, title: 'JavaScript Deep Dive', description: 'Master JavaScript and TypeScript', skills: ['javascript', 'typescript'], durationWeeks: 4 },
      { phase: 3, title: 'React Ecosystem', description: 'Build applications with React and its ecosystem', skills: ['react', 'next.js'], durationWeeks: 6 },
      { phase: 4, title: 'Testing & Performance', description: 'Write tests and optimize performance', skills: ['jest', 'cypress'], durationWeeks: 3 },
    ],
  },
  {
    title: 'Backend Developer',
    slug: 'backend-developer',
    description: 'Design and build server-side applications, APIs, and database systems. Backend developers handle data processing, business logic, and system architecture.',
    category: 'Software Engineering',
    requiredSkills: ['javascript', 'node.js', 'express', 'mongodb', 'postgresql', 'git', 'sql'],
    optionalSkills: ['typescript', 'docker', 'redis', 'aws', 'python', 'go', 'kubernetes'],
    averageSalary: { min: 85000, max: 160000, currency: 'USD' },
    demandLevel: 'high',
    growthOutlook: 'Strong demand as APIs and microservices architecture grows.',
    learningResources: [
      { title: 'Node.js Design Patterns', url: 'https://www.nodejsdesignpatterns.com', type: 'book', provider: 'Packt', isFree: false },
      { title: 'Node.js Official Guides', url: 'https://nodejs.org/en/learn', type: 'tutorial', provider: 'Node.js', isFree: true },
      { title: 'PostgreSQL Tutorial', url: 'https://www.postgresqltutorial.com', type: 'tutorial', provider: 'PostgreSQL Tutorial', isFree: true },
      { title: 'MongoDB University', url: 'https://learn.mongodb.com', type: 'course', provider: 'MongoDB', isFree: true },
      { title: 'Docker Getting Started', url: 'https://docs.docker.com/get-started/', type: 'tutorial', provider: 'Docker', isFree: true },
      { title: 'AWS Cloud Practitioner', url: 'https://aws.amazon.com/certification/certified-cloud-practitioner/', type: 'certification', provider: 'AWS', isFree: false },
    ],
    roadmap: [
      { phase: 1, title: 'Server Fundamentals', description: 'Learn Node.js and Express', skills: ['node.js', 'express', 'javascript'], durationWeeks: 4 },
      { phase: 2, title: 'Databases', description: 'Master SQL and NoSQL databases', skills: ['mongodb', 'postgresql', 'sql', 'redis'], durationWeeks: 5 },
      { phase: 3, title: 'API Design', description: 'Build RESTful and GraphQL APIs', skills: ['typescript'], durationWeeks: 4 },
      { phase: 4, title: 'Infrastructure', description: 'Docker, cloud deployment, and monitoring', skills: ['docker', 'aws', 'linux', 'ci/cd'], durationWeeks: 5 },
    ],
  },
  {
    title: 'Data Scientist',
    slug: 'data-scientist',
    description: 'Extract insights from data using statistical analysis, machine learning, and visualization. Data scientists solve complex business problems with data-driven approaches.',
    category: 'Data & Analytics',
    requiredSkills: ['python', 'pandas', 'numpy', 'scikit-learn', 'sql', 'machine learning', 'statistics'],
    optionalSkills: ['tensorflow', 'pytorch', 'tableau', 'power bi', 'deep learning', 'nlp', 'r'],
    averageSalary: { min: 90000, max: 170000, currency: 'USD' },
    demandLevel: 'high',
    growthOutlook: 'Rapidly growing field as organizations become more data-driven.',
    learningResources: [
      { title: 'Andrew Ng Machine Learning', url: 'https://www.coursera.org/learn/machine-learning', type: 'course', provider: 'Stanford/Coursera', isFree: false },
      { title: 'Kaggle Learn', url: 'https://www.kaggle.com/learn', type: 'tutorial', provider: 'Kaggle', isFree: true },
      { title: 'Python for Data Science Handbook', url: 'https://jakevdp.github.io/PythonDataScienceHandbook/', type: 'book', provider: 'Jake VanderPlas', isFree: true },
      { title: 'Statistics with Python Specialization', url: 'https://www.coursera.org/specializations/statistics-with-python', type: 'course', provider: 'University of Michigan/Coursera', isFree: false },
      { title: 'Pandas Documentation', url: 'https://pandas.pydata.org/docs/getting_started/', type: 'tutorial', provider: 'Pandas', isFree: true },
      { title: 'Scikit-Learn Tutorials', url: 'https://scikit-learn.org/stable/tutorial/', type: 'tutorial', provider: 'Scikit-Learn', isFree: true },
      { title: 'Deep Learning Specialization', url: 'https://www.coursera.org/specializations/deep-learning', type: 'course', provider: 'DeepLearning.AI', isFree: false },
      { title: 'Tableau Public Training', url: 'https://public.tableau.com/app/resources/learn', type: 'tutorial', provider: 'Tableau', isFree: true },
    ],
    roadmap: [
      { phase: 1, title: 'Python & Math', description: 'Python programming, statistics, and linear algebra', skills: ['python', 'statistics'], durationWeeks: 6 },
      { phase: 2, title: 'Data Analysis', description: 'Data manipulation and visualization', skills: ['pandas', 'numpy', 'sql', 'tableau'], durationWeeks: 5 },
      { phase: 3, title: 'Machine Learning', description: 'Classical ML algorithms and model evaluation', skills: ['scikit-learn', 'machine learning'], durationWeeks: 8 },
      { phase: 4, title: 'Deep Learning & Specialization', description: 'Neural networks and domain specialization', skills: ['tensorflow', 'pytorch', 'deep learning', 'nlp'], durationWeeks: 8 },
    ],
  },
  {
    title: 'ML Engineer',
    slug: 'ml-engineer',
    description: 'Design, build, and deploy machine learning systems at scale. ML engineers bridge the gap between data science and production software engineering.',
    category: 'AI & Machine Learning',
    requiredSkills: ['python', 'machine learning', 'tensorflow', 'docker', 'git', 'sql'],
    optionalSkills: ['pytorch', 'kubernetes', 'aws', 'deep learning', 'nlp', 'scikit-learn', 'pandas', 'go'],
    averageSalary: { min: 110000, max: 200000, currency: 'USD' },
    demandLevel: 'high',
    growthOutlook: 'Explosive growth driven by AI adoption across industries.',
    learningResources: [
      { title: 'Made With ML', url: 'https://madewithml.com', type: 'course', provider: 'Made With ML', isFree: true },
      { title: 'ML Engineering for Production (MLOps)', url: 'https://www.coursera.org/specializations/machine-learning-engineering-for-production-mlops', type: 'certification', provider: 'DeepLearning.AI', isFree: false },
      { title: 'TensorFlow Developer Certificate', url: 'https://www.tensorflow.org/certificate', type: 'certification', provider: 'TensorFlow', isFree: false },
      { title: 'PyTorch Tutorials', url: 'https://pytorch.org/tutorials/', type: 'tutorial', provider: 'PyTorch', isFree: true },
      { title: 'Docker for Data Science', url: 'https://docs.docker.com/get-started/', type: 'tutorial', provider: 'Docker', isFree: true },
      { title: 'Hugging Face NLP Course', url: 'https://huggingface.co/learn/nlp-course', type: 'course', provider: 'Hugging Face', isFree: true },
      { title: 'Scikit-Learn Tutorials', url: 'https://scikit-learn.org/stable/tutorial/', type: 'tutorial', provider: 'Scikit-Learn', isFree: true },
    ],
    roadmap: [
      { phase: 1, title: 'Foundations', description: 'Python, math, and ML fundamentals', skills: ['python', 'machine learning', 'scikit-learn'], durationWeeks: 6 },
      { phase: 2, title: 'Deep Learning', description: 'Neural networks with TensorFlow and PyTorch', skills: ['tensorflow', 'pytorch', 'deep learning'], durationWeeks: 8 },
      { phase: 3, title: 'MLOps', description: 'Model deployment, monitoring, and pipelines', skills: ['docker', 'kubernetes', 'aws', 'ci/cd'], durationWeeks: 6 },
      { phase: 4, title: 'Specialization', description: 'NLP, Computer Vision, or Recommender Systems', skills: ['nlp'], durationWeeks: 6 },
    ],
  },
  {
    title: 'DevOps Engineer',
    slug: 'devops-engineer',
    description: 'Automate infrastructure, manage deployments, and ensure system reliability. DevOps engineers streamline the software development lifecycle.',
    category: 'Infrastructure',
    requiredSkills: ['linux', 'docker', 'kubernetes', 'aws', 'ci/cd', 'git', 'terraform'],
    optionalSkills: ['python', 'go', 'ansible', 'prometheus', 'grafana', 'azure', 'jenkins'],
    averageSalary: { min: 95000, max: 170000, currency: 'USD' },
    demandLevel: 'high',
    growthOutlook: 'High demand as cloud adoption and automation continue to grow.',
    learningResources: [
      { title: 'AWS Certified Solutions Architect', url: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/', type: 'certification', provider: 'AWS', isFree: false },
      { title: 'CKA Certification', url: 'https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/', type: 'certification', provider: 'Linux Foundation', isFree: false },
      { title: 'Linux Command Line Basics', url: 'https://linuxcommand.org', type: 'tutorial', provider: 'LinuxCommand.org', isFree: true },
      { title: 'Docker Mastery', url: 'https://www.udemy.com/course/docker-mastery/', type: 'course', provider: 'Udemy', isFree: false },
      { title: 'Terraform Up & Running', url: 'https://www.terraformupandrunning.com', type: 'book', provider: "O'Reilly", isFree: false },
      { title: 'Kubernetes Documentation', url: 'https://kubernetes.io/docs/tutorials/', type: 'tutorial', provider: 'Kubernetes', isFree: true },
      { title: 'Prometheus Getting Started', url: 'https://prometheus.io/docs/prometheus/latest/getting_started/', type: 'tutorial', provider: 'Prometheus', isFree: true },
    ],
    roadmap: [
      { phase: 1, title: 'Linux & Networking', description: 'Master Linux administration and networking', skills: ['linux', 'bash'], durationWeeks: 4 },
      { phase: 2, title: 'Containerization', description: 'Docker and container orchestration', skills: ['docker', 'kubernetes'], durationWeeks: 5 },
      { phase: 3, title: 'Cloud & IaC', description: 'AWS/Azure and Infrastructure as Code', skills: ['aws', 'terraform'], durationWeeks: 6 },
      { phase: 4, title: 'CI/CD & Monitoring', description: 'Build pipelines and observability', skills: ['ci/cd', 'prometheus', 'grafana', 'git'], durationWeeks: 5 },
    ],
  },
  {
    title: 'Data Analyst',
    slug: 'data-analyst',
    description: 'Analyze data to discover trends and provide actionable business insights. Data analysts use SQL, visualization tools, and statistics to inform decisions.',
    category: 'Data & Analytics',
    requiredSkills: ['sql', 'python', 'tableau', 'statistics'],
    optionalSkills: ['power bi', 'pandas', 'r', 'excel'],
    averageSalary: { min: 55000, max: 100000, currency: 'USD' },
    demandLevel: 'high',
    growthOutlook: 'Strong demand across all industries as data-driven decision making becomes standard.',
    learningResources: [
      { title: 'Google Data Analytics Certificate', url: 'https://www.coursera.org/professional-certificates/google-data-analytics', type: 'certification', provider: 'Google/Coursera', isFree: false },
      { title: 'SQL for Data Analysis', url: 'https://mode.com/sql-tutorial/', type: 'tutorial', provider: 'Mode Analytics', isFree: true },
      { title: 'Python for Everybody', url: 'https://www.py4e.com', type: 'course', provider: 'University of Michigan', isFree: true },
      { title: 'Tableau Public Training', url: 'https://public.tableau.com/app/resources/learn', type: 'tutorial', provider: 'Tableau', isFree: true },
      { title: 'Pandas Documentation', url: 'https://pandas.pydata.org/docs/getting_started/', type: 'tutorial', provider: 'Pandas', isFree: true },
      { title: 'Khan Academy Statistics', url: 'https://www.khanacademy.org/math/statistics-probability', type: 'course', provider: 'Khan Academy', isFree: true },
    ],
    roadmap: [
      { phase: 1, title: 'SQL & Databases', description: 'Master SQL querying and data manipulation', skills: ['sql'], durationWeeks: 4 },
      { phase: 2, title: 'Python for Analysis', description: 'Data analysis with Python and pandas', skills: ['python', 'pandas'], durationWeeks: 5 },
      { phase: 3, title: 'Visualization', description: 'Create compelling visualizations', skills: ['tableau', 'power bi'], durationWeeks: 4 },
      { phase: 4, title: 'Statistics', description: 'Statistical analysis and hypothesis testing', skills: ['statistics'], durationWeeks: 4 },
    ],
  },
  {
    title: 'Mobile Developer',
    slug: 'mobile-developer',
    description: 'Build native and cross-platform mobile applications for iOS and Android. Mobile developers create responsive, performant apps for smartphones and tablets.',
    category: 'Software Engineering',
    requiredSkills: ['javascript', 'react native', 'git'],
    optionalSkills: ['typescript', 'flutter', 'swift', 'kotlin', 'ios', 'android'],
    averageSalary: { min: 80000, max: 155000, currency: 'USD' },
    demandLevel: 'high',
    growthOutlook: 'Steady demand as mobile usage continues to dominate.',
    learningResources: [
      { title: 'React Native Documentation', url: 'https://reactnative.dev', type: 'tutorial', provider: 'Meta', isFree: true },
      { title: 'React Official Tutorial', url: 'https://react.dev/learn', type: 'tutorial', provider: 'React', isFree: true },
      { title: 'Flutter Documentation', url: 'https://docs.flutter.dev', type: 'tutorial', provider: 'Google', isFree: true },
      { title: 'JavaScript: Understanding the Weird Parts', url: 'https://www.udemy.com/course/understand-javascript/', type: 'course', provider: 'Udemy', isFree: false },
      { title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/', type: 'tutorial', provider: 'TypeScript', isFree: true },
    ],
    roadmap: [
      { phase: 1, title: 'JavaScript & React', description: 'Master JavaScript and React fundamentals', skills: ['javascript', 'react'], durationWeeks: 6 },
      { phase: 2, title: 'React Native', description: 'Build cross-platform mobile apps', skills: ['react native', 'typescript'], durationWeeks: 6 },
      { phase: 3, title: 'Native Platforms', description: 'Learn iOS or Android specifics', skills: ['swift', 'kotlin'], durationWeeks: 6 },
    ],
  },
  {
    title: 'Cloud Solutions Architect',
    slug: 'cloud-solutions-architect',
    description: 'Design and oversee cloud computing strategies. Solutions architects create the blueprint for cloud infrastructure and ensure systems are scalable, secure, and cost-effective.',
    category: 'Infrastructure',
    requiredSkills: ['aws', 'docker', 'kubernetes', 'terraform', 'linux'],
    optionalSkills: ['azure', 'google cloud', 'python', 'go', 'ci/cd'],
    averageSalary: { min: 120000, max: 200000, currency: 'USD' },
    demandLevel: 'high',
    growthOutlook: 'Excellent growth as cloud migration accelerates globally.',
    learningResources: [
      { title: 'AWS Solutions Architect Professional', url: 'https://aws.amazon.com/certification/certified-solutions-architect-professional/', type: 'certification', provider: 'AWS', isFree: false },
      { title: 'Docker Mastery', url: 'https://www.udemy.com/course/docker-mastery/', type: 'course', provider: 'Udemy', isFree: false },
      { title: 'Kubernetes Documentation', url: 'https://kubernetes.io/docs/tutorials/', type: 'tutorial', provider: 'Kubernetes', isFree: true },
      { title: 'Terraform Up & Running', url: 'https://www.terraformupandrunning.com', type: 'book', provider: "O'Reilly", isFree: false },
      { title: 'Linux Command Line Basics', url: 'https://linuxcommand.org', type: 'tutorial', provider: 'LinuxCommand.org', isFree: true },
      { title: 'Azure Fundamentals', url: 'https://learn.microsoft.com/en-us/certifications/azure-fundamentals/', type: 'certification', provider: 'Microsoft', isFree: false },
    ],
    roadmap: [
      { phase: 1, title: 'Cloud Fundamentals', description: 'Core cloud concepts and services', skills: ['aws', 'linux'], durationWeeks: 6 },
      { phase: 2, title: 'Architecture Patterns', description: 'Design scalable distributed systems', skills: ['docker', 'kubernetes'], durationWeeks: 6 },
      { phase: 3, title: 'Infrastructure as Code', description: 'Automate infrastructure provisioning', skills: ['terraform', 'ci/cd'], durationWeeks: 5 },
      { phase: 4, title: 'Multi-Cloud & Security', description: 'Multi-cloud strategies and security', skills: ['azure', 'google cloud'], durationWeeks: 5 },
    ],
  },
  {
    title: 'QA / Test Automation Engineer',
    slug: 'qa-test-automation-engineer',
    description: 'Ensure software quality through automated testing strategies. QA engineers design test frameworks and automate regression testing.',
    category: 'Quality Assurance',
    requiredSkills: ['selenium', 'javascript', 'git'],
    optionalSkills: ['cypress', 'jest', 'python', 'java', 'ci/cd'],
    averageSalary: { min: 65000, max: 130000, currency: 'USD' },
    demandLevel: 'medium',
    growthOutlook: 'Growing demand as shift-left testing practices become mainstream.',
    learningResources: [
      { title: 'Test Automation University', url: 'https://testautomationu.applitools.com', type: 'course', provider: 'Applitools', isFree: true },
      { title: 'Selenium Documentation', url: 'https://www.selenium.dev/documentation/', type: 'tutorial', provider: 'Selenium', isFree: true },
      { title: 'Cypress Documentation', url: 'https://docs.cypress.io', type: 'tutorial', provider: 'Cypress', isFree: true },
      { title: 'Testing JavaScript with Jest', url: 'https://jestjs.io/docs/getting-started', type: 'tutorial', provider: 'Jest', isFree: true },
      { title: 'JavaScript: Understanding the Weird Parts', url: 'https://www.udemy.com/course/understand-javascript/', type: 'course', provider: 'Udemy', isFree: false },
    ],
    roadmap: [
      { phase: 1, title: 'Testing Fundamentals', description: 'Test types, strategies, and manual testing', skills: ['git'], durationWeeks: 3 },
      { phase: 2, title: 'Programming', description: 'JavaScript or Python for test automation', skills: ['javascript', 'python'], durationWeeks: 4 },
      { phase: 3, title: 'Automation Frameworks', description: 'Selenium, Cypress, and Jest', skills: ['selenium', 'cypress', 'jest'], durationWeeks: 6 },
      { phase: 4, title: 'CI/CD Integration', description: 'Integrate tests into deployment pipelines', skills: ['ci/cd'], durationWeeks: 3 },
    ],
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('Seeding database...');

    // Clear existing data
    await Skill.deleteMany({});
    await CareerPath.deleteMany({});

    // Insert skills
    await Skill.insertMany(skills);
    console.log(`Inserted ${skills.length} skills`);

    // Insert career paths
    await CareerPath.insertMany(careerPaths);
    console.log(`Inserted ${careerPaths.length} career paths`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
