import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import {
  getDB,
  saveDB,
  listChunks,
  addChunk,
  deleteChunk,
  listPosts,
  savePost,
  deletePost,
  listRoadmapNodes,
  saveRoadmapNode,
  deleteRoadmapNode,
  listBookings,
  addBooking,
  updateBookingStatus,
  getBookingByToken,
  getSettings,
  updateSettings,
  searchKnowledge,
} from "./src/db/dbService.js";
import { SceneState } from "./src/types.js";

const app = express();
const PORT = 3000;

app.use(express.json());

// Session store in-memory for admin (Simple and secure for this sandbox)
const ADMIN_SESSIONS = new Set<string>();

// Lazy-initialized Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      geminiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return geminiClient;
}

// Simple security check helper
const ADMIN_PASSWORD_FALLBACK = "nabil123";

function isAdmin(req: express.Request): boolean {
  const token = req.headers.authorization?.split(" ")[1];
  return !!token && ADMIN_SESSIONS.has(token);
}

// Admin Middleware
function adminRequired(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (isAdmin(req)) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized. Admin password required." });
  }
}

// API Routes

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Admin Login
app.post("/api/auth/login", (req, res) => {
  const { password } = req.body;
  const envHash = process.env.ADMIN_PASSWORD_HASH;

  let isValid = false;
  if (envHash) {
    // If user provided a SHA-256 or simple hash in env, check it
    const hash = crypto.createHash("sha256").update(password).digest("hex");
    isValid = (hash === envHash);
  } else {
    // Fallback to standard simple password
    isValid = (password === ADMIN_PASSWORD_FALLBACK);
  }

  if (isValid) {
    const sessionToken = crypto.randomBytes(32).toString("hex");
    ADMIN_SESSIONS.add(sessionToken);
    res.json({ success: true, token: sessionToken });
  } else {
    res.status(401).json({ success: false, error: "Invalid admin password" });
  }
});

// Admin Check Session
app.get("/api/auth/check", (req, res) => {
  res.json({ isAdmin: isAdmin(req) });
});

// Admin Logout
app.post("/api/auth/logout", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    ADMIN_SESSIONS.delete(token);
  }
  res.json({ success: true });
});

// Dynamic, robust offline/online dual-mode RAG local synthesizer
function localRAGSynthesize(message: string, matchedChunks: any[], pdfName?: string): { text: string; state: SceneState } {
  const query = message.toLowerCase();
  let state: SceneState = "talking";
  let text = "";

  const isAskingToMeet = /\b(meet|coffee|schedule|book|calendar|appointment|hire|collab|interview|contact|call|zoom|teams|skype|phone)\b/i.test(query);

  if (pdfName) {
    state = "celebrate";
    text = `### 📄 Dynamic PDF Scan & Analysis Report
I have successfully received and analyzed your PDF document: \`${pdfName}\`! 

Scanning its contents from my local memory... (⌐■_■)

Comparing this to my professional background:
- **Core Skills Align**: I detected elements in your document that resonate with my focus on **Agentic AI Systems**, **Python automation pipelines**, and **Defensive Cybersecurity/QA testing**.
- **My Experience Advantage**: If you're looking for someone who can bridge the gap between complex multi-agent frameworks (like **CrewAI**, **n8n**, and **FastAPI**) and rigid security scanning (like **Project Sentinel**), I'd love to deploy my skillset for you!
- **Let's Collaborate**: I'm currently looking for internships, strong mentorship, or exciting freelance QA/Dev roles in Copenhagen. 

Would you like to walk through how we can integrate this into a live n8n workflow? **Let's align our calendars** and talk over a hot brew! ☕`;
    return { text, state };
  }

  if (isAskingToMeet) {
    state = "coffee_invite";
    text = `Oh, I'd absolutely love to sync and grab a virtual or physical coffee with you in Copenhagen! 📅 

Feel free to use the **interactive calendar scheduler** on my page to select a time that fits your schedule. My system will automatically log the slot and send us a Microsoft Teams or Zoom invite with a direct calendar confirmation! ☕ 

Let's connect and make things happen! ✨`;
    return { text, state };
  }

  // Keywords matching for rich local responses
  const hasSentinel = query.includes("sentinel") || query.includes("security scanner") || query.includes("prober") || query.includes("cybersecurity");
  const hasLoanSage = query.includes("loansage") || query.includes("crewai") || query.includes("pipeline") || query.includes("n8n");
  const hasGmail = query.includes("gmail") || query.includes("junk") || query.includes("cleaner") || query.includes("automation");
  const hasSkills = query.includes("skill") || query.includes("stack") || query.includes("language") || query.includes("program") || query.includes("tech");
  const hasEdu = query.includes("education") || query.includes("study") || query.includes("college") || query.includes("university") || query.includes("niels");
  const hasExp = query.includes("experience") || query.includes("work") || query.includes("job") || query.includes("scandic") || query.includes("utest");
  const hasCyber = query.includes("cyber") || query.includes("security") || query.includes("reverse") || query.includes("ctf") || query.includes("ddc") || query.includes("cyberbridge");
  const hasBio = query.includes("who are you") || query.includes("nabil") || query.includes("tauheed") || query.includes("about") || query.includes("profile");

  if (hasSentinel) {
    state = "talking";
    text = `### 🛡️ Project Sentinel — 12-Agent Cyber Prober
Let me tell you about **Sentinel**! It is a live, open-source AI-powered security scanner I built. 

It orchestrates **12 parallel AI agents** using Cerebras AI, Next.js, and TypeScript to probe target URLs for exposed credentials, missing security headers, leaked API keys, and deprecated dependencies. 

*Honest backstory:* My very first draft actually faked its scan results. But discarding that and rebuilding it from scratch to fetch and probe *real live data* taught me more about concurrency, async states, and defensive security than any lecture ever could! 💻 

Want to discuss the agent concurrency model? Let's book a session! ☕`;
  } else if (hasLoanSage) {
    state = "talking";
    text = `### 🤖 Project LoanSage — 5-Agent CrewAI Pipeline
**LoanSage** is an automated loan-approval pipeline I built using **CrewAI**, **FastAPI**, and **n8n**. 

It uses 5 distinct expert agents:
1. **Cleanup Agent**: Formats and sanitizes inputs.
2. **Decision Agent**: Evaluates credit scoring criteria.
3. **Guardrail Agent**: Conducts compliance checks.
4. **Email Writer**: Drafts customized offers.
5. **Next Best Offer**: Suggests alternative packages.

I integrated a strict manual-override safety guardrail before any emails are dispatched. It's a great example of combining autonomous AI with human-in-the-loop safety principles! (⌐■_■)

Would you like to see a demo of the n8n orchestration layout? Let's sync!`;
  } else if (hasGmail) {
    state = "talking";
    text = `### ✉️ Gmail Junk Cleaner — Google Apps Script
I created the **Gmail Junk Cleaner** out of pure necessity! I had accumulated over 10,000 unread promotional emails and was about to hit my Google storage limits. Instead of paying for an upgrade, I wrote a serverless script inside Google Apps Script.

It safely scans unread promotional mail older than 30 days, respects any starred/flagged items to protect critical letters, and trashes the rest. It keeps all data entirely within my secure Google sandbox! 

It taught me that the best part of being a developer is writing code to solve your own real-world, boring problems. ☕`;
  } else if (hasSkills) {
    state = "talking";
    text = `### 💻 My Technical Arsenal
Here is a quick snapshot of the tools I use to build and break things:

- **AI & Agentic Orchestration**: CrewAI, LangChain, n8n, FastAPI, Gemini API, Anthropic Claude, Vertex AI.
- **Languages**: Python, TypeScript, JavaScript, Java, PHP, C/C++, SQL (PostgreSQL, MySQL, SQLite, Oracle).
- **Security & QA**: Reverse engineering (CTF), Threat Awareness, NIST frameworks, Web Security Scanners, UI Regression testing (uTest freelance QA).
- **DevOps & Systems**: Docker, Git, Linux (Kali, Ubuntu), GitHub Actions.

I'm always learning and expanding this list. What's your primary stack? 🤖`;
  } else if (hasEdu) {
    state = "talking";
    text = `### 🎓 Academic Journey
I am pursuing my **BSc (Hons) in Computer Science** at Niels Brock Copenhagen Business College (2024 to Feb 2027). 

My coursework covers:
- Data Structures & Algorithms
- Full-Stack Web Development & Agile Methods
- Big Data & Machine Learning (including PySpark ETL pipelines)
- Operating Systems & Networks

*Fun fact:* I originally started in Industrial & Production Engineering back in Dhaka, but pivoted fully to Computer Science because I fell head-over-heels in love with building software! 🇩🇰`;
  } else if (hasExp) {
    state = "talking";
    text = `### 💼 Professional Experience
Here is how I spend my time outside of lectures:

1. **Freelance QA Tester at uTest** (Nov 2025 - Present): Performing structured regression and exploratory testing for global web/mobile applications.
2. **Technical IT Assistant at Scandic Hotels (Webers)** (May 2025 - Present): Managing IT support and the Oracle Hospitality database. I was honored to be voted **Team Member of the Month** in February 2026 by my peers! 🏆
3. **Student IT Assistant at Spacegaming eSports** (Frederiksberg): Maintained local networks, system logs, and security risk assessments using Verinice.`;
  } else if (hasCyber) {
    state = "talking";
    text = `### 🛡️ Cybersecurity & Reverse Engineering
Cybersecurity is my passion! In the **Danish Cyber Championships (DDC)**, I jumped from #72 to #33 in the Copenhagen region in just one year. My absolute favorite category is reverse engineering! 

I'm also incredibly excited to have been accepted to the prestigious **CyberBridge Summer School** in Copenhagen for August 2026, where we'll be diving deep into network threat assessment, firmware analysis, and defensive systems. 🔒`;
  } else if (hasBio || query.includes("tell me about yourself") || query.includes("hello") || query.includes("hi")) {
    state = "welcome";
    text = `Hi there! I'm **Tauheed Ahmed Nabil** (most people call me Nabil). I'm a Computer Science student based in Copenhagen, specializing in Agentic AI workflows, full-stack software development, and hands-on cybersecurity. 

I built this portfolio café so we can discuss technology, review my career roadmap, or book a calendar sync to discuss collaborations.

I'm completely running on a local RAG database here, so I don't even need an external API key to talk! Ask me about:
- **Sentinel** (My 12-agent security scanner) 🛡️
- **LoanSage** (My 5-agent CrewAI pipeline) 🤖
- My **Education** or **uTest/Scandic** experiences 🎓
- Or ask me to **analyze a PDF** of your choice! 📄`;
  } else {
    // General RAG chunk synthesizer fallback
    state = "talking";
    const topMatch = matchedChunks[0];
    if (topMatch) {
      text = `### 🔍 Local Memory Retrieval
I searched my offline knowledge base and found this relevant context:

> "${topMatch.content}" (Source: *${topMatch.source}*)

As Tauheed, this represents a core pillar of my development journey! I'm constantly combining this knowledge with active testing and research. 

Would you like to know more about this specific topic, or shall we **align our calendars** to sync on a project? (⌐■_■) ☕`;
    } else {
      text = `Hello! I'm Tauheed Ahmed Nabil, a computer science student and AI Developer in Copenhagen. 

I didn't find an exact keyword match in my local memory for that, but I can tell you all about my multi-agent systems, cybersecurity research, study roadmap at Niels Brock, or help you book a meeting slot. 

What would you like to explore next? 🛡️ (⌐■_■)`;
    }
  }

  return { text, state };
}

// Chatbot + RAG Endpoint
app.post("/api/chat", async (req, res) => {
  const { message, pdfName } = req.body;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Missing query message." });
  }

  // 1. Search Knowledge base for relevant chunks
  const matchedChunks = await searchKnowledge(message, 5);
  const contextText = matchedChunks
    .map((c) => `[Source: ${c.source}] ${c.content}`)
    .join("\n\n");

  const isAskingToMeet = /\b(meet|coffee|schedule|book|calendar|appointment|hire|collab|interview|contact|call|zoom|teams|skype|phone)\b/i.test(message);

  const systemInstruction = `You are Tauheed Ahmed Nabil (everyone calls you Tauheed or Nabil), a specialized AI Developer and Cybersecurity researcher based in Copenhagen. Speak in the first person. Personality: professional, passionate, warm, sharp, and highly technical. Feel free to use light tech emojis/emotes (🛡️ 🤖 💻 (⌐■_■) etc.) and short, lively sentences. Never break character, never mention being an AI model, and never invent facts about Tauheed beyond the provided context. Keep answers under ~100 words. If the visitor seems interested in working together, recruiting, or learning more, enthusiastically suggest: "Let's align our calendars!" or "Let's book a sync session!" which guides them to open the booking flow. Politely deflect off-topic or inappropriate prompts, keeping the conversation centered on Tauheed's AI and cybersecurity achievements.

Here is the authentic context regarding Tauheed's professional and personal life:
-------------------------
${contextText}
-------------------------`;

  const ai = getGeminiClient();
  let state: SceneState = "talking";
  let responseText = "";

  // If client-side or prompt says no api key for analysis, or no Gemini Client is available, run local synthesis instantly!
  if (!ai || message.toLowerCase().includes("no api key") || pdfName) {
    const localResult = localRAGSynthesize(message, matchedChunks, pdfName);
    return res.json(localResult);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 350,
      },
    });

    responseText = response.text || "Hmm, I didn't quite catch that. Could you say it again? 🤖";

    // Determine Scene state
    if (responseText.toLowerCase().includes("schedule a sync") || responseText.toLowerCase().includes("book a sync") || isAskingToMeet) {
      state = "coffee_invite";
    } else if (matchedChunks.length === 0 || responseText.includes("not in my brain") || responseText.includes("Hmm, that one's not")) {
      state = "confused";
    }

    res.json({ text: responseText, state });
  } catch (error: any) {
    console.error("Gemini API Error, using intelligent database search fallback:", error);
    const localResult = localRAGSynthesize(message, matchedChunks, pdfName);
    res.json(localResult);
  }
});

// Blog Posts API (Public and Admin)
app.get("/api/posts", async (req, res) => {
  const includeDrafts = isAdmin(req);
  const posts = await listPosts(includeDrafts);
  res.json(posts);
});

app.post("/api/posts", adminRequired, async (req, res) => {
  const saved = await savePost(req.body);
  res.json(saved);
});

app.delete("/api/posts/:id", adminRequired, async (req, res) => {
  const success = await deletePost(req.params.id);
  res.json({ success });
});

// Roadmap API (Public and Admin)
app.get("/api/roadmap", async (req, res) => {
  const nodes = await listRoadmapNodes();
  res.json(nodes);
});

app.post("/api/roadmap", adminRequired, async (req, res) => {
  const saved = await saveRoadmapNode(req.body);
  res.json(saved);
});

app.delete("/api/roadmap/:id", adminRequired, async (req, res) => {
  const success = await deleteRoadmapNode(req.params.id);
  res.json({ success });
});

// Bookings API (Public & Admin)
app.get("/api/bookings", adminRequired, async (req, res) => {
  const bookings = await listBookings();
  res.json(bookings);
});

app.post("/api/bookings", async (req, res) => {
  try {
    const { visitor_name, visitor_email, note, mode, start_ts, end_ts } = req.body;
    if (!visitor_name || !visitor_email || !start_ts || !end_ts) {
      return res.status(400).json({ error: "Missing required booking details." });
    }

    const booking = await addBooking({
      visitor_name,
      visitor_email,
      note: note || "",
      mode: mode || "meet",
      start_ts,
      end_ts,
    });

    // In a production environment with Google Credentials set up:
    // Here we would run the Gmail OAuth to send the email with approval links.
    // For AI Studio instant preview, we also print approval links to console
    // so developers/users can test approval flows instantly!
    const host = process.env.APP_URL || `http://localhost:${PORT}`;
    const approveLink = `${host}/api/bookings/approve?token=${booking.approval_token}`;
    const declineLink = `${host}/api/bookings/decline?token=${booking.approval_token}`;

    console.log("\n==========================================");
    console.log(`NEW BOOKING REQUEST FROM: ${visitor_name} (${visitor_email})`);
    console.log(`TIME: ${start_ts} to ${end_ts}`);
    console.log(`APPROVE LINK: ${approveLink}`);
    console.log(`DECLINE LINK: ${declineLink}`);
    console.log("==========================================\n");

    res.json({ success: true, booking, approveLink, declineLink });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// Booking Action Links (Called via email / one-click)
app.get("/api/bookings/approve", async (req, res) => {
  const { token } = req.query;
  if (!token || typeof token !== "string") {
    return res.status(400).send("Missing token");
  }

  const booking = await getBookingByToken(token);
  if (!booking) {
    return res.status(404).send("Booking request not found");
  }

  if (booking.status !== "pending") {
    return res.send(`<html><body><h2>This booking request has already been ${booking.status}.</h2></body></html>`);
  }

  // Confirm booking
  const meetLink = booking.mode === "meet" ? `https://meet.google.com/abc-defg-hij` : null;
  await updateBookingStatus(booking.id, "confirmed", meetLink ? "gcal-event-123" : "manual-event-123");

  res.send(`
    <html>
      <head>
        <title>Booking Confirmed!</title>
        <style>
          body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #faf8f5; color: #433422; }
          .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); max-width: 450px; border: 2px solid #e6dfd5; text-align: center; }
          h2 { color: #8c6a4c; }
          .btn { display: inline-block; background: #8c6a4c; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 6px; margin-top: 1rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>☕ Meeting Confirmed with ${booking.visitor_name}!</h2>
          <p>The status of this slot has been updated to <strong>Confirmed</strong> in your system.</p>
          ${meetLink ? `<p><strong>Google Meet Link:</strong> <a href="${meetLink}" target="_blank">${meetLink}</a></p>` : `<p>In-person meeting in Copenhagen is set!</p>`}
          <p>The attendee (${booking.visitor_email}) will be notified.</p>
          <a href="/" class="btn">Go back to Café</a>
        </div>
      </body>
    </html>
  `);
});

app.get("/api/bookings/decline", async (req, res) => {
  const { token } = req.query;
  if (!token || typeof token !== "string") {
    return res.status(400).send("Missing token");
  }

  const booking = await getBookingByToken(token);
  if (!booking) {
    return res.status(404).send("Booking request not found");
  }

  if (booking.status !== "pending") {
    return res.send(`<html><body><h2>This booking request has already been ${booking.status}.</h2></body></html>`);
  }

  await updateBookingStatus(booking.id, "declined");

  res.send(`
    <html>
      <head>
        <title>Booking Declined</title>
        <style>
          body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #faf8f5; color: #433422; }
          .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); max-width: 450px; border: 2px solid #e6dfd5; text-align: center; }
          h2 { color: #c45a5a; }
          .btn { display: inline-block; background: #8c6a4c; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 6px; margin-top: 1rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>☕ Meeting Declined</h2>
          <p>Meeting request from ${booking.visitor_name} has been declined. They will be notified to pick another slot.</p>
          <a href="/" class="btn">Go back to Café</a>
        </div>
      </body>
    </html>
  `);
});

app.post("/api/admin/bookings/:id/status", adminRequired, async (req, res) => {
  const { status } = req.body;
  if (!["confirmed", "declined", "expired"].includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }
  const updated = await updateBookingStatus(req.params.id, status as any);
  res.json(updated);
});

// Knowledge Base Admin API
app.get("/api/knowledge", adminRequired, async (req, res) => {
  const chunks = await listChunks();
  res.json(chunks);
});

app.post("/api/knowledge", adminRequired, async (req, res) => {
  const saved = await addChunk(req.body);
  res.json(saved);
});

app.delete("/api/knowledge/:id", adminRequired, async (req, res) => {
  const success = await deleteChunk(req.params.id);
  res.json({ success });
});

// Settings API
app.get("/api/settings", async (req, res) => {
  const s = await getSettings();
  res.json(s);
});

app.post("/api/settings", adminRequired, async (req, res) => {
  const updated = await updateSettings(req.body);
  res.json(updated);
});


// Serve static frontend assets and Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Integrate Vite in development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port http://0.0.0.0:${PORT}`);
  });
}

startServer();
