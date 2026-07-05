import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { PLANS, AGENT_INFO, PLAN_ORDER } from '@/lib/plans';
import { Check, ArrowLeft, Crown, Lock } from 'lucide-react';
import Logo from '@/components/Logo';

export default function Plans() {
  const [currentPlan, setCurrentPlan] = useState('free');
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const u = await base44.auth.me();
      setCurrentPlan(u.plan || 'free');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectPlan = async (planKey) => {
    setSwitching(true);
    try {
      await base44.auth.updateMe({ plan: planKey });
      setCurrentPlan(planKey);
    } catch (err) {
      console.error(err);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-body antialiased">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-10 py-3.5">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={26} />
            <span className="font-heading font-bold text-lg tracking-tight">Consul</span>
          </Link>
          <Link to="/dashboard" className="text-sm text-black/50 hover:text-black transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16">
        {/* Header */}
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-semibold tracking-wider text-[#5046E5] mb-2 uppercase">Plans</p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">Choose your engineering team</h1>
          <p className="text-base text-black/50 mt-3">
            Every plan includes Oikos (CEO) who orchestrates the specialist agents. Pick a plan to unlock more specialists — no payment required.
          </p>
        </div>

        {/* Plan grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLAN_ORDER.map((key) => {
            const plan = PLANS[key];
            const isCurrent = currentPlan === key;
            const lockedAgents = Object.entries(AGENT_INFO).filter(([k]) => !plan.agents.includes(k));

            return (
              <div
                key={key}
                className={`rounded-2xl p-6 flex flex-col border transition-all ${
                  isCurrent
                    ? 'border-[#5046E5] bg-[#5046E5]/[0.02] ring-1 ring-[#5046E5]/20'
                    : plan.accent
                      ? 'border-black/[0.12] bg-[#0D0D0D] text-white'
                      : 'border-black/[0.06] bg-white hover:border-black/[0.12]'
                }`}
              >
                {/* Plan name */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold ${plan.accent && !isCurrent ? 'text-white' : ''}`}>{plan.name}</h3>
                  {isCurrent && (
                    <span className="text-[9px] bg-[#5046E5] text-white px-2 py-0.5 rounded font-bold">CURRENT</span>
                  )}
                </div>

                {/* Agent count */}
                <div className="mb-4">
                  <span className={`text-4xl font-bold font-heading ${plan.accent && !isCurrent ? 'text-white' : ''}`}>{plan.agents.length}</span>
                  <span className={`text-sm ${plan.accent && !isCurrent ? 'text-white/40' : 'text-black/40'}`}> agents</span>
                </div>

                <p className={`text-xs mb-6 ${plan.accent && !isCurrent ? 'text-white/50' : 'text-black/40'}`}>{plan.description}</p>

                {/* Agent list */}
                <div className="space-y-2 mb-6 flex-1">
                  <div className={`flex items-center gap-2 pb-2 border-b ${plan.accent && !isCurrent ? 'border-white/[0.08]' : 'border-black/[0.06]'}`}>
                    <Crown className={`w-3.5 h-3.5 shrink-0 ${plan.accent && !isCurrent ? 'text-[#5046E5]' : 'text-[#5046E5]'}`} />
                    <span className="text-xs font-bold">Oikos (CEO)</span>
                    <span className={`text-[9px] ml-auto ${plan.accent && !isCurrent ? 'text-white/30' : 'text-black/30'}`}>orchestrator</span>
                  </div>
                  {plan.agents.map((agentKey) => {
                    const info = AGENT_INFO[agentKey];
                    return (
                      <div key={agentKey} className="flex items-center gap-2">
                        <Check className={`w-3 h-3 shrink-0 ${plan.accent && !isCurrent ? 'text-[#5046E5]' : 'text-[#5046E5]'}`} />
                        <span className={`text-xs font-medium ${plan.accent && !isCurrent ? 'text-white/80' : ''}`}>{info.name}</span>
                      </div>
                    );
                  })}
                  {lockedAgents.slice(0, 4).map(([k, info]) => (
                    <div key={k} className={`flex items-center gap-2 ${plan.accent && !isCurrent ? 'opacity-30' : 'opacity-30'}`}>
                      <Lock className="w-3 h-3 shrink-0" />
                      <span className="text-xs">{info.name}</span>
                    </div>
                  ))}
                  {lockedAgents.length > 4 && (
                    <p className={`text-[10px] pl-5 ${plan.accent && !isCurrent ? 'text-white/30' : 'text-black/30'}`}>
                      + {lockedAgents.length - 4} more locked
                    </p>
                  )}
                </div>

                {/* Button */}
                <button
                  onClick={() => selectPlan(key)}
                  disabled={isCurrent || switching}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-[#F4F4F5] text-black/30 cursor-default'
                      : plan.accent && !isCurrent
                        ? 'bg-[#5046E5] text-white hover:bg-[#5046E5]/90'
                        : 'bg-[#0D0D0D] text-white hover:bg-black/80'
                  }`}
                >
                  {isCurrent ? '✓ Current Plan' : `Select ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Info note */}
        <div className="mt-8 border border-black/[0.06] rounded-xl p-6 bg-[#FAFAFA]">
          <p className="text-xs text-black/50 leading-relaxed">
            <span className="font-bold text-black">How it works:</span> When you submit a task, Oikos (CEO) analyzes it and delegates sub-tasks to the appropriate specialist agents. Each agent works independently — the UI Builder writes components, the Backend Engineer builds APIs, Terminal Ops handles DevOps. You see every agent's work in real time.
          </p>
        </div>
      </div>
    </div>
  );
}