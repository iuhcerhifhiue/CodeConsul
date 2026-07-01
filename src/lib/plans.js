export const PLANS = {
  free: {
    name: 'Free',
    description: '5 basic agents for small projects',
    agents: ['ui_builder', 'backend_engineer', 'terminal_ops', 'test_engineer', 'code_reviewer'],
    accent: false,
  },
  starter: {
    name: 'Starter',
    description: '10 agents for growing projects',
    agents: [
      'ui_builder', 'backend_engineer', 'terminal_ops', 'test_engineer', 'code_reviewer',
      'database_engineer', 'api_designer', 'frontend_optimizer', 'documentation_writer', 'bug_fixer',
    ],
    accent: false,
  },
  pro: {
    name: 'Pro',
    description: '15 agents for professional teams',
    agents: [
      'ui_builder', 'backend_engineer', 'terminal_ops', 'test_engineer', 'code_reviewer',
      'database_engineer', 'api_designer', 'frontend_optimizer', 'documentation_writer', 'bug_fixer',
      'security_auditor', 'devops_engineer', 'mobile_developer', 'data_scientist', 'refactor_specialist',
    ],
    accent: false,
  },
  builder: {
    name: 'Builder',
    description: '22 agents — the full autonomous engineering org',
    agents: [
      'ui_builder', 'backend_engineer', 'terminal_ops', 'test_engineer', 'code_reviewer',
      'database_engineer', 'api_designer', 'frontend_optimizer', 'documentation_writer', 'bug_fixer',
      'security_auditor', 'devops_engineer', 'mobile_developer', 'data_scientist', 'refactor_specialist',
      'architect', 'ml_engineer', 'cloud_architect', 'performance_engineer', 'accessibility_auditor',
      'migration_specialist', 'sre_engineer',
    ],
    accent: true,
  },
};

export const AGENT_INFO = {
  // Free plan
  ui_builder: { name: 'UI Builder', icon: 'Layout', description: 'Frontend, components, styling', minPlan: 'free' },
  backend_engineer: { name: 'Backend Engineer', icon: 'Server', description: 'APIs, server logic, databases', minPlan: 'free' },
  terminal_ops: { name: 'Terminal Ops', icon: 'Terminal', description: 'DevOps, scripts, deployment', minPlan: 'free' },
  test_engineer: { name: 'Test Engineer', icon: 'CheckCircle', description: 'Unit tests, integration tests', minPlan: 'free' },
  code_reviewer: { name: 'Code Reviewer', icon: 'Eye', description: 'Code quality, best practices', minPlan: 'free' },

  // Starter plan
  database_engineer: { name: 'Database Engineer', icon: 'Database', description: 'Schemas, migrations, queries', minPlan: 'starter' },
  api_designer: { name: 'API Designer', icon: 'Network', description: 'REST/GraphQL design, OpenAPI', minPlan: 'starter' },
  frontend_optimizer: { name: 'Frontend Optimizer', icon: 'Gauge', description: 'Bundle size, render perf', minPlan: 'starter' },
  documentation_writer: { name: 'Documentation Writer', icon: 'FileText', description: 'READMEs, API docs, guides', minPlan: 'starter' },
  bug_fixer: { name: 'Bug Fixer', icon: 'Bug', description: 'Root cause analysis, fixes', minPlan: 'starter' },

  // Pro plan
  security_auditor: { name: 'Security Auditor', icon: 'Shield', description: 'Vulnerability scanning, auth', minPlan: 'pro' },
  devops_engineer: { name: 'DevOps Engineer', icon: 'Cloud', description: 'IaC, Kubernetes, pipelines', minPlan: 'pro' },
  mobile_developer: { name: 'Mobile Developer', icon: 'Smartphone', description: 'React Native, mobile UI', minPlan: 'pro' },
  data_scientist: { name: 'Data Scientist', icon: 'BarChart3', description: 'Analysis, ML models, ETL', minPlan: 'pro' },
  refactor_specialist: { name: 'Refactor Specialist', icon: 'Wand2', description: 'Restructuring, DRY, patterns', minPlan: 'pro' },

  // Builder plan
  architect: { name: 'Architect', icon: 'Compass', description: 'System design, architecture', minPlan: 'builder' },
  ml_engineer: { name: 'ML Engineer', icon: 'Brain', description: 'ML pipelines, model deploy', minPlan: 'builder' },
  cloud_architect: { name: 'Cloud Architect', icon: 'Globe', description: 'Multi-cloud, scalability', minPlan: 'builder' },
  performance_engineer: { name: 'Performance Engineer', icon: 'Zap', description: 'Profiling, bottlenecks, caching', minPlan: 'builder' },
  accessibility_auditor: { name: 'Accessibility Auditor', icon: 'Accessibility', description: 'WCAG, a11y, screen readers', minPlan: 'builder' },
  migration_specialist: { name: 'Migration Specialist', icon: 'ArrowRightLeft', description: 'Framework upgrades, migrations', minPlan: 'builder' },
  sre_engineer: { name: 'SRE Engineer', icon: 'Activity', description: 'Monitoring, alerting, reliability', minPlan: 'builder' },
};

export const PLAN_ORDER = ['free', 'starter', 'pro', 'builder'];