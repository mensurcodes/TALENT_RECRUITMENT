-- =============================================================
-- TALENT RECRUITMENT — Sample Seed Data
-- Paste into Supabase SQL Editor after running recruitment_schema.sql
-- =============================================================

-- ---------------------------------------------------------------
-- RECRUITERS (3 companies)
-- ---------------------------------------------------------------
INSERT INTO public.recruiters (name, email, username, password, age, phone, company_name) VALUES
(
  'Sarah Chen',
  'sarah.chen@stripe.io',
  'recruiter_stripe',
  'demo1234',
  34,
  '+1-415-555-0101',
  'Stripe'
),
(
  'Marcus Williams',
  'marcus.w@openai.demo',
  'recruiter_openai',
  'demo1234',
  41,
  '+1-415-555-0202',
  'OpenAI'
),
(
  'Priya Patel',
  'priya.patel@vercel.demo',
  'recruiter_vercel',
  'demo1234',
  29,
  '+1-415-555-0303',
  'Vercel'
);

-- ---------------------------------------------------------------
-- APPLICANTS (3 — full_time + internship)
-- Login: username / demo1234
-- ---------------------------------------------------------------
INSERT INTO public.applicants (name, email, username, password, age, school_name, education_level, employment_type, github_url) VALUES
(
  'Alex Rivera',
  'alex.rivera@demo.com',
  'alex_r',
  'demo1234',
  26,
  'UC Berkeley',
  'BS Computer Science',
  'full_time',
  'https://github.com/torvalds'   -- public repo for demo purposes
),
(
  'Jordan Kim',
  'jordan.kim@demo.com',
  'jordan_k',
  'demo1234',
  24,
  'MIT',
  'MS Computer Science',
  'full_time',
  'https://github.com/gaearon'
),
(
  'Taylor Nguyen',
  'taylor.nguyen@demo.com',
  'taylor_n',
  'demo1234',
  21,
  'Stanford University',
  'BS Computer Science (Junior)',
  'internship',
  'https://github.com/sindresorhus'
);

-- ---------------------------------------------------------------
-- JOBS — 3 full_time + 1 internship
-- ---------------------------------------------------------------

-- Stripe: Full-Stack Software Engineer
INSERT INTO public.jobs (recruiter_id, recruiter_name, title, company_name, employment_type, description, us_work_auth, grading_rubric)
SELECT
  r.id,
  r.name,
  'Full-Stack Software Engineer',
  'Stripe',
  'full_time',
$$We are looking for a Full-Stack Software Engineer to join Stripe's Payments Platform team. You will build and maintain the infrastructure that processes billions of dollars in transactions daily.

Responsibilities:
• Design, build, and ship reliable full-stack features across Stripe's payments APIs and dashboard.
• Partner with product, design, and data teams to define technical requirements and architecture.
• Write clean, well-tested code in Ruby, Go, and TypeScript; our stack spans React frontends to distributed backend systems.
• Participate in on-call rotations and own the reliability of the systems your team builds.
• Mentor junior engineers and contribute to engineering standards and best practices.
• Conduct and participate in technical interviews to grow the team.

Requirements:
• 3+ years of experience building production web applications.
• Proficiency in at least one backend language (Ruby, Go, Python, or Java) and modern JavaScript/TypeScript.
• Experience designing and operating distributed systems at scale.
• Strong understanding of relational databases (PostgreSQL preferred) and data modeling.
• Familiarity with REST and GraphQL API design principles.
• Demonstrated ability to ship features independently with minimal supervision.

Nice to have:
• Experience with payments, financial infrastructure, or compliance-sensitive systems.
• Knowledge of PCI-DSS standards.
• Contributions to open-source projects.$$,
  'US Citizen / Green Card / Visa Sponsorship Available',
  'Technical depth (40 pts): Candidate demonstrates strong understanding of distributed systems, database design, and API architecture. Specific credit for experience with high-throughput, low-latency systems.
Communication (25 pts): Answers are structured, concise, and use concrete examples. Avoids vague generalities.
Ownership & reliability (20 pts): Shows evidence of owning systems end-to-end, handling incidents, and improving reliability.
Culture & collaboration (15 pts): Demonstrates teamwork, mentorship, and cross-functional collaboration.'
FROM public.recruiters r WHERE r.username = 'recruiter_stripe';

-- OpenAI: Machine Learning Engineer
INSERT INTO public.jobs (recruiter_id, recruiter_name, title, company_name, employment_type, description, us_work_auth, grading_rubric)
SELECT
  r.id,
  r.name,
  'Machine Learning Engineer — Inference',
  'OpenAI',
  'full_time',
$$OpenAI is hiring a Machine Learning Engineer to join the Inference team. You will work on the systems that serve OpenAI's models — including GPT-4, DALL·E, and Whisper — to millions of users globally.

Responsibilities:
• Optimize model serving pipelines to reduce latency and cost while maintaining quality.
• Collaborate with research teams to productionize new model architectures and inference techniques.
• Implement and evaluate quantization, batching, caching, and hardware-specific optimizations (CUDA kernels, TensorRT).
• Build tooling to monitor model performance, detect drift, and enable rapid iteration.
• Contribute to the design of distributed inference clusters and autoscaling strategies.
• Write internal technical documentation and share learnings across teams.

Requirements:
• 3+ years of experience in ML engineering, backend systems, or high-performance computing.
• Deep understanding of transformer architectures and the PyTorch / JAX ecosystem.
• Hands-on experience with GPU optimization (CUDA, Triton, or equivalent).
• Strong Python skills; proficiency in C++ is a plus.
• Familiarity with Kubernetes, Docker, and cloud infrastructure (AWS/GCP/Azure).
• Ability to read and understand ML research papers and translate them into engineering solutions.

Nice to have:
• Experience with quantization (INT8, FP8, GPTQ) or speculative decoding.
• Prior work on LLM serving frameworks (vLLM, TensorRT-LLM, TGI).
• Published research or open-source contributions in ML.$$,
  'US Citizen / Green Card required (no sponsorship at this time)',
  'ML fundamentals (35 pts): Demonstrates understanding of transformer internals, training vs. inference trade-offs, and optimization techniques. Credit for specific hands-on GPU work.
Systems thinking (30 pts): Shows ability to reason about latency, throughput, cost, and reliability of large-scale serving systems.
Problem-solving (20 pts): Uses structured reasoning, considers edge cases, and backs claims with data or benchmarks.
Communication & impact (15 pts): Explains complex ML concepts clearly to a mixed technical audience.'
FROM public.recruiters r WHERE r.username = 'recruiter_openai';

-- Vercel: Developer Experience Engineer
INSERT INTO public.jobs (recruiter_id, recruiter_name, title, company_name, employment_type, description, us_work_auth, grading_rubric)
SELECT
  r.id,
  r.name,
  'Developer Experience Engineer',
  'Vercel',
  'full_time',
$$Vercel is looking for a Developer Experience (DX) Engineer to help us build the best developer platform in the world. You will sit at the intersection of product engineering, documentation, and community — making millions of developers successful with Next.js and Vercel.

Responsibilities:
• Build polished demo applications, starter templates, and interactive code examples showcasing Vercel and Next.js features.
• Write clear, accurate technical documentation, guides, and blog posts for new platform features.
• Engage with the developer community through GitHub, Discord, Twitter, and conference talks.
• Identify pain points in the developer journey and collaborate with product teams to fix them.
• Triage and reproduce bugs reported by the community; write minimal reproductions for the engineering team.
• Build internal tooling to automate DX workflows and improve content pipelines.

Requirements:
• 2+ years of experience as a software engineer or technical writer.
• Deep familiarity with React, Next.js, and the modern JavaScript ecosystem (ESM, bundlers, Turbopack).
• Experience deploying and operating web applications on cloud platforms.
• Strong written communication skills — you can explain a complex concept clearly in a README.
• Empathy for developers at all skill levels.

Nice to have:
• Active presence in the open-source community (GitHub contributions, npm packages, blog).
• Experience with edge computing, streaming SSR, or Server Components.
• Prior DX, DevRel, or developer advocacy experience.$$,
  'Open to all work authorizations including OPT/CPT',
  'Technical fluency (30 pts): Shows deep understanding of Next.js, React, and the Vercel platform including Edge Runtime, ISR, and Server Components.
Teaching ability (30 pts): Demonstrates capacity to explain complex topics clearly, write good documentation, and create useful examples.
Community mindset (25 pts): Shows evidence of sharing knowledge publicly — open-source, blog posts, talks, forum answers.
Product thinking (15 pts): Identifies developer pain points and proposes concrete improvements.'
FROM public.recruiters r WHERE r.username = 'recruiter_vercel';

-- Vercel: Frontend Engineering Intern
INSERT INTO public.jobs (recruiter_id, recruiter_name, title, company_name, employment_type, description, us_work_auth, grading_rubric)
SELECT
  r.id,
  r.name,
  'Frontend Engineering Intern (Summer 2025)',
  'Vercel',
  'internship',
$$Vercel is offering a 12-week Summer 2025 internship for exceptional frontend engineering students. You will work on real production features used by millions of developers — not toy projects.

What you will work on:
• Build and iterate on UI components for the Vercel Dashboard (Next.js + TypeScript + Tailwind).
• Implement performance improvements measured by Core Web Vitals and Lighthouse scores.
• Contribute to design system components in collaboration with the design team.
• Write automated tests (Jest, Playwright) for new features.
• Present your project to the broader engineering team at the end of the internship.

Requirements:
• Currently enrolled in a BS/MS/PhD program in CS, Engineering, or a related field.
• Graduating no earlier than December 2025.
• Strong foundation in HTML, CSS, and JavaScript/TypeScript.
• Familiarity with React and component-based UI development.
• At least one personal or academic project you are proud of with a public GitHub repo.

Nice to have:
• Experience with Next.js, Tailwind CSS, or Radix UI.
• Contributions to open-source frontend projects.
• Attention to accessibility (WCAG) and cross-browser compatibility.

Logistics:
• 12 weeks · June – August 2025
• Remote-first with optional in-person weeks in San Francisco
• Competitive stipend + housing assistance$$,
  'Must be authorized to work in the US (OPT/CPT eligible)',
  'Frontend fundamentals (35 pts): Demonstrates solid understanding of React, TypeScript, CSS layout models, and component architecture. Extra credit for performance optimization knowledge.
Project quality (30 pts): GitHub projects show clean code, good commit hygiene, README quality, and genuine problem-solving.
Learning agility (20 pts): Shows curiosity, asks good questions, and demonstrates ability to ramp quickly on unfamiliar technology.
Communication (15 pts): Clear, structured answers with concrete examples. Comfortable admitting knowledge gaps.'
FROM public.recruiters r WHERE r.username = 'recruiter_vercel';
