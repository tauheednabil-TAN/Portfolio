import fs from "fs";
import path from "path";
import crypto from "crypto";
import { DBStore, KnowledgeChunk, BlogPost, RoadmapNode, Booking, Settings } from "../types.js";

const DB_PATH = path.join(process.cwd(), "src", "db", "db.json");

// In-memory cache
let dbCache: DBStore | null = null;

// Seed data based on Nabil's real profile
const DEFAULT_SETTINGS: Settings = {
  availabilityHoursStart: "10:00",
  availabilityHoursEnd: "18:00",
  timezone: "Europe/Copenhagen",
  myEmail: "tauheednabil@gmail.com",
  inPersonLocation: "Copenhagen, Denmark ☕",
};

const SEED_CHUNKS: Omit<KnowledgeChunk, "id">[] = [
  {
    category: "about",
    source: "Profile Overview",
    content: "Who is Nabil? I'm Tauheed Ahmed Nabil (everyone calls me Nabil), a computer science student based in Copenhagen, Denmark. I build real, complex multi-agent AI systems, automated workflows, and full-stack software from curiosity up, and I'm deeply passionate about cybersecurity (especially reverse engineering) and QA/Testing. My vibe is warm, curious, persistent, and I'm always looking for strong mentorship and opportunities to learn. Headline: CS Student · Agentic AI & Automation Builder · Cybersecurity · QA Tester.",
    created_at: new Date().toISOString(),
  },
  {
    category: "education",
    source: "Education History",
    content: "Nabil's Education: He is studying for a BSc (Hons) in Computer Science at Niels Brock Copenhagen Business College (2024 to expected Feb 2027). Core coursework includes Data Structures & Algorithms, Full-Stack Web Development, Big Data & Machine Learning, Operating Systems & Networks, Web Application Development, Agile Development Team Project. Previously, he studied BSc Industrial & Production Engineering at the Military Institute of Science and Technology, Dhaka (2022 to 2023) before switching to Computer Science to follow his passion for building software.",
    created_at: new Date().toISOString(),
  },
  {
    category: "skills",
    source: "Technical Skills",
    content: "Nabil's Skills: AI & Automation: Agentic AI, Multi-agent orchestration, CrewAI, LangChain, n8n, FastAPI, Vertex AI, Gemini AI, Anthropic Claude, Generative AI, PySpark, Machine Learning, TF-IDF. Programming Languages: Python, JavaScript, TypeScript, Java, React (React 19), SQL, PHP, C/C++, HTML, CSS. Data & APIs: REST APIs, PostgreSQL, MySQL, SQLite, Oracle, Power BI. Cybersecurity: reverse engineering, Capture the Flag (CTF), threat awareness, incident response, governance & compliance (NIST, Zero Trust), web security scanning, Verinice. Testing: manual testing, UI/UX, regression, system testing, bug reporting, test cases, test reporting. Tools & Systems: Docker, GitHub Actions, Git, Jira, Linux (Ubuntu, Kali), MS 365. Languages: English (fluent), Bengali (native), Hindi (fluent), Urdu (fluent), and beginner Danish.",
    created_at: new Date().toISOString(),
  },
  {
    category: "experience",
    source: "Work Experience",
    content: "Nabil's Experience:\n1. QA Tester at uTest (freelance), Nov 2025 to present, Copenhagen. Performs exploratory and structured testing of web and mobile products, writing detailed, version-tracked bug reports, and validating complex edge cases across browsers and operating systems.\n2. Technical Assistant at Scandic Hotels (Webers), May 2025 to present, Copenhagen. Handles IT support, maintenance, and the Oracle Hospitality database. Voted Team Member of the Month in February 2026 by his colleagues.\n3. Student IT Assistant at Spacegaming eSports, June to Dec 2025, Frederiksberg. Maintained systems, tracked tournament data in Excel, used Verinice for risk and security monitoring, and reviewed logs as a competition examiner.\n4. Country Manager at International Youth Summit, 2022 to 2023, remote. Handled outreach, workshops, and university partnerships.",
    created_at: new Date().toISOString(),
  },
  {
    category: "projects",
    source: "Project: Sentinel",
    content: "Project Sentinel: An AI cybersecurity scanner where 12 parallel agents probe a live URL for exposed credentials/files, missing security headers, leaked API keys, and outdated dependencies, returning a clean, actionable markdown report. Built with Next.js, TypeScript, and Cerebras AI. Live and open-source! Honest backstory: Nabil's first version faked its findings; rebuilding it to fetch and probe real live data taught him more than any tutorial ever could.",
    created_at: new Date().toISOString(),
  },
  {
    category: "projects",
    source: "Project: LoanSage",
    content: "Project LoanSage: A 5-agent CrewAI automated loan-approval pipeline (consisting of Cleanup, Decision, Guardrail, Email Writer, and Next Best Offer agents) orchestrated with FastAPI and n8n, incorporating a manual/automated safety guardrail before any offer is sent to customers.",
    created_at: new Date().toISOString(),
  },
  {
    category: "projects",
    source: "Project: OrderBot",
    content: "Project OrderBot: An autonomous business agent built in Vertex AI that checks customer account status in Salesforce, reads live inventory levels from Google Sheets, and makes intelligent shipping routing decisions end-to-end. Built as part of the Datacom Automation AI Accelerator on Forage.",
    created_at: new Date().toISOString(),
  },
  {
    category: "projects",
    source: "Project: FlowOps",
    content: "Project FlowOps: A complete, full-stack payments operations dashboard. Built with React 19 + TypeScript on a Ruby on Rails 8 API with PostgreSQL. Dockerized with GitHub Actions CI running Brakeman and Bundler-Audit security scans. Seeded with 200+ multi-currency transactions.",
    created_at: new Date().toISOString(),
  },
  {
    category: "projects",
    source: "Project: Gmail Junk Cleaner",
    content: "Project Gmail Junk Cleaner: A privacy-first Google Apps Script automation agent that safely batch-cleans a mailbox (targets big or old mail, respects starred items, keeps all data within Nabil's own account). Nabil coded this because he once had over 10,000 unread emails and wanted to avoid paying for storage!",
    created_at: new Date().toISOString(),
  },
  {
    category: "projects",
    source: "Project: Big Data coursework",
    content: "Project PySpark Crime & Loan Analysis: Big-data coursework featuring UK crime data ETL plus a Spark ML loan-approval pipeline (Logistic Regression, Decision Tree, Linear SVC). Built with Python, PySpark, pandas, and matplotlib.",
    created_at: new Date().toISOString(),
  },
  {
    category: "projects",
    source: "Project: CodeFlix",
    content: "Project CodeFlix: An AI movie recommendation and watchlist application featuring a Gemini chatbot, TF-IDF similarity, and the OMDb API. Built with Python and SQLite. Nabil led both the AI development and the Scrum process.",
    created_at: new Date().toISOString(),
  },
  {
    category: "projects",
    source: "Project: Student Course Hub & JavaFX Module Chooser",
    content: "Projects Course Hub & JavaFX: 1. Student Course Hub: A PHP-MVC + MySQL web application with role-based access control, secure coding (prepared statements, password hashing), and detailed architectural documentation.\n2. JavaFX Module Chooser: An MVC desktop application for students to select and validate final-year academic modules, featuring XML profile persistence and file export.",
    created_at: new Date().toISOString(),
  },
  {
    category: "faq",
    source: "Interests & Fun Facts",
    content: "Nabil's Interests & Fun Facts:\n- He switched from mechanical/industrial engineering to CS because he fell in love with building software.\n- He speaks 5 languages: English (fluent), Bengali (native), Hindi (fluent), Urdu (fluent), and beginner Danish.\n- He built a Gmail junk cleaner instead of paying for extra Google storage.\n- He genuinely builds multi-agent AI systems for fun on weekends.\n- He jumped from #72 to #33 in Hovedstaden in the Danish Cyber Championships (DDC) in a single year; reverse engineering is his favorite CTF category!\n- He has been accepted to the prestigious CyberBridge Summer School in Copenhagen, August 2026.",
    created_at: new Date().toISOString(),
  },
  {
    category: "faq",
    source: "Certifications",
    content: "Nabil's Certifications: Claude Code in Action — Anthropic (2026); Generative AI Mastermind — Outskill (2026); Datacom Automation AI Accelerator — Forage (where he built OrderBot). Cybersecurity certs: Mastercard, Clifford Chance (Governance & Compliance), PwC (ITGC, Risk Assessment), Lloyds Future Ready Cyber; ISO 19650 Information Management. IELTS Academic (valid to Feb 2027).",
    created_at: new Date().toISOString(),
  },
  {
    category: "faq",
    source: "Current learning focus",
    content: "Nabil is currently going deeper into agentic AI (multi-agent orchestration, safety guardrails, automated workflows) and hands-on cybersecurity (reverse engineering, Capture the Flag, defensive security) in preparation for the CyberBridge Summer School in August 2026.",
    created_at: new Date().toISOString(),
  }
];

const SEED_ROADMAP: RoadmapNode[] = [
  {
    id: "milestone-1",
    parent_id: null,
    title: "The Engineering Foundations",
    description: "Deep dive into Industrial/Production Engineering and the transition to Computer Science.",
    status: "done",
    sort_order: 1,
    icon: "GraduationCap",
    date_label: "2022 - 2023",
  },
  {
    id: "sub-1-1",
    parent_id: "milestone-1",
    title: "Industrial & Production Engineering",
    description: "Studied core engineering principles, materials science, and optimization modeling at MIST, Dhaka.",
    status: "done",
    sort_order: 1,
    icon: "Activity",
    date_label: "2022 - 2023",
  },
  {
    id: "sub-1-2",
    parent_id: "milestone-1",
    title: "The CS Epiphany",
    description: "Fell in love with software development, coding custom scripts on weekends, leading to a major decision to pivot study streams.",
    status: "done",
    sort_order: 2,
    icon: "Sparkles",
    date_label: "Late 2023",
  },
  {
    id: "milestone-2",
    parent_id: null,
    title: "Copenhagen Academic Leap",
    description: "Enrolled in BSc Hons Computer Science at Niels Brock, Copenhagen.",
    status: "done",
    sort_order: 2,
    icon: "MapPin",
    date_label: "Feb 2024 - Present",
  },
  {
    id: "sub-2-1",
    parent_id: "milestone-2",
    title: "Core CS Fundamentals",
    description: "Mastered Data Structures & Algorithms, OOP with Java, SQL databases, and secure PHP web applications.",
    status: "done",
    sort_order: 1,
    icon: "BookOpen",
    date_label: "Spring 2024",
  },
  {
    id: "sub-2-2",
    parent_id: "milestone-2",
    title: "Big Data & Machine Learning",
    description: "Developed PySpark Crime & Loan Analysis pipelines, exploring large-scale Spark ML modeling.",
    status: "done",
    sort_order: 2,
    icon: "Database",
    date_label: "Fall 2024",
  },
  {
    id: "milestone-3",
    parent_id: null,
    title: "AI Agents & Hands-on Work",
    description: "Building automated AI workflows, multi-agent systems, and working as IT/QA Specialist.",
    status: "in_progress",
    sort_order: 3,
    icon: "Cpu",
    date_label: "2025 - Present",
  },
  {
    id: "sub-3-1",
    parent_id: "milestone-3",
    title: "QA Specialist at uTest & Scandic",
    description: "Started freelance mobile/web QA testing, logging edge cases, and working as IT Tech Assistant at Webers.",
    status: "done",
    sort_order: 1,
    icon: "CheckCircle",
    date_label: "2025",
  },
  {
    id: "sub-3-2",
    parent_id: "milestone-3",
    title: "Multi-Agent Systems & sentinel",
    description: "Created Sentinel (12 parallel cybersecurity agents), LoanSage (CrewAI + n8n pipeline), and Gmail Cleaners.",
    status: "in_progress",
    sort_order: 2,
    icon: "Bot",
    date_label: "Early 2026",
  },
  {
    id: "milestone-4",
    parent_id: null,
    title: "CyberBridge Summer School & Beyond",
    description: "Deep dive into defensive security, advanced reverse engineering, and professional AI orchestration.",
    status: "planned",
    sort_order: 4,
    icon: "ShieldAlert",
    date_label: "August 2026 - 2027",
  },
  {
    id: "sub-4-1",
    parent_id: "milestone-4",
    title: "CyberBridge Summer Academy",
    description: "Accepted to the specialized summer academy in Copenhagen to explore advanced cybersecurity, network threat assessments, and firmware analysis.",
    status: "planned",
    sort_order: 1,
    icon: "Terminal",
    date_label: "August 2026",
  },
  {
    id: "sub-4-2",
    parent_id: "milestone-4",
    title: "BSc Graduation & Career",
    description: "Successfully complete the final BSc CS thesis, build production-grade agentic platforms, and seek professional mentorship.",
    status: "planned",
    sort_order: 2,
    icon: "Trophy",
    date_label: "Feb 2027",
  }
];

const SEED_POSTS: BlogPost[] = [
  {
    id: "post-1",
    title: "Why I Built My Own 10,000+ Email Inbox Cleaning Agent",
    body_md: "### The Backstory\nI had over 10,000 unread emails piling up in my Gmail inbox. Standard newsletters, promotional coupon offers, notifications from old forums, and spam. It was starting to trigger Google's storage warnings. Instead of paying Google for an extra storage tier, I realized: *I'm a computer science student, I should solve this with code.*\n\n### The Solution\nI decided to build **Gmail Junk Cleaner**, a privacy-first, serverless script written in Google Apps Script that lives entirely inside my personal Google account (no third-party data access). \n\n```js\n// Simple cleaning filter snippet\nfunction cleanMailInbox() {\n  const threads = GmailApp.search('is:unread category:promotions older_than:30d');\n  for (let i = 0; i < threads.length; i++) {\n    if (!threads[i].isStarred()) {\n      threads[i].moveToTrash();\n    }\n  }\n}\n```\n\n### What it does\n1. Target heavy/large attachment emails.\n2. Safely groups promotional newsletters older than 30 days.\n3. Strictly respects **starred** or flagged conversations to ensure no important correspondence is lost.\n4. Keeps all execution and security inside my Google OAuth sandbox.\n\nBuilding this showed me the pure joy of automation: writing code to solve your own boring, daily problems! ☕",
    image_url: "",
    tags: ["Google Apps Script", "Automation", "Workflow", "Productivity"],
    published: true,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "post-2",
    title: "From Mechanical Engineering to Coding Multi-Agent Systems",
    body_md: "### The Decision to Pivot\nBack in 2022, I was studying Industrial & Production Engineering at MIST. I liked modeling and optimization, but I felt something was missing. I wanted to build the tools myself, not just manage the production floors. On weekends, I spent hours learning Python, writing automation macros, and exploring algorithms. In late 2023, I made the jump: moving to Copenhagen to pursue a BSc in Computer Science at Niels Brock.\n\n### Why Multi-Agent Systems?\nTraditional software takes input A and outputs B. But in **agentic AI**, you define a pool of specialized agents, give them goals, tools, and a communication structure (like CrewAI), and let them collaborate asynchronously. \n\nFor example, in **LoanSage**, my pipeline works like this:\n1. **Cleanup Agent** formats and validates user input.\n2. **Decision Agent** queries credit scoring rules.\n3. **Guardrail Agent** runs a security policy scan.\n4. **Email Writer Agent** crafts the formal response.\n5. **Next Best Offer Agent** recommends alternative tailored loan schemes.\n\nIt feels like directing a team of experts inside a digital coffee shop! If you're starting out in CS, don't just follow standard tutorials: find a project that excites you, make it fully real, break it, and rebuild it properly.",
    image_url: "",
    tags: ["Computer Science", "Career Pivot", "AI Agents", "CrewAI"],
    published: true,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

async function ensureDBDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    await fs.promises.mkdir(dir, { recursive: true });
  }
}

export async function getDB(): Promise<DBStore> {
  if (dbCache) return dbCache;

  await ensureDBDir();

  try {
    if (fs.existsSync(DB_PATH)) {
      const dataStr = await fs.promises.readFile(DB_PATH, "utf-8");
      dbCache = JSON.parse(dataStr);
      return dbCache!;
    }
  } catch (err) {
    console.error("Error reading database file, resetting to default seeded database", err);
  }

  // Populate seeded store
  const freshChunks: KnowledgeChunk[] = SEED_CHUNKS.map((c) => ({
    ...c,
    id: `chunk-${crypto.randomUUID()}`,
  }));

  dbCache = {
    knowledge_chunks: freshChunks,
    posts: SEED_POSTS,
    roadmap_nodes: SEED_ROADMAP,
    bookings: [],
    settings: DEFAULT_SETTINGS,
  };

  await saveDB(dbCache);
  return dbCache;
}

export async function saveDB(store: DBStore): Promise<void> {
  dbCache = store;
  try {
    await ensureDBDir();
    await fs.promises.writeFile(DB_PATH, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.warn("⚠️ Database write failed (expected on read-only environments like Vercel). Running in-memory instead.", err);
  }
}

// Knowledge Base Operations
export async function listChunks(): Promise<KnowledgeChunk[]> {
  const db = await getDB();
  return db.knowledge_chunks;
}

export async function saveChunk(chunk: Omit<KnowledgeChunk, "id" | "created_at"> & { id?: string }): Promise<KnowledgeChunk> {
  const db = await getDB();
  if (chunk.id) {
    const index = db.knowledge_chunks.findIndex((c) => c.id === chunk.id);
    if (index !== -1) {
      const updated: KnowledgeChunk = {
        ...db.knowledge_chunks[index],
        ...chunk,
        id: chunk.id,
      };
      db.knowledge_chunks[index] = updated;
      await saveDB(db);
      return updated;
    }
  }

  const newChunk: KnowledgeChunk = {
    ...chunk,
    id: `chunk-${crypto.randomUUID()}`,
    created_at: new Date().toISOString(),
  };
  db.knowledge_chunks.push(newChunk);
  await saveDB(db);
  return newChunk;
}

export async function deleteChunk(id: string): Promise<boolean> {
  const db = await getDB();
  const index = db.knowledge_chunks.findIndex((c) => c.id === id);
  if (index === -1) return false;
  db.knowledge_chunks.splice(index, 1);
  await saveDB(db);
  return true;
}

// Blog Posts Operations
export async function listPosts(includeDrafts = false): Promise<BlogPost[]> {
  const db = await getDB();
  let posts = db.posts;
  if (!includeDrafts) {
    posts = posts.filter((p) => p.published);
  }
  return [...posts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function savePost(post: Omit<BlogPost, "id" | "created_at"> & { id?: string }): Promise<BlogPost> {
  const db = await getDB();
  if (post.id) {
    const index = db.posts.findIndex((p) => p.id === post.id);
    if (index !== -1) {
      const updated: BlogPost = {
        ...db.posts[index],
        ...post,
        id: post.id,
      };
      db.posts[index] = updated;
      await saveDB(db);
      return updated;
    }
  }

  const newPost: BlogPost = {
    ...post,
    id: `post-${crypto.randomUUID()}`,
    created_at: new Date().toISOString(),
  };
  db.posts.push(newPost);
  await saveDB(db);
  return newPost;
}

export async function deletePost(id: string): Promise<boolean> {
  const db = await getDB();
  const index = db.posts.findIndex((p) => p.id === id);
  if (index === -1) return false;
  db.posts.splice(index, 1);
  await saveDB(db);
  return true;
}

// Roadmap Operations
export async function listRoadmapNodes(): Promise<RoadmapNode[]> {
  const db = await getDB();
  return db.roadmap_nodes;
}

export async function saveRoadmapNode(node: Omit<RoadmapNode, "id"> & { id?: string }): Promise<RoadmapNode> {
  const db = await getDB();
  if (node.id) {
    const index = db.roadmap_nodes.findIndex((n) => n.id === node.id);
    if (index !== -1) {
      const updated: RoadmapNode = {
        ...db.roadmap_nodes[index],
        ...node,
        id: node.id,
      };
      db.roadmap_nodes[index] = updated;
      await saveDB(db);
      return updated;
    }
  }

  const newNode: RoadmapNode = {
    ...node,
    id: `node-${crypto.randomUUID()}`,
  };
  db.roadmap_nodes.push(newNode);
  await saveDB(db);
  return newNode;
}

export async function deleteRoadmapNode(id: string): Promise<boolean> {
  const db = await getDB();
  const index = db.roadmap_nodes.findIndex((n) => n.id === id);
  if (index === -1) return false;

  // Also delete children nodes recursively
  const toDelete = [id];
  let checkMore = true;
  while (checkMore) {
    const childrenIds = db.roadmap_nodes
      .filter((n) => n.parent_id && toDelete.includes(n.parent_id) && !toDelete.includes(n.id))
      .map((n) => n.id);
    if (childrenIds.length > 0) {
      toDelete.push(...childrenIds);
    } else {
      checkMore = false;
    }
  }

  db.roadmap_nodes = db.roadmap_nodes.filter((n) => !toDelete.includes(n.id));
  await saveDB(db);
  return true;
}

// Bookings Operations
export async function listBookings(): Promise<Booking[]> {
  const db = await getDB();
  return [...db.bookings].sort((a, b) => new Date(a.start_ts).getTime() - new Date(b.start_ts).getTime());
}

export async function addBooking(booking: Omit<Booking, "id" | "status" | "approval_token" | "gcal_event_id" | "created_at">): Promise<Booking> {
  const db = await getDB();
  const token = crypto.randomBytes(24).toString("hex");
  const newBooking: Booking = {
    ...booking,
    id: `booking-${crypto.randomUUID()}`,
    status: "pending",
    approval_token: token,
    gcal_event_id: null,
    created_at: new Date().toISOString(),
  };
  db.bookings.push(newBooking);
  await saveDB(db);
  return newBooking;
}

export async function updateBookingStatus(id: string, status: "confirmed" | "declined" | "expired", gcal_event_id: string | null = null): Promise<Booking | null> {
  const db = await getDB();
  const index = db.bookings.findIndex((b) => b.id === id);
  if (index === -1) return null;
  db.bookings[index].status = status;
  if (gcal_event_id) {
    db.bookings[index].gcal_event_id = gcal_event_id;
  }
  await saveDB(db);
  return db.bookings[index];
}

export async function getBookingByToken(token: string): Promise<Booking | null> {
  const db = await getDB();
  return db.bookings.find((b) => b.approval_token === token) || null;
}

// Settings Operations
export async function getSettings(): Promise<Settings> {
  const db = await getDB();
  return db.settings;
}

export async function updateSettings(settings: Settings): Promise<Settings> {
  const db = await getDB();
  db.settings = settings;
  await saveDB(db);
  return db.settings;
}

// Semantic and Fallback RAG search engine
export async function searchKnowledge(query: string, limit = 5): Promise<KnowledgeChunk[]> {
  const chunks = await listChunks();
  const queryWords = query.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean);

  if (queryWords.length === 0) return chunks.slice(0, limit);

  // Score each chunk using word frequency and term matches
  const scoredChunks = chunks.map((chunk) => {
    const chunkText = `${chunk.source} ${chunk.content} ${chunk.category}`.toLowerCase();
    let score = 0;

    queryWords.forEach((word) => {
      // Direct matches
      const index = chunkText.indexOf(word);
      if (index !== -1) {
        score += 10;
        // Check if word is exact boundaried match
        const regex = new RegExp(`\\b${word}\\b`, "g");
        const matches = chunkText.match(regex);
        if (matches) {
          score += matches.length * 15;
        }
      }

      // Bonus points for matching Category or Source
      if (chunk.category.toLowerCase().includes(word)) {
        score += 20;
      }
      if (chunk.source.toLowerCase().includes(word)) {
        score += 25;
      }
    });

    return { chunk, score };
  });

  // Sort by score descending and filter out zero-score chunks unless no match found at all
  let matches = scoredChunks.filter((item) => item.score > 0);
  if (matches.length === 0) {
    // Return default biographical chunks if absolutely nothing matched
    matches = scoredChunks.filter((item) => ["about", "skills", "faq"].includes(item.chunk.category));
  }

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, limit).map((m) => m.chunk);
}
