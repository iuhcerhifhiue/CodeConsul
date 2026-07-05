import { Link } from 'react-router-dom';
import { PLANS, AGENT_INFO } from '@/lib/plans';
import {
  Crown, Lock, Check, ArrowUp, Layout, Server, Terminal, CheckCircle, Eye,
  Database, Network, Gauge, FileText, Bug, Shield, Cloud, Smartphone,
  BarChart3, Wand2, Compass, Brain, Zap, Accessibility, ArrowRightLeft, Activity, Box, Globe,
} from 'lucide-react';

const ICON_MAP = {
  Layout, Server, Terminal, CheckCircle, Eye,
  Database, Network, Gauge, FileText, Bug, Shield, Cloud, Smartphone,
  BarChart3, Wand2, Compass, Brain, Zap, Accessibility, ArrowRightLeft, Activity, Globe,
};

export default function AgentRoster({ currentPlan, activeAgents = [] }) {
  const plan = PLANS[currentPlan] || PLANS.free;

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA] border-r border-black/[0.06]">
      {/* Plan badge */}
      <div className="p-4 border-b border-black/[0.06] shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-wider text-black/30 uppercase">Current Plan</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${plan.accent ? 'bg-[#5046E5] text-white' : 'bg-[#0D0D0D] text-white'}`}>
            {plan.name.toUpperCase()}
          </span>
        </div>
        <p className="text-[11px] text-black/40 mt-1.5">{plan.agents.length} specialists available</p>
      </div>

      {/* CEO */}
      <div className="px-4 py-3 border-b border-black/[0.06] bg-[#5046E5]/[0.03]">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-[#5046E5] shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold">Oikos (CEO)</p>
            <p className="text-[10px] text-black/40">Orchestrates & delegates</p>
          </div>
          <span className="ml-auto text-[9px] bg-[#5046E5] text-white px-1.5 py-0.5 rounded font-bold">ON</span>
        </div>
      </div>

      {/* Agent list */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(AGENT_INFO).map(([key, info]) => {
          const Icon = ICON_MAP[info.icon] || Box;
          const available = plan.agents.includes(key);
          const active = activeAgents.includes(key);

          return (
            <div
              key={key}
              className={`flex items-center gap-2 px-4 py-2.5 border-b border-black/[0.04] transition-colors ${
                active ? 'bg-[#5046E5]/[0.05]' : ''
              } ${!available ? 'opacity-30' : 'hover:bg-black/[0.02]'}`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-[#5046E5]' : 'text-black/50'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate">{info.name}</p>
                <p className="text-[10px] text-black/30 truncate">{info.description}</p>
              </div>
              {!available ? (
                <Lock className="w-3 h-3 text-black/20 shrink-0" />
              ) : active ? (
                <div className="flex items-center gap-1 shrink-0">
                  <div className="w-2 h-2 rounded-full bg-[#5046E5] animate-pulse" />
                  <span className="text-[9px] font-bold text-[#5046E5]">LIVE</span>
                </div>
              ) : (
                <Check className="w-3 h-3 text-black/15 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Upgrade */}
      {currentPlan !== 'builder' && (
        <Link
          to="/plans"
          className="flex items-center justify-center gap-1.5 p-3 border-t border-black/[0.06] text-xs font-semibold hover:bg-[#5046E5]/[0.05] transition-colors shrink-0"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          UPGRADE PLAN
        </Link>
      )}
    </div>
  );
}