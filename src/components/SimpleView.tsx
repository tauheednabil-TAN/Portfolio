import React, { useState, useEffect } from "react";
import { Mail, MapPin, Github, Linkedin, ExternalLink, Award, Code, Terminal, Shield, Loader } from "lucide-react";
import { ParsedCV } from "../types.js";

const DEFAULT_CV: ParsedCV = {
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

export default function SimpleView() {
  const [cv, setCv] = useState<ParsedCV>(DEFAULT_CV);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/public/cv")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (active && data) {
          setCv(data);
        }
      })
      .catch((err) => {
        console.warn("Could not retrieve custom parsed CV, using default profile info:", err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto bg-white/[0.03] backdrop-blur-2xl border border-white/15 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-6 md:p-10 font-sans text-stone-100 animate-fade-in relative">
      {isLoading && (
        <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] text-amber-500 font-mono">
          <Loader className="w-3.5 h-3.5 animate-spin" />
          <span>Synchronizing CV...</span>
        </div>
      )}

      {/* Header section */}
      <div className="border-b border-white/10 pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-display text-stone-50 tracking-tight">
            {cv.name}
          </h1>
          <p className="text-sm md:text-base font-semibold text-amber-500 font-display mt-1.5">
            {cv.title}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-xs text-stone-400 font-mono">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-500/75" /> {cv.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-amber-500/75" /> {cv.email}
            </span>
          </div>
        </div>

        {/* Action Links */}
        <div className="flex gap-3 text-xs font-mono">
          {cv.github && (
            <a
              href={cv.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-zinc-900/60 hover:bg-zinc-800 text-stone-200 hover:text-stone-50 px-3.5 py-2 rounded-xl border border-white/10 transition-colors"
            >
              <Github className="w-3.5 h-3.5 text-amber-500/80" /> GitHub <ExternalLink className="w-3 h-3 text-stone-500" />
            </a>
          )}
          {cv.linkedin && (
            <a
              href={cv.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-zinc-900/60 hover:bg-zinc-800 text-stone-200 hover:text-stone-50 px-3.5 py-2 rounded-xl border border-white/10 transition-colors"
            >
              <Linkedin className="w-3.5 h-3.5 text-amber-500/80" /> LinkedIn <ExternalLink className="w-3 h-3 text-stone-500" />
            </a>
          )}
        </div>
      </div>

      {/* Summary Section */}
      {cv.summary && (
        <section className="mb-8">
          <h2 className="text-sm font-bold font-display text-stone-100 border-l-4 border-amber-500 pl-3 mb-3.5 uppercase tracking-wider">
            Professional Bio
          </h2>
          <p className="text-xs md:text-sm text-stone-300 leading-relaxed">
            {cv.summary}
          </p>
        </section>
      )}

      {/* Skills Bento Grid */}
      {cv.skills && (
        <section className="mb-8">
          <h2 className="text-sm font-bold font-display text-stone-100 border-l-4 border-amber-500 pl-3 mb-4.5 uppercase tracking-wider">
            Technical Skillset
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {cv.skills.ai_automation && (
              <div className="bg-white/[0.02] border border-white/10 p-4.5 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.15)]">
                <h3 className="text-xs font-bold text-stone-100 font-mono uppercase mb-2 flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-amber-500" /> AI & Automation
                </h3>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  {cv.skills.ai_automation}
                </p>
              </div>
            )}
            {cv.skills.programming_languages && (
              <div className="bg-white/[0.02] border border-white/10 p-4.5 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.15)]">
                <h3 className="text-xs font-bold text-stone-100 font-mono uppercase mb-2 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-amber-500" /> Programming Languages
                </h3>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  {cv.skills.programming_languages}
                </p>
              </div>
            )}
            {cv.skills.security_qa && (
              <div className="bg-white/[0.02] border border-white/10 p-4.5 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.15)]">
                <h3 className="text-xs font-bold text-stone-100 font-mono uppercase mb-2 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-500" /> Security & QA Testing
                </h3>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  {cv.skills.security_qa}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Projects Section */}
      {cv.projects && cv.projects.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold font-display text-stone-100 border-l-4 border-amber-500 pl-3 mb-4.5 uppercase tracking-wider">
            Featured Engineering Projects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cv.projects.map((project, idx) => (
              <div key={idx} className="border border-white/10 bg-white/[0.01] hover:bg-white/[0.03] rounded-2xl p-4.5 hover:border-amber-500/25 hover:scale-[1.01] transition-all duration-300 shadow-md">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
                  <h3 className="text-xs md:text-sm font-bold text-stone-100">{project.title}</h3>
                  {project.status && (
                    <span className="text-[9px] font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-amber-400">
                      {project.status}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-300 leading-relaxed mt-1">
                  {project.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Experience Section */}
      {cv.experience && cv.experience.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold font-display text-stone-100 border-l-4 border-amber-500 pl-3 mb-4.5 uppercase tracking-wide">
            Work History
          </h2>
          <div className="space-y-4">
            {cv.experience.map((exp, idx) => (
              <div key={idx} className="pt-2 first:pt-0">
                <div className="flex flex-col md:flex-row gap-2 justify-between">
                  <div>
                    <h3 className="text-xs md:text-sm font-bold text-stone-50">{exp.title}</h3>
                    <p className="text-[11px] font-medium text-stone-400">{exp.company}</p>
                  </div>
                  <span className="text-[10px] font-mono text-amber-500 font-bold md:text-right">{exp.date}</span>
                </div>
                <p className="text-[11px] text-stone-300 leading-relaxed mt-1.5">
                  {exp.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education & Credentials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Education */}
        {cv.education && cv.education.length > 0 && (
          <section>
            <h2 className="text-sm font-bold font-display text-stone-100 border-l-4 border-amber-500 pl-3 mb-3.5 uppercase tracking-wider">
              Education
            </h2>
            <div className="space-y-3.5">
              {cv.education.map((edu, idx) => (
                <div key={idx}>
                  <h3 className="text-xs md:text-sm font-bold text-stone-50">{edu.degree}</h3>
                  <p className="text-xs text-stone-400 font-medium">{edu.school}</p>
                  <p className="text-[10px] text-stone-500 font-mono mt-0.5">{edu.date}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Key Achievements */}
        {cv.achievements && cv.achievements.length > 0 && (
          <section>
            <h2 className="text-sm font-bold font-display text-stone-100 border-l-4 border-amber-500 pl-3 mb-3.5 uppercase tracking-wide">
              Key Achievements
            </h2>
            <ul className="text-xs text-stone-300 space-y-2.5 leading-relaxed font-sans">
              {cv.achievements.map((ach, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <Award className="text-amber-500 flex-shrink-0 mt-0.5 w-4 h-4" />
                  <span>{ach}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Footer Sign-off */}
      <div className="border-t border-white/10 pt-6 text-center text-xs text-stone-400 font-mono flex items-center justify-between flex-wrap gap-4">
        <span>Curriculum Vitae — {cv.name}</span>
        <span>{cv.location} 🇩🇰</span>
      </div>
    </div>
  );
}
