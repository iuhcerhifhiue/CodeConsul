import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { PLANS, AGENT_INFO, PLAN_ORDER } from '@/lib/plans';
import { Check, ArrowLeft, Crown } from 'lucide-react';

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
    <div className="min-h-screen bg-white text-black font-mono">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-black bg-white">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 md:px-10 py-4">
          <Link to="/" className="font-bold text-xl tracking-tight">Consul</Link>
          <Link to="/dashboard" className="text-sm text-gray-500 hover:text-black transition-colors">← Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-16">
        {/* Header */}
        <p className="text-xs font-bold tracking-[0.2em] text-editorial mb-3">05 — PLANS</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Choose your engineering team</h1>
        <p className="text-base text-gray-600 max-w-xl mb-12">
          Every plan includes Oikos (CEO) who orchestrates the specialist agents. Higher tiers unlock more specialists.
        </p>

        {/* Plan grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-black border border-black rounded-lg overflow-hidden">
          {PLAN_ORDER.map((key) => {
            const plan = PLANS[key];
            const isCurrent = currentPlan === key;
            const lockedAgents = Object.entries(AGENT_INFO).filter(([k]) => !plan.agents.includes(k));

            return (
              <div key={key} className={`bg-white p-6 flex flex-col ${plan.accent ? 'bg-[#FFFBEA]' : ''}`}>
                {/* Plan name */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  {isCurrent && (
                    <span className="text-[9px] bg-editorial text-black px-2 py-0.5 rounded font-bold border border-black">CURRENT</span>
                  )}
                </div>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-sm text-gray-400">/mo</span>
                </div>

                <p className="text-xs text-gray-500 mb-6">{plan.description}</p>

                {/* Agent list */}
                <div className="space-y-2 mb-6 flex-1">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Crown className="w-3.5 h-3.5 text-black shrink-0" />
                    <span className="text-xs font-bold">Oikos (CEO)</span>
                    <span className="text-[9px] text-gray-400 ml-auto">orchestrator</span>
                  </div>
                  {plan.agents.map((agentKey) => {
                    const info = AGENT_INFO[agentKey];
                    return (
                      <div key={agentKey} className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-black shrink-0" />
                        <span className="text-xs font-medium">{info.name}</span>
                      </div>
                    );
                  })}
                  {lockedAgents.map(([k, info]) => (
                    <div key={k} className="flex items-center gap-2 opacity-30">
                      <span className="text-xs">🔒 {info.name}</span>
                    </div>
                  ))}
                </div>

                {/* Button */}
                <button
                  onClick={() => selectPlan(key)}
                  disabled={isCurrent || switching}
                  className={`w-full py-2.5 rounded-md text-sm font-bold transition-colors ${
                    isCurrent
                      ? 'bg-gray-100 text-gray-400 cursor-default'
                      : plan.accent
                        ? 'bg-editorial text-black hover:bg-black hover:text-editorial border border-black'
                        : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  {isCurrent ? '✓ Current Plan' : `Select ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Info note */}
        <div className="mt-8 border border-black rounded-lg p-6">
          <p className="text-xs text-gray-500 leading-relaxed">
            <span className="font-bold text-black">How it works:</span> When you submit a task, Oikos (CEO) analyzes it and delegates sub-tasks to the appropriate specialist agents. Each agent works independently — the UI Builder writes components, the Backend Engineer builds APIs, Terminal Ops handles DevOps. You see every agent's work in real time.
          </p>
        </div>
      </div>
    </div>
  );
}