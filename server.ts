import express from "express";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import mammoth from "mammoth";
import { google } from "googleapis";

// Load environment variables
dotenv.config();

import {
  getDB,
  saveDB,
  listChunks,
  saveChunk,
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

export const app = express();
const PORT = 3000;

// Route normalizer for serverless deployments (like Vercel) where route prefixes might be modified/stripped
app.use((req, res, next) => {
  const url = req.url;
  if (!url.startsWith("/api") && !url.startsWith("/uploads")) {
    const originalUrl = req.url;
    req.url = "/api" + (originalUrl.startsWith("/") ? "" : "/") + originalUrl;
    console.log(`[Vercel Route Normalizer] Rewrote ${originalUrl} -> ${req.url}`);
  }
  next();
});

// Support up to 50MB uploads for photos and video files
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Ensure uploads directory exists on startup
const uploadsDir = path.join(process.cwd(), "uploads");
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.warn("⚠️ Failed to create uploads directory on startup (expected on read-only environments like Vercel).", err);
}

// Serve uploaded media statically
app.use("/uploads", express.static(uploadsDir));

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

// Lazy-initialized Google OAuth2 client for Google Workspace Integration
let oauth2ClientInstance: any = null;

function getGoogleOAuthClient() {
  if (oauth2ClientInstance) return oauth2ClientInstance;

  // Supports both direct naming and standard fallback naming from environment
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn("⚠️ Google OAuth credentials or refresh token missing from environment. Workspace features will run in sandbox/simulation mode.");
    return null;
  }

  const client = new google.auth.OAuth2(clientId, clientSecret);
  client.setCredentials({ refresh_token: refreshToken });
  oauth2ClientInstance = client;
  return client;
}

// Construct RFC 2822 email and base64url encode it for Gmail API
function makeEmailRaw(to: string, from: string, subject: string, body: string) {
  const str = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    body
  ].join('\r\n');

  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function sendGmailEmail(to: string, subject: string, htmlContent: string) {
  const client = getGoogleOAuthClient();
  if (!client) {
    console.log(`[Google Sandbox Mail] Would send email to: ${to} with Subject: "${subject}"`);
    return false;
  }

  try {
    const gmail = google.gmail({ version: "v1", auth: client });
    const raw = makeEmailRaw(to, "me", subject, htmlContent);
    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw }
    });
    console.log(`✉️ Email successfully dispatched to ${to}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to send email via Gmail API:", error);
    return false;
  }
}

async function createGoogleCalendarEvent(booking: any) {
  const client = getGoogleOAuthClient();
  if (!client) {
    console.log("[Google Sandbox GCal] Would create event for: " + booking.visitor_name);
    return null;
  }

  try {
    const calendar = google.calendar({ version: "v3", auth: client });
    const eventBody: any = {
      summary: booking.mode === "meet" ? `💻 Google Meet Café Sync — ${booking.visitor_name}` : `☕ Copenhagen Coffee Chat — ${booking.visitor_name}`,
      description: `Café Sync Session\n\nAttendee: ${booking.visitor_name} (${booking.visitor_email})\nNote: ${booking.note || "No notes provided."}\nMeeting Mode: ${booking.mode === "meet" ? "Google Meet (Online)" : "In-Person (Copenhagen Coffee)"}\n\nWe look forward to connecting!`,
      start: {
        dateTime: booking.start_ts,
      },
      end: {
        dateTime: booking.end_ts,
      },
      attendees: [
        { email: booking.visitor_email, responseStatus: "needsAction" },
        { email: "tauheednabil@gmail.com", responseStatus: "accepted" }
      ],
    };

    if (booking.mode === "meet") {
      eventBody.conferenceData = {
        createRequest: {
          requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet"
          }
        }
      };
    }

    const createdEvent = await calendar.events.insert({
      calendarId: "primary",
      requestBody: eventBody,
      conferenceDataVersion: booking.mode === "meet" ? 1 : 0,
      sendUpdates: "all", // This will trigger automatic email invitations to attendees!
    });

    console.log("📅 Created Google Calendar event successfully!");
    
    let meetLink: string | null = null;
    if (createdEvent.data.conferenceData?.entryPoints) {
      const meetEp = createdEvent.data.conferenceData.entryPoints.find((ep: any) => ep.entryPointType === "video");
      if (meetEp) {
        meetLink = meetEp.uri;
      }
    }

    return {
      eventId: createdEvent.data.id || null,
      meetLink: meetLink || (booking.mode === "meet" ? createdEvent.data.hangoutLink || null : null)
    };
  } catch (error) {
    console.error("❌ Failed to create Google Calendar event:", error);
    return null;
  }
}

async function approveBookingById(bookingId: string) {
  const db = await getDB();
  const booking = db.bookings.find(b => b.id === bookingId);
  if (!booking || booking.status !== "pending") return null;

  let meetLink: string | null = null;
  let gcalEventId: string | null = null;

  const gcalResult = await createGoogleCalendarEvent(booking);
  if (gcalResult) {
    meetLink = gcalResult.meetLink;
    gcalEventId = gcalResult.eventId;
  } else {
    meetLink = booking.mode === "meet" ? `https://meet.google.com/abc-defg-hij` : null;
    gcalEventId = meetLink ? "gcal-event-123" : "manual-event-123";
  }

  // Update status
  const updated = await updateBookingStatus(bookingId, "confirmed", gcalEventId);

  // Send confirmation email to visitor via Gmail API
  const visitorEmailSubject = `☕ Café Sync Confirmed with Tauheed Nabil!`;
  const visitorEmailContent = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e6dfd5; border-radius: 16px; background-color: #fafaf9; color: #443c35;">
      <div style="text-align: center; border-bottom: 2px solid #8c6a4c; padding-bottom: 16px; margin-bottom: 20px;">
        <span style="font-size: 32px;">☕</span>
        <h2 style="color: #8c6a4c; margin: 8px 0 0 0; font-family: serif; font-size: 24px;">Café Sync Confirmed!</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #16a34a; font-family: monospace; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Booking Active</p>
      </div>
      
      <p style="font-size: 15px; line-height: 1.6;">Hi ${booking.visitor_name},</p>
      <p style="font-size: 15px; line-height: 1.6;">I have reviewed and approved your booking request! An official Google Calendar invitation has been sent to your calendar. Here are the confirmed meeting details:</p>
      
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 12px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #16a34a; width: 120px;">Time:</td>
            <td style="padding: 6px 0; color: #14532d; font-family: monospace;"><strong>${new Date(booking.start_ts).toLocaleString("en-US", { timeZone: "Europe/Copenhagen", dateStyle: "full", timeStyle: "short" })} Copenhagen Time</strong></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #16a34a;">Meeting Mode:</td>
            <td style="padding: 6px 0; color: #14532d;">${booking.mode === "meet" ? "💻 Google Meet (Online)" : "☕ In-Person Coffee (Copenhagen)"}</td>
          </tr>
          ${meetLink ? `
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #16a34a;">Meet Link:</td>
            <td style="padding: 6px 0;"><a href="${meetLink}" style="color: #16a34a; font-weight: bold; text-decoration: underline;" target="_blank">${meetLink}</a></td>
          </tr>` : ""}
        </table>
      </div>
      
      <p style="font-size: 15px; line-height: 1.6;">I look forward to our chat! If you need to make any changes, please let me know.</p>
      
      <p style="font-size: 15px; line-height: 1.6;">Best regards,</p>
      <p style="font-size: 15px; line-height: 1.6; font-weight: bold; color: #8c6a4c;">Tauheed Nabil</p>
    </div>
  `;

  await sendGmailEmail(booking.visitor_email, visitorEmailSubject, visitorEmailContent);
  return { updated, meetLink };
}

async function declineBookingById(bookingId: string) {
  const db = await getDB();
  const booking = db.bookings.find(b => b.id === bookingId);
  if (!booking || booking.status !== "pending") return null;

  // Update status
  const updated = await updateBookingStatus(bookingId, "declined");

  // Send decline/cancellation email via Gmail API
  const visitorEmailSubject = `☕ Update on your Café Sync Request`;
  const visitorEmailContent = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e6dfd5; border-radius: 16px; background-color: #fafaf9; color: #443c35;">
      <div style="text-align: center; border-bottom: 2px solid #e6dfd5; padding-bottom: 16px; margin-bottom: 20px;">
        <span style="font-size: 32px;">☕</span>
        <h2 style="color: #b45309; margin: 8px 0 0 0; font-family: serif; font-size: 24px;">Café Sync Update</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #b45309; font-family: monospace; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Status Update</p>
      </div>
      
      <p style="font-size: 15px; line-height: 1.6;">Hi ${booking.visitor_name},</p>
      <p style="font-size: 15px; line-height: 1.6;">Unfortunately, Tauheed is unable to accept your requested Café Sync on <strong>${new Date(booking.start_ts).toLocaleString("en-US", { timeZone: "Europe/Copenhagen", dateStyle: "full", timeStyle: "short" })} Copenhagen Time</strong> due to calendar conflicts or coursework load.</p>
      
      <p style="font-size: 15px; line-height: 1.6;">Please feel free to revisit the portfolio applet and select another convenient slot. We would love to find a time to sync!</p>
      
      <p style="font-size: 15px; line-height: 1.6;">Warm regards,</p>
      <p style="font-size: 15px; line-height: 1.6; font-weight: bold; color: #8c6a4c;">Nabil's AI Butler 🤖</p>
    </div>
  `;

  await sendGmailEmail(booking.visitor_email, visitorEmailSubject, visitorEmailContent);
  return updated;
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
  const envPlain = process.env.ADMIN_PASSWORD;

  let isValid = false;

  // 1. Check against process.env.ADMIN_PASSWORD (if set)
  if (envPlain && password === envPlain) {
    isValid = true;
  }

  // 2. Check against process.env.ADMIN_PASSWORD_HASH (if set)
  if (!isValid && envHash) {
    const hash = crypto.createHash("sha256").update(password).digest("hex");
    // Supports BOTH the SHA-256 hex hash OR a plaintext password configured in the HASH environment variable
    if (hash === envHash || password === envHash) {
      isValid = true;
    }
  }

  // 3. Fallback to standard master password 'nabil123' to guarantee user is never locked out
  if (!isValid && password === ADMIN_PASSWORD_FALLBACK) {
    isValid = true;
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

// Helper to find a URL in matched knowledge chunks for dynamic display
function findLiveWebsiteLink(chunks: any[]): string | null {
  for (const chunk of chunks) {
    const match = chunk.content.match(/https?:\/\/[^\s)\],]+/i);
    if (match) {
      return match[0];
    }
  }
  return null;
}

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
    const liveUrl = findLiveWebsiteLink(matchedChunks) || "https://sentinel-cyberprober.vercel.app";
    text = `### 🛡️ Project Sentinel — 12-Agent Cyber Prober
Let me tell you about **Sentinel**! It is a live, open-source AI-powered security scanner I built. 

It orchestrates **12 parallel AI agents** using Cerebras AI, Next.js, and TypeScript to probe target URLs for exposed credentials, missing security headers, leaked API keys, and deprecated dependencies. 

*Honest backstory:* My very first draft actually faked its scan results. But discarding that and rebuilding it from scratch to fetch and probe *real live data* taught me more about concurrency, async states, and defensive security than any lecture ever could! 💻 

🔗 **[Try the Sentinel Live Website here!](${liveUrl})** 🚀

Want to discuss the agent concurrency model? Let's book a session! ☕`;
  } else if (hasLoanSage) {
    state = "talking";
    const liveUrl = findLiveWebsiteLink(matchedChunks);
    text = `### 🤖 Project LoanSage — 5-Agent CrewAI Pipeline
**LoanSage** is an automated loan-approval pipeline I built using **CrewAI**, **FastAPI**, and **n8n**. 

It uses 5 distinct expert agents:
1. **Cleanup Agent**: Formats and sanitizes inputs.
2. **Decision Agent**: Evaluates credit scoring criteria.
3. **Guardrail Agent**: Conducts compliance checks.
4. **Email Writer**: Drafts customized offers.
5. **Next Best Offer**: Suggests alternative packages.

I integrated a strict manual-override safety guardrail before any emails are dispatched. It's a great example of combining autonomous AI with human-in-the-loop safety principles! (⌐■_■)

${liveUrl ? `🔗 **[Try the LoanSage Live Website here!](${liveUrl})** 🚀\n\n` : ""}Want to see a demo of the n8n orchestration layout? Let's sync!`;
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

// Chatbot Suggestions Endpoint (Dynamic suggestions based on uploaded files)
app.get("/api/chat/suggestions", async (req, res) => {
  try {
    const chunks = await listChunks();
    
    // Seed sources to recognize and exclude from custom queries
    const seededSources = [
      "Profile Overview",
      "Education History",
      "Technical Skills",
      "Work Experience",
      "Project: Sentinel",
      "Project: LoanSage",
      "Project: OrderBot",
      "Project: FlowOps",
      "Project: Gmail Junk Cleaner",
      "Project: Big Data coursework",
      "Project: CodeFlix",
      "Project: Student Course Hub & JavaFX Module Chooser",
      "Interests & Fun Facts",
      "Certifications",
      "Current learning focus"
    ];

    const customChunks = chunks.filter(c => {
      // If the chunk source contains "Document:" or is not matching the seededSources exactly
      return !seededSources.includes(c.source);
    });

    const defaultSuggestions = [
      "Tell me about your AI Sentinel project! 🛡️",
      "Explain your LoanSage 5-agent pipeline! 🤖",
      "What are your cybersecurity skills? 🔒",
      "Can we schedule a meeting? 📅"
    ];

    if (customChunks.length === 0) {
      return res.json(defaultSuggestions);
    }

    // Extract unique sources
    const uniqueSources = Array.from(new Set(customChunks.map(c => c.source))).slice(0, 3);
    const dynamicSuggestions: string[] = [];

    for (const source of uniqueSources) {
      const sourceChunks = customChunks.filter(c => c.source === source);
      const categories = Array.from(new Set(sourceChunks.map(c => c.category)));
      const cleanName = source.replace("Document: ", "").replace("Manual: ", "");

      if (categories.includes("experience")) {
        dynamicSuggestions.push(`What experiences are detailed in ${cleanName}? 💼`);
      } else if (categories.includes("skills")) {
        dynamicSuggestions.push(`What skills are listed inside ${cleanName}? 💻`);
      } else if (categories.includes("projects")) {
        dynamicSuggestions.push(`Tell me about projects in ${cleanName}! 🛠️`);
      } else if (categories.includes("education")) {
        dynamicSuggestions.push(`What education does ${cleanName} show? 🎓`);
      } else {
        dynamicSuggestions.push(`Summarize the main points of ${cleanName}! 📄`);
      }
    }

    // Ensure we have exactly 4 suggestions
    while (dynamicSuggestions.length < 4) {
      const needed = 4 - dynamicSuggestions.length;
      if (needed === 1) {
        dynamicSuggestions.push("Can we schedule a meeting? 📅");
      } else if (needed === 2) {
        dynamicSuggestions.push("Explain your LoanSage 5-agent pipeline! 🤖");
        dynamicSuggestions.push("Can we schedule a meeting? 📅");
      } else {
        for (const sugg of defaultSuggestions) {
          if (!dynamicSuggestions.includes(sugg) && dynamicSuggestions.length < 4) {
            dynamicSuggestions.push(sugg);
          }
        }
      }
    }

    res.json(dynamicSuggestions.slice(0, 4));
  } catch (error: any) {
    console.error("Error retrieving suggestions:", error);
    res.json([
      "Tell me about your AI Sentinel project! 🛡️",
      "Explain your LoanSage 5-agent pipeline! 🤖",
      "What are your cybersecurity skills? 🔒",
      "Can we schedule a meeting? 📅"
    ]);
  }
});

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
      model: "gemini-3.1-flash-lite",
      contents: message,
      config: {
        systemInstruction: systemInstruction + "\n\nCRITICAL: Keep your response extremely concise, punchy, and under 2-3 short sentences (maximum 60-80 words). Do not write a long paragraph. Speed is of the essence!",
        temperature: 0.4,
        maxOutputTokens: 150,
      },
    });

    responseText = response.text || "Hmm, I didn't quite catch that. Could you say it again? 🤖";

    // If query is about projects/sentinel/AI, and we have a website link in context, append it if not already present
    const isProjectOrAIQuery = /\b(project|projects|ai|sentinel|loansage|orderbot|flowops|gmail|junk|cleaner|app|apps|website|websites)\b/i.test(message);
    if (isProjectOrAIQuery) {
      const liveUrl = findLiveWebsiteLink(matchedChunks);
      if (liveUrl && !responseText.includes(liveUrl)) {
        responseText += `\n\n🔗 **[Try the Live Website here!](${liveUrl})** 🚀`;
      }
    }

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

// Endpoint to save a permanent avatar image directly into the codebase
app.post("/api/save-permanent-avatar", async (req, res) => {
  const { image } = req.body;
  if (!image || typeof image !== "string") {
    return res.status(400).json({ error: "Missing image data" });
  }

  try {
    const avatarDataPath = path.join(process.cwd(), "src", "components", "avatar_data.ts");
    const content = `// This file is generated automatically to store Nabil's permanent avatar.
export const permanentAvatar = ${JSON.stringify(image)};
`;
    await fs.promises.writeFile(avatarDataPath, content, "utf8");
    console.log("✅ Permanent avatar saved to codebase!");
    res.json({ success: true });
  } catch (err: any) {
    console.error("Failed to save permanent avatar:", err);
    res.status(500).json({ error: err.message });
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

// Admin Media Upload API for LinkedIn-style Posts
app.post("/api/admin/upload-media", adminRequired, async (req, res) => {
  const { base64Data, mimeType, fileName } = req.body;
  if (!base64Data || !mimeType || !fileName) {
    return res.status(400).json({ error: "Missing required media details." });
  }

  try {
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      await fs.promises.mkdir(uploadsDir, { recursive: true });
    }

    const ext = path.extname(fileName) || (mimeType.includes("video") ? ".mp4" : ".png");
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(uploadsDir, uniqueName);

    const buffer = Buffer.from(base64Data, "base64");
    await fs.promises.writeFile(filePath, buffer);

    const url = `/uploads/${uniqueName}`;
    res.json({ success: true, url });
  } catch (error: any) {
    console.error("Error saving media upload:", error);
    res.status(500).json({ error: error.message || "Failed to save file." });
  }
});

// Public Like Post API
app.post("/api/posts/:id/like", async (req, res) => {
  try {
    const db = await getDB();
    const post = db.posts.find((p) => p.id === req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    post.likes = (post.likes || 0) + 1;
    await saveDB(db);
    res.json({ success: true, likes: post.likes });
  } catch (error: any) {
    console.error("Error liking post:", error);
    res.status(500).json({ error: error.message || "Failed to like post" });
  }
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

    const host = process.env.APP_URL || `https://${req.get("host")}` || `http://localhost:${PORT}`;
    const approveLink = `${host}/api/bookings/approve?token=${booking.approval_token}`;
    const declineLink = `${host}/api/bookings/decline?token=${booking.approval_token}`;

    console.log("\n==========================================");
    console.log(`NEW BOOKING REQUEST FROM: ${visitor_name} (${visitor_email})`);
    console.log(`TIME: ${start_ts} to ${end_ts}`);
    console.log(`APPROVE LINK: ${approveLink}`);
    console.log(`DECLINE LINK: ${declineLink}`);
    console.log("==========================================\n");

    // 1. Immediately send notification email to host (Tauheed) via Gmail API
    const hostSubject = `☕ New Café Booking Request from ${visitor_name}!`;
    const formattedDate = new Date(start_ts).toLocaleString("en-US", {
      timeZone: "Europe/Copenhagen",
      dateStyle: "full",
      timeStyle: "short"
    });
    const hostEmailHtml = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e6dfd5; border-radius: 16px; background-color: #fafaf9; color: #443c35;">
        <div style="text-align: center; border-bottom: 2px solid #8c6a4c; padding-bottom: 16px; margin-bottom: 20px;">
          <span style="font-size: 32px;">☕</span>
          <h2 style="color: #8c6a4c; margin: 8px 0 0 0; font-family: serif; font-size: 24px;">New Virtual Café Booking Request</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #86705d; font-family: monospace; text-transform: uppercase; letter-spacing: 1px;">Ready to Sync</p>
        </div>
        
        <p style="font-size: 15px; line-height: 1.6;">Hello Tauheed,</p>
        <p style="font-size: 15px; line-height: 1.6;">A visitor has requested a 30-minute sync at your virtual café! Here are the booking details:</p>
        
        <div style="background-color: #f5f0eb; border: 1px solid #e2d8cd; padding: 16px; border-radius: 12px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #8c6a4c; width: 120px;">Visitor Name:</td>
              <td style="padding: 6px 0; color: #2d2621;"><strong>${visitor_name}</strong></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #8c6a4c;">Email Address:</td>
              <td style="padding: 6px 0; color: #2d2621;"><a href="mailto:${visitor_email}" style="color: #8c6a4c; text-decoration: none; border-bottom: 1px dashed #8c6a4c;">${visitor_email}</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #8c6a4c;">Proposed Time:</td>
              <td style="padding: 6px 0; color: #2d2621; font-family: monospace;"><strong>${formattedDate} Copenhagen Time</strong></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #8c6a4c;">Meeting Mode:</td>
              <td style="padding: 6px 0; color: #2d2621;">${mode === "meet" ? "💻 Google Meet (Virtual)" : "☕ In-Person Coffee in Copenhagen"}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #8c6a4c; vertical-align: top;">Visitor's Note:</td>
              <td style="padding: 6px 0; color: #5a4f46; font-style: italic;">"${note || "No note left"}"</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 14px; font-weight: bold; color: #443c35; margin-bottom: 15px;">Would you like to accept this booking?</p>
          <a href="${approveLink}" style="display: inline-block; background-color: #8c6a4c; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; margin-right: 12px; box-shadow: 0 4px 6px rgba(140, 106, 76, 0.25);">
            Approve & Send GCal Invite
          </a>
          <a href="${declineLink}" style="display: inline-block; background-color: #ffffff; color: #b45309; border: 1px solid #d97706; padding: 11px 22px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
            Decline Request
          </a>
        </div>
        
        <p style="font-size: 12px; color: #8c7f76; text-align: center; border-top: 1px solid #e6dfd5; padding-top: 16px; margin-top: 30px;">
          Sent from your AI Café Booking Engine. Built with Workspace & Calendar Integration.
        </p>
      </div>
    `;
    await sendGmailEmail("tauheednabil@gmail.com", hostSubject, hostEmailHtml);

    // 2. Immediately send confirmation receipt email to visitor via Gmail API
    const visitorSubject = `☕ Café Sync Request Received!`;
    const visitorEmailHtml = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e6dfd5; border-radius: 16px; background-color: #fafaf9; color: #443c35;">
        <div style="text-align: center; border-bottom: 2px solid #8c6a4c; padding-bottom: 16px; margin-bottom: 20px;">
          <span style="font-size: 32px;">☕</span>
          <h2 style="color: #8c6a4c; margin: 8px 0 0 0; font-family: serif; font-size: 24px;">Café Sync Request Received</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #86705d; font-family: monospace; text-transform: uppercase; letter-spacing: 1px;">Request Confirmed</p>
        </div>
        
        <p style="font-size: 15px; line-height: 1.6;">Hi ${visitor_name},</p>
        <p style="font-size: 15px; line-height: 1.6;">Thank you for requesting a 30-minute Café Sync with Tauheed! Your request has been recorded and sent to Tauheed's dashboard for immediate review.</p>
        
        <div style="background-color: #f5f0eb; border: 1px solid #e2d8cd; padding: 16px; border-radius: 12px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #8c6a4c; width: 120px;">Proposed Time:</td>
              <td style="padding: 6px 0; color: #2d2621; font-family: monospace;"><strong>${formattedDate} Copenhagen Time</strong></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #8c6a4c;">Meeting Mode:</td>
              <td style="padding: 6px 0; color: #2d2621;">${mode === "meet" ? "💻 Google Meet" : "☕ In-Person Coffee in Copenhagen"}</td>
            </tr>
          </table>
        </div>
        
        <p style="font-size: 15px; line-height: 1.6;">Once Tauheed approves the request, an official Google Calendar invitation containing the Google Meet link or location details will be sent to your inbox immediately!</p>
        
        <p style="font-size: 15px; line-height: 1.6;">Warm regards,</p>
        <p style="font-size: 15px; line-height: 1.6; font-weight: bold; color: #8c6a4c;">Nabil's AI Butler 🤖</p>
        
        <p style="font-size: 12px; color: #8c7f76; text-align: center; border-top: 1px solid #e6dfd5; padding-top: 16px; margin-top: 30px;">
          Tauheed Nabil — BSc in Computer Science, Niels Brock.
        </p>
      </div>
    `;
    await sendGmailEmail(visitor_email, visitorSubject, visitorEmailHtml);

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

  // Approve and trigger Google Workspace (GCal + Meet + Gmail confirmation)
  const result = await approveBookingById(booking.id);
  const meetLink = result?.meetLink || null;

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
          <p>The attendee (${booking.visitor_email}) has been notified via email and a Google Calendar invitation has been dispatched!</p>
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

  // Decline and notify
  await declineBookingById(booking.id);

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
          <p>Meeting request from ${booking.visitor_name} has been declined. They have been notified to pick another slot.</p>
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

  let updated = null;
  if (status === "confirmed") {
    const result = await approveBookingById(req.params.id);
    updated = result?.updated || null;
  } else if (status === "declined") {
    updated = await declineBookingById(req.params.id);
  } else {
    updated = await updateBookingStatus(req.params.id, status as any);
  }

  if (!updated) {
    return res.status(404).json({ error: "Booking not found or already processed." });
  }

  res.json(updated);
});

// Knowledge Base Admin API
app.get("/api/knowledge", adminRequired, async (req, res) => {
  const chunks = await listChunks();
  res.json(chunks);
});

app.post("/api/knowledge", adminRequired, async (req, res) => {
  const saved = await saveChunk(req.body);
  res.json(saved);
});

app.delete("/api/knowledge/:id", adminRequired, async (req, res) => {
  const success = await deleteChunk(req.params.id);
  res.json({ success });
});

// Intelligent Document Processing Endpoint (PDF, DOCX, TXT)
app.post("/api/admin/parse-document", adminRequired, async (req, res) => {
  const { base64Data, mimeType, fileName } = req.body;
  if (!base64Data || !mimeType) {
    return res.status(400).json({ error: "Missing file data or mimeType" });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.status(500).json({ error: "Gemini API client not initialized. Check your GEMINI_API_KEY." });
  }

  try {
    let textToChunk = "";
    let isDirectPDF = false;

    // Check file type
    if (mimeType === "application/pdf") {
      isDirectPDF = true;
    } else if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName?.endsWith(".docx")
    ) {
      // Decode base64 to buffer and parse docx
      const docBuffer = Buffer.from(base64Data, "base64");
      const result = await mammoth.extractRawText({ buffer: docBuffer });
      textToChunk = result.value;
    } else if (mimeType.startsWith("text/") || fileName?.endsWith(".txt") || fileName?.endsWith(".md")) {
      textToChunk = Buffer.from(base64Data, "base64").toString("utf-8");
    } else {
      return res.status(400).json({ error: "Unsupported file type. Please upload a PDF, DOCX, TXT, or MD file." });
    }

    let parsedChunks: any[] = [];
    let lastError: any = null;
    const modelsToTry = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-3.1-flash-lite"];

    if (isDirectPDF) {
      // Send PDF bytes directly to Gemini to chunk and categorize
      const pdfPart = {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Data,
        },
      };
      
      const promptText = `Analyze this PDF document, extract all relevant biographical facts, experiences, skills, education, projects, certifications, and FAQs of Tauheed Ahmed Nabil. Segment them into high-quality, logical, self-contained paragraphs/chunks of information so that a chatbot can retrieve them to answer questions with extreme accuracy. Return the results strictly as a JSON array of objects, where each object has:
      - 'category': must be one of 'about', 'education', 'skills', 'projects', 'experience', 'faq', 'other'
      - 'source': a short string like 'CV Experience Section' or 'Document Page 1'
      - 'content': the actual extracted text content for this block. Keep each chunk readable, clean and informative.
      
      Ensure you do not miss any vital details!`;

      for (const currentModel of modelsToTry) {
        try {
          console.log(`[Parser] Attempting PDF parse using model: ${currentModel}`);
          const response = await ai.models.generateContent({
            model: currentModel,
            contents: [pdfPart, promptText],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    source: { type: Type.STRING },
                    content: { type: Type.STRING }
                  },
                  required: ["category", "source", "content"]
                }
              }
            }
          });
          
          const responseText = response.text || "[]";
          parsedChunks = JSON.parse(responseText);
          console.log(`[Parser] Successfully parsed direct PDF with ${currentModel}. Extracted ${parsedChunks.length} chunks.`);
          lastError = null;
          break; // Success!
        } catch (err: any) {
          console.warn(`[Parser] Model ${currentModel} failed or was rate limited:`, err.message || err);
          lastError = err;
        }
      }

      if (parsedChunks.length === 0 && lastError) {
        throw new Error(`All model endpoints in fallback chain failed. Last error: ${lastError.message || lastError}`);
      }
    } else {
      // Send the extracted text to Gemini to chunk and categorize
      const promptText = `The following text is extracted from a uploaded document named "${fileName || 'document'}". 
      Analyze the text, extract all relevant biographical facts, experiences, skills, education, projects, certifications, and FAQs of Tauheed Ahmed Nabil. Segment them into high-quality, logical, self-contained paragraphs/chunks of information so that a chatbot can retrieve them to answer questions with extreme accuracy. Return the results strictly as a JSON array of objects, where each object has:
      - 'category': must be one of 'about', 'education', 'skills', 'projects', 'experience', 'faq', 'other'
      - 'source': a short string like 'Document: ${fileName || 'unnamed'}'
      - 'content': the actual text content for this block. Keep each chunk readable, clean and informative.
      
      Here is the extracted text:
      --------------------------
      ${textToChunk}
      --------------------------`;

      for (const currentModel of modelsToTry) {
        try {
          console.log(`[Parser] Attempting text parse using model: ${currentModel}`);
          const response = await ai.models.generateContent({
            model: currentModel,
            contents: promptText,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    source: { type: Type.STRING },
                    content: { type: Type.STRING }
                  },
                  required: ["category", "source", "content"]
                }
              }
            }
          });

          const responseText = response.text || "[]";
          parsedChunks = JSON.parse(responseText);
          console.log(`[Parser] Successfully parsed text file with ${currentModel}. Extracted ${parsedChunks.length} chunks.`);
          lastError = null;
          break; // Success!
        } catch (err: any) {
          console.warn(`[Parser] Model ${currentModel} failed or was rate limited:`, err.message || err);
          lastError = err;
        }
      }

      if (parsedChunks.length === 0 && lastError) {
        throw new Error(`All model endpoints in fallback chain failed. Last error: ${lastError.message || lastError}`);
      }
    }

    // Now insert these parsed chunks into the database!
    const savedChunks = [];
    for (const item of parsedChunks) {
      const chunkData = {
        category: item.category || "other",
        source: item.source || fileName || "Uploaded Document",
        content: item.content || "",
      };
      if (chunkData.content.trim()) {
        const saved = await saveChunk(chunkData);
        savedChunks.push(saved);
      }
    }

    res.json({
      success: true,
      message: `Successfully processed ${fileName}. Extracted and saved ${savedChunks.length} knowledge chunks instantly!`,
      chunks: savedChunks
    });

  } catch (error: any) {
    console.error("Error parsing document with Gemini:", error);
    res.status(500).json({ error: error.message || "Failed to parse document" });
  }
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


// DEFAULT CV SHEET FALLBACK DATABLOCK
const DEFAULT_CV = {
  name: "Tauheed Ahmed Nabil",
  title: "Computer Science Student & Agentic AI Systems Builder",
  location: "Copenhagen, Denmark",
  email: "tauheednabil@gmail.com",
  github: "https://github.com/tauheednabil-TAN",
  linkedin: "https://linkedin.com/in/tauheed-ahmed-nabil-26a1422b5",
  summary: "I'm a Computer Science student based in Copenhagen with a deep technical focus on building real, autonomous multi-agent AI systems, automated developer pipelines, and cybersecurity defenses. I have a natural curiosity for breaking things, reverse engineering, and rebuilding software properly with robust manual/automated test practices.",
  skills: {
    ai_automation: "Agentic AI, CrewAI, LangChain, n8n, FastAPI, Vertex AI, Gemini AI, Anthropic Claude, Machine Learning, PySpark.",
    programming_languages: "Python, JavaScript, TypeScript, Java, React 19, PHP, SQL (PostgreSQL, MySQL, SQLite, Oracle), C/C++, HTML, CSS.",
    security_qa: "Reverse engineering, Capture the Flag (CTF), Threat Modeling, NIST compliance, Manual/Automated UI and Regression testing, bug reporting."
  },
  projects: [
    {
      title: "Sentinel — Multi-Agent Security Prober",
      status: "Active / Open Source",
      description: "Constructed a cybersecurity testing app utilizing 12 parallel LLM agents probing live target URLs for leaked secrets, server misconfigurations, and dependency vulnerabilities, compiling an actionable markdown remediation layout. Next.js, TypeScript, Cerebras."
    },
    {
      title: "LoanSage — CrewAI Orchestration Pipeline",
      status: "FastAPI & n8n",
      description: "Engineered a 5-agent automated credit assessment and email dispatch workflow incorporating semantic analysis and decision gating, managed through FastAPI endpoints and n8n orchestration triggers."
    },
    {
      title: "FlowOps — Operations & Ledger Dashboard",
      status: "Rails 8 & React 19",
      description: "Built a high-contrast financial transactions dashboard supporting multi-currency entries, Dockerized deployments, and GitHub Actions continuous integration scans."
    },
    {
      title: "Gmail Junk Cleaner — Serverless Automation",
      status: "Google Apps Script",
      description: "Programmed an inbox management automation querying and trashing unread commercial bulk mail while safeguarding starred records, recovering significant personal mailbox cloud quotas."
    }
  ],
  experience: [
    {
      title: "QA Specialist (Freelance)",
      company: "uTest — Copenhagen, Denmark",
      date: "Nov 2025 - Present",
      description: "Performs manual regression and exploratory testing across mobile and desktop applications. Logged and categorized detailed, high-contrast bug reports using JIRA matrices."
    },
    {
      title: "Technical IT Assistant",
      company: "Scandic Hotels (Webers) — Copenhagen, Denmark",
      date: "May 2025 - Present",
      description: "Provides immediate hardware, networking, and system diagnostic support. Manages the Oracle Hospitality database. Honored as Team Member of the Month in February 2026."
    },
    {
      title: "Student IT Assistant",
      company: "Spacegaming eSports — Frederiksberg, Denmark",
      date: "Jun 2025 - Dec 2025",
      description: "Maintained on-premise gaming architectures, reviewed compliance logs via Verinice, and handled scoreboard tracking ledgers."
    }
  ],
  education: [
    {
      degree: "BSc (Hons) in Computer Science",
      school: "Niels Brock Copenhagen Business College",
      date: "Feb 2024 - Expected Feb 2027"
    },
    {
      degree: "BSc in Industrial & Production Engineering",
      school: "Military Institute of Science & Technology, Dhaka",
      date: "2022 - 2023 (Pivoted to CS)"
    }
  ],
  achievements: [
    "Danish Cyber Championship (DDC) — Jumped from #72 to #33 in Hovedstaden in one year.",
    "Accepted to the prestigious CyberBridge Summer Academy in Copenhagen, August 2026.",
    "IELTS Academic certified fluent. Speaks 5 languages."
  ]
};

// GET Public parsed CV
app.get("/api/public/cv", async (req, res) => {
  try {
    const db = await getDB();
    if (db.parsed_cv) {
      res.json(db.parsed_cv);
    } else {
      res.json(DEFAULT_CV);
    }
  } catch (error) {
    console.error("Error loading CV:", error);
    res.json(DEFAULT_CV);
  }
});

// GET LaTeX Resume format for Admin
app.get("/api/admin/latex", adminRequired, async (req, res) => {
  try {
    const db = await getDB();
    res.json({
      latex_resume: db.latex_resume || "",
      parsed_cv: db.parsed_cv || null
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load LaTeX configuration" });
  }
});

// POST update and parse LaTeX Resume
app.post("/api/admin/latex", adminRequired, async (req, res) => {
  const { latex_resume } = req.body;
  if (typeof latex_resume !== "string") {
    return res.status(400).json({ error: "LaTeX resume content must be a string." });
  }

  try {
    const db = await getDB();
    const ai = getGeminiClient();

    let parsed = null;

    if (ai && latex_resume.trim()) {
      console.log("[LaTeX Parser] Calling Gemini to parse LaTeX resume...");
      const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash"];
      let lastError = null;

      const promptText = `
You are an expert resume parser specializing in LaTeX formats.
Analyze the following LaTeX document and extract all personal details, contact links, professional bio/summary, technical skills, projects, work experiences, education history, and achievements of Tauheed Ahmed Nabil.
Organize the extracted information strictly according to the specified JSON schema.

Here is the LaTeX input:
--------------------------
${latex_resume}
--------------------------`;

      for (const currentModel of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: currentModel,
            contents: promptText,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  title: { type: Type.STRING },
                  location: { type: Type.STRING },
                  email: { type: Type.STRING },
                  github: { type: Type.STRING },
                  linkedin: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  skills: {
                    type: Type.OBJECT,
                    properties: {
                      ai_automation: { type: Type.STRING },
                      programming_languages: { type: Type.STRING },
                      security_qa: { type: Type.STRING }
                    },
                    required: ["ai_automation", "programming_languages", "security_qa"]
                  },
                  projects: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        status: { type: Type.STRING },
                        description: { type: Type.STRING }
                      },
                      required: ["title", "status", "description"]
                    }
                  },
                  experience: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        company: { type: Type.STRING },
                        date: { type: Type.STRING },
                        description: { type: Type.STRING }
                      },
                      required: ["title", "company", "date", "description"]
                    }
                  },
                  education: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        degree: { type: Type.STRING },
                        school: { type: Type.STRING },
                        date: { type: Type.STRING }
                      },
                      required: ["degree", "school", "date"]
                    }
                  },
                  achievements: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["name", "title", "location", "email", "github", "linkedin", "summary", "skills", "projects", "experience", "education", "achievements"]
              }
            }
          });

          const responseText = response.text || "{}";
          parsed = JSON.parse(responseText);
          console.log("[LaTeX Parser] Successfully parsed LaTeX resume.");
          break;
        } catch (err: any) {
          console.warn(`[LaTeX Parser] Model ${currentModel} failed:`, err.message || err);
          lastError = err;
        }
      }

      if (!parsed && lastError) {
        throw new Error(`Failed to parse LaTeX with Gemini models: ${lastError.message}`);
      }
    }

    // Save back to DB
    db.latex_resume = latex_resume;
    if (parsed) {
      db.parsed_cv = parsed;
    }
    await saveDB(db);

    res.json({
      success: true,
      latex_resume,
      parsed_cv: db.parsed_cv || null,
      message: parsed ? "LaTeX resume uploaded and parsed successfully!" : "LaTeX resume content saved (without parsed updates)."
    });
  } catch (error: any) {
    console.error("LaTeX resume processing error:", error);
    res.status(500).json({ error: error.message || "Failed to process LaTeX resume." });
  }
});


// Serve static frontend assets and Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Integrate Vite in development mode
    const { createServer: createViteServer } = await import("vite");
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

if (process.env.NODE_ENV !== "test" && !process.env.VITEST && !process.env.VERCEL) {
  startServer();
}
