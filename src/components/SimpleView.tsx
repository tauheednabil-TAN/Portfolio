import React from "react";
import { Mail, MapPin, Github, Linkedin, ExternalLink, Calendar, Award, GraduationCap, Briefcase, Code, Terminal, Shield } from "lucide-react";

export default function SimpleView() {
  const email = "tauheednabil@gmail.com";
  const github = "https://github.com/tauheednabil-TAN";
  const linkedin = "https://linkedin.com/in/tauheed-ahmed-nabil-26a1422b5";

  return (
    <div className="max-w-4xl mx-auto bg-white/[0.03] backdrop-blur-2xl border border-white/15 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-6 md:p-10 font-sans text-stone-100">
      {/* Header section */}
      <div className="border-b border-white/10 pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-display text-stone-50 tracking-tight">
            Tauheed Ahmed Nabil
          </h1>
          <p className="text-sm md:text-base font-semibold text-amber-500 font-display mt-1.5">
            Computer Science Student & Agentic AI Systems Builder
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-xs text-stone-400 font-mono">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-500/75" /> Copenhagen, Denmark
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-amber-500/75" /> {email}
            </span>
          </div>
        </div>

        {/* Action Links */}
        <div className="flex gap-3 text-xs font-mono">
          <a
            href={github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-zinc-900/60 hover:bg-zinc-800 text-stone-200 hover:text-stone-50 px-3.5 py-2 rounded-xl border border-white/10 transition-colors"
          >
            <Github className="w-3.5 h-3.5 text-amber-500/80" /> GitHub <ExternalLink className="w-3 h-3 text-stone-500" />
          </a>
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-zinc-900/60 hover:bg-zinc-800 text-stone-200 hover:text-stone-50 px-3.5 py-2 rounded-xl border border-white/10 transition-colors"
          >
            <Linkedin className="w-3.5 h-3.5 text-amber-500/80" /> LinkedIn <ExternalLink className="w-3 h-3 text-stone-500" />
          </a>
        </div>
      </div>

      {/* Summary Section */}
      <section className="mb-8">
        <h2 className="text-sm font-bold font-display text-stone-100 border-l-4 border-amber-500 pl-3 mb-3.5 uppercase tracking-wider">
          Professional Bio
        </h2>
        <p className="text-xs md:text-sm text-stone-300 leading-relaxed">
          I'm a Computer Science student based in Copenhagen with a deep technical focus on building real, autonomous multi-agent AI systems, automated developer pipelines, and cybersecurity defenses. I have a natural curiosity for breaking things, reverse engineering, and rebuilding software properly with robust manual/automated test practices.
        </p>
      </section>

      {/* Skills Bento Grid */}
      <section className="mb-8">
        <h2 className="text-sm font-bold font-display text-stone-100 border-l-4 border-amber-500 pl-3 mb-4.5 uppercase tracking-wider">
          Technical Skillset
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white/[0.02] border border-white/10 p-4.5 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.15)]">
            <h3 className="text-xs font-bold text-stone-100 font-mono uppercase mb-2 flex items-center gap-1.5">
              <Code className="w-4 h-4 text-amber-500" /> AI & Automation
            </h3>
            <p className="text-[11px] text-stone-300 leading-relaxed">
              Agentic AI, CrewAI, LangChain, n8n, FastAPI, Vertex AI, Gemini AI, Anthropic Claude, Machine Learning, PySpark.
            </p>
          </div>
          <div className="bg-white/[0.02] border border-white/10 p-4.5 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.15)]">
            <h3 className="text-xs font-bold text-stone-100 font-mono uppercase mb-2 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-amber-500" /> Programming Languages
            </h3>
            <p className="text-[11px] text-stone-300 leading-relaxed">
              Python, JavaScript, TypeScript, Java, React 19, PHP, SQL (PostgreSQL, MySQL, SQLite, Oracle), C/C++, HTML, CSS.
            </p>
          </div>
          <div className="bg-white/[0.02] border border-white/10 p-4.5 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.15)]">
            <h3 className="text-xs font-bold text-stone-100 font-mono uppercase mb-2 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-500" /> Security & QA Testing
            </h3>
            <p className="text-[11px] text-stone-300 leading-relaxed">
              Reverse engineering, Capture the Flag (CTF), Threat Modeling, NIST compliance, Manual/Automated UI and Regression testing, bug reporting.
            </p>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="mb-8">
        <h2 className="text-sm font-bold font-display text-stone-100 border-l-4 border-amber-500 pl-3 mb-4.5 uppercase tracking-wider">
          Featured Engineering Projects
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-white/10 bg-white/[0.01] hover:bg-white/[0.03] rounded-2xl p-4.5 hover:border-amber-500/25 hover:scale-[1.01] transition-all duration-300 shadow-md">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
              <h3 className="text-xs md:text-sm font-bold text-stone-100">Sentinel — Multi-Agent Security Prober</h3>
              <span className="text-[9px] font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-amber-400">Active / Open Source</span>
            </div>
            <p className="text-[11px] text-stone-300 leading-relaxed mt-1">
              Constructed a cybersecurity testing app utilizing 12 parallel LLM agents probing live target URLs for leaked secrets, server misconfigurations, and dependency vulnerabilities, compiling an actionable markdown remediation layout. Next.js, TypeScript, Cerebras.
            </p>
          </div>

          <div className="border border-white/10 bg-white/[0.01] hover:bg-white/[0.03] rounded-2xl p-4.5 hover:border-amber-500/25 hover:scale-[1.01] transition-all duration-300 shadow-md">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
              <h3 className="text-xs md:text-sm font-bold text-stone-100">LoanSage — CrewAI Orchestration Pipeline</h3>
              <span className="text-[9px] font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-amber-400">FastAPI & n8n</span>
            </div>
            <p className="text-[11px] text-stone-300 leading-relaxed mt-1">
              Engineered a 5-agent automated credit assessment and email dispatch workflow incorporating semantic analysis and decision gating, managed through FastAPI endpoints and n8n orchestration triggers.
            </p>
          </div>

          <div className="border border-white/10 bg-white/[0.01] hover:bg-white/[0.03] rounded-2xl p-4.5 hover:border-amber-500/25 hover:scale-[1.01] transition-all duration-300 shadow-md">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
              <h3 className="text-xs md:text-sm font-bold text-stone-100">FlowOps — Operations & Ledger Dashboard</h3>
              <span className="text-[9px] font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-amber-400">Rails 8 & React 19</span>
            </div>
            <p className="text-[11px] text-stone-300 leading-relaxed mt-1">
              Built a high-contrast financial transactions dashboard supporting multi-currency entries, Dockerized deployments, and GitHub Actions continuous integration scans.
            </p>
          </div>

          <div className="border border-white/10 bg-white/[0.01] hover:bg-white/[0.03] rounded-2xl p-4.5 hover:border-amber-500/25 hover:scale-[1.01] transition-all duration-300 shadow-md">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
              <h3 className="text-xs md:text-sm font-bold text-stone-100">Gmail Junk Cleaner — Serverless Automation</h3>
              <span className="text-[9px] font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-amber-400">Google Apps Script</span>
            </div>
            <p className="text-[11px] text-stone-300 leading-relaxed mt-1">
              Programmed an inbox management automation querying and trashing unread commercial bulk mail while safeguarding starred records, recovering significant personal mailbox cloud quotas.
            </p>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="mb-8">
        <h2 className="text-sm font-bold font-display text-stone-100 border-l-4 border-amber-500 pl-3 mb-4.5 uppercase tracking-wide">
          Work History
        </h2>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2 justify-between">
            <div>
              <h3 className="text-xs md:text-sm font-bold text-stone-50">QA Specialist (Freelance)</h3>
              <p className="text-[11px] font-medium text-stone-400">uTest — Copenhagen, Denmark</p>
            </div>
            <span className="text-[10px] font-mono text-amber-500 font-bold md:text-right">Nov 2025 - Present</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed -mt-2">
            Performs manual regression and exploratory testing across mobile and desktop applications. Logged and categorized detailed, high-contrast bug reports using JIRA matrices.
          </p>

          <div className="flex flex-col md:flex-row gap-2 justify-between pt-2">
            <div>
              <h3 className="text-xs md:text-sm font-bold text-stone-50">Technical IT Assistant</h3>
              <p className="text-[11px] font-medium text-stone-400">Scandic Hotels (Webers) — Copenhagen, Denmark</p>
            </div>
            <span className="text-[10px] font-mono text-amber-500 font-bold md:text-right">May 2025 - Present</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed -mt-2">
            Provides immediate hardware, networking, and system diagnostic support. Manages the Oracle Hospitality database. Honored as Team Member of the Month in February 2026.
          </p>

          <div className="flex flex-col md:flex-row gap-2 justify-between pt-2">
            <div>
              <h3 className="text-xs md:text-sm font-bold text-stone-50">Student IT Assistant</h3>
              <p className="text-[11px] font-medium text-stone-400">Spacegaming eSports — Frederiksberg, Denmark</p>
            </div>
            <span className="text-[10px] font-mono text-amber-500 font-bold md:text-right">Jun 2025 - Dec 2025</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed -mt-2">
            Maintained on-premise gaming architectures, reviewed compliance logs via Verinice, and handled scoreboard tracking ledgers.
          </p>
        </div>
      </section>

      {/* Education & Credentials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Education */}
        <section>
          <h2 className="text-sm font-bold font-display text-stone-100 border-l-4 border-amber-500 pl-3 mb-3.5 uppercase tracking-wider">
            Education
          </h2>
          <div className="space-y-3.5">
            <div>
              <h3 className="text-xs md:text-sm font-bold text-stone-50">BSc (Hons) in Computer Science</h3>
              <p className="text-xs text-stone-400 font-medium">Niels Brock Copenhagen Business College</p>
              <p className="text-[10px] text-stone-500 font-mono mt-0.5">Feb 2024 - Expected Feb 2027</p>
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-bold text-stone-50">BSc in Industrial & Production Engineering</h3>
              <p className="text-xs text-stone-400 font-medium">Military Institute of Science & Technology, Dhaka</p>
              <p className="text-[10px] text-stone-500 font-mono mt-0.5">2022 - 2023 (Pivoted to CS)</p>
            </div>
          </div>
        </section>

        {/* Certifications */}
        <section>
          <h2 className="text-sm font-bold font-display text-stone-100 border-l-4 border-amber-500 pl-3 mb-3.5 uppercase tracking-wide">
            Key Achievements
          </h2>
          <ul className="text-xs text-stone-300 space-y-2.5 leading-relaxed font-sans">
            <li className="flex items-start gap-1.5">
              <Award className="text-amber-500 flex-shrink-0 mt-0.5 w-4 h-4" />
              <span>Danish Cyber Championship (DDC) — Jumped from #72 to <strong className="text-amber-400">#33 in Hovedstaden</strong> in one year.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <Award className="text-amber-500 flex-shrink-0 mt-0.5 w-4 h-4" />
              <span>Accepted to the prestigious <strong className="text-amber-400">CyberBridge Summer Academy</strong> in Copenhagen, August 2026.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <Award className="text-amber-500 flex-shrink-0 mt-0.5 w-4 h-4" />
              <span>IELTS Academic certified fluent. Speaks 5 languages.</span>
            </li>
          </ul>
        </section>
      </div>

      {/* Footer Sign-off */}
      <div className="border-t border-white/10 pt-6 text-center text-xs text-stone-400 font-mono flex items-center justify-between flex-wrap gap-4">
        <span>Curriculum Vitae — Tauheed Ahmed Nabil</span>
        <span>Copenhagen, Denmark 🇩🇰</span>
      </div>
    </div>
  );
}
