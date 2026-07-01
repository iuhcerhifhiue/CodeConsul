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
    <div className="h-full flex flex-col bg-white">
      {/* Plan badge */}
      <div className="p-3 border-b border-black shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider text-gray-400">CURRENT PLAN</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${plan.accent ? 'bg-editorial text-black' : 'bg-black text-white'}`}>
            {plan.name.toUpperCase()}
          </span>
        </div>
        <p className="text-[11px] text-gray-400 mt-1">{plan.agents.length} specialists available</p>
      </div>

      {/* CEO */}
      <div className="px-3 py-2.5 border-b border-black bg-[#FFFBEA]">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-black shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold">Oikos (CEO)</p>
            <p className="text-[10px] text-gray-400">Orchestrates & delegates</p>
          </div>
          <span className="ml-auto text-[9px] bg-black text-white px-1.5 py-0.5 rounded font-bold">ALWAYS ON</span>
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
              className={`flex items-center gap-2 px-3 py-2 border-b border-gray-100 transition-colors ${
                active ? 'bg-[#FFFBEA]' : ''
              } ${!available ? 'opacity-40' : 'hover:bg-gray-50'}`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-black' : 'text-gray-500'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">{info.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{info.description}</p>
              </div>
              {!available ? (
                <Lock className="w-3 h-3 text-gray-300 shrink-0" />
              ) : active ? (
                <div className="flex items-center gap-1 shrink-0">
                  <div className="w-2 h-2 rounded-full bg-editorial animate-pulse" />
                  <span className="text-[9px] font-bold text-black">LIVE</span>
                </div>
              ) : (
                <Check className="w-3 h-3 text-gray-300 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Upgrade */}
      {currentPlan !== 'builder' && (
        <Link
          to="/plans"
          className="flex items-center justify-center gap-1.5 p-3 border-t border-black text-xs font-bold hover:bg-editorial transition-colors shrink-0"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          UPGRADE PLAN
        </Link>
      )}
    </div>
  );
}