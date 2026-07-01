export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    description: 'Basic multi-agent coding team',
    agents: ['ui_builder', 'backend_engineer', 'terminal_ops'],
    accent: false,
  },
  starter: {
    name: 'Starter',
    price: 19,
    description: 'More specialists for growing projects',
    agents: ['ui_builder', 'backend_engineer', 'terminal_ops', 'test_engineer'],
    accent: false,
  },
  pro: {
    name: 'Pro',
    price: 49,
    description: 'Full engineering team with security',
    agents: ['ui_builder', 'backend_engineer', 'terminal_ops', 'test_engineer', 'security_auditor'],
    accent: false,
  },
  builder: {
    name: 'Builder',
    price: 99,
    description: 'Unlimited autonomous engineering power',
    agents: ['ui_builder', 'backend_engineer', 'terminal_ops', 'test_engineer', 'security_auditor', 'architect'],
    accent: true,
  },
};

export const AGENT_INFO = {
  ui_builder: {
    name: 'UI Builder',
    icon: 'Layout',
    description: 'Frontend, components, styling',
    minPlan: 'free',
  },
  backend_engineer: {
    name: 'Backend Engineer',
    icon: 'Server',
    description: 'APIs, server logic, databases',
    minPlan: 'free',
  },
  terminal_ops: {
    name: 'Terminal Ops',
    icon: 'Terminal',
    description: 'DevOps, scripts, deployment',
    minPlan: 'free',
  },
  test_engineer: {
    name: 'Test Engineer',
    icon: 'CheckCircle',
    description: 'Unit tests, integration tests',
    minPlan: 'starter',
  },
  security_auditor: {
    name: 'Security Auditor',
    icon: 'Shield',
    description: 'Vulnerability scanning, auth review',
    minPlan: 'pro',
  },
  architect: {
    name: 'Architect',
    icon: 'Compass',
    description: 'System design, architecture docs',
    minPlan: 'builder',
  },
};

export const PLAN_ORDER = ['free', 'starter', 'pro', 'builder'];