import { Link } from 'react-router-dom';
import {
  Layout, Server, Terminal, Eye,
  Database, Bug, Shield, Compass,
} from 'lucide-react';

const agents = [
  { name: 'UI Builder', icon: Layout, desc: 'Frontend & components' },
  { name: 'Backend Engineer', icon: Server, desc: 'APIs & server logic' },
  { name: 'Security Auditor', icon: Shield, desc: 'Vulnerability scanning' },
  { name: 'Terminal Ops', icon: Terminal, desc: 'DevOps & CI/CD' },
  { name: 'Bug Fixer', icon: Bug, desc: 'Root cause analysis' },
  { name: 'Database Engineer', icon: Database, desc: 'Schemas & migrations' },
  { name: 'Code Reviewer', icon: Eye, desc: 'Quality & best practices' },
  { name: 'Architect', icon: Compass, desc: 'System design' },
];

export default function AgentGrid() {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.06] rounded-xl overflow-hidden border border-white/[0.06]">
        {agents.map((agent, i) => (
          <div key={i} className="bg-[#0D0D0F] p-6 hover:bg-[#131316] transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4 group-hover:bg-[#C8FF00] transition-colors">
              <agent.icon className="w-5 h-5 text-white/60 group-hover:text-black transition-colors" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">{agent.name}</h3>
            <p className="text-xs text-white/40">{agent.desc}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 mt-6">
        <span className="text-sm text-white/40">+ 14 more specialists</span>
        <Link to="/plans" className="text-sm text-[#C8FF00] hover:underline">View all →</Link>
      </div>
    </div>
  );
}