# Consul — Autonomous Multi-Agent Coding Platform

Consul is a multi-agent AI coding platform where a CEO orchestrator (Oikos) decomposes user tasks into sub-tasks and delegates each to specialized engineering agents. Agents read, write, and commit code directly to your GitHub repositories — no copy-paste, no hand-holding.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                │
│                                                          │
│  Landing → Dashboard → Workspace                         │
│                          │                               │
│                 ┌────────┴────────┐                      │
│                 │  Oikos (CEO)    │  Parses task,        │
│                 │  Chat Panel     │  outputs assignments │
│                 └────────┬────────┘                      │
│                          │                               │
│              ┌───────────┼───────────┐                   │
│              ▼           ▼           ▼                   │
│         ┌────────┐ ┌────────┐ ┌────────┐                │
│         │ UI     │ │Backend │ │Terminal│  ...up to 22   │
│         │Builder │ │Engineer│ │ Ops    │  specialist    │
│         └────┬───┘ └────┬───┘ └────┬───┘  agents        │
│              │          │          │                     │
└──────────────┼──────────┼──────────┼─────────────────────┘
               │          │          │
┌──────────────┼──────────┼──────────┼─────────────────────┐
│              ▼          ▼          ▼     BACKEND (Deno)   │
│         ┌──────────────────────────────┐                 │
│         │     githubWrite (CRUD)       │  Read, write,   │
│         │     githubRepoContents       │  delete files   │
│         │     githubRepos (list)       │  via GitHub API │
│         └──────────────┬───────────────┘                 │
│                        │                                 │
│                        ▼                                 │
│              ┌──────────────────┐                        │
│              │  GitHub API v3   │  Commits land in       │
│              │  (REST)          │  your repo directly    │
│              └──────────────────┘                        │
└──────────────────────────────────────────────────────────┘
```

## How It Works

1. **Connect a repo** — Paste any GitHub URL on the Dashboard. The `githubRepoContents` function indexes the file tree, fetches key config files, and detects the tech stack.

2. **Submit a task** — In the Workspace, describe what you want built (e.g., "Add JWT authentication with refresh tokens").

3. **Oikos (CEO) plans** — The CEO agent analyzes the task with full project context (repo name, stack, file tree, key files) and outputs structured `[ASSIGNMENTS]` JSON:
   ```json
   [
     {"agent": "ui_builder", "task": "Create LoginForm.tsx at src/components/..."},
     {"agent": "backend_engineer", "task": "Create POST /api/auth/login endpoint with JWT..."}
   ]
   ```

4. **Specialists execute** — The Workspace filters assignments by the user's plan, spins up a conversation for each specialist, and subscribes to real-time updates. Each specialist reads relevant files, writes complete code, verifies the commit, and reports back.

5. **Watch it happen** — The right panel shows each specialist's work streaming in real time: file reads, writes, commits, and status updates.

## Project Structure

```
consul/
├── src/                          # Frontend (React + Tailwind)
│   ├── pages/
│   │   ├── Landing.jsx           # Marketing page
│   │   ├── Dashboard.jsx         # Repo list + connect
│   │   ├── Workspace.jsx         # CEO chat + specialist panels
│   │   ├── Plans.jsx             # Plan selection (Free/Starter/Pro/Builder)
│   │   ├── Login.jsx             # Auth: email/password + Google OAuth
│   │   └── Register.jsx          # Auth: register → OTP → verify
│   ├── components/
│   │   ├── ChatMessages.jsx      # CEO conversation renderer w/ markdown
│   │   ├── AgentPanel.jsx        # Specialist agent panel (expandable)
│   │   ├── AgentRoster.jsx       # Left sidebar: all 22 agents + plan locks
│   │   ├── ToolCall.jsx          # File operation display (read/write/delete)
│   │   ├── CodeBlock.jsx         # Syntax-highlighted code w/ copy button
│   │   ├── CodeStream.jsx        # Landing page animated demo
│   │   ├── RepoPicker.jsx        # GitHub URL input modal
│   │   ├── ActivityFeed.jsx      # Agent operation feed
│   │   ├── AgentTray.jsx         # Status bar
│   │   ├── FileTree.jsx          # File tree browser
│   │   ├── Logo.jsx              # Oikos organic ring logo (SVG)
│   │   └── ProtectedRoute.jsx    # Auth gate
│   ├── lib/
│   │   ├── plans.js              # 4 plans, 22 agents, agent metadata
│   │   ├── AuthContext.jsx       # Auth provider
│   │   └── query-client.js       # React Query client
│   ├── api/
│   │   └── base44Client.js       # Base44 SDK client (pre-initialized)
│   ├── App.jsx                   # Router
│   ├── index.css                 # Design tokens (Editorial Mono theme)
│   └── main.jsx                  # Entry point
│
├── base44/
│   ├── agents/                   # AI Agent Configurations (22 + CEO)
│   │   ├── oikos.jsonc           # CEO orchestrator
│   │   ├── ui_builder.jsonc      # Frontend specialist
│   │   ├── backend_engineer.jsonc # Backend specialist
│   │   ├── terminal_ops.jsonc    # DevOps specialist
│   │   ├── test_engineer.jsonc   # Testing specialist
│   │   ├── code_reviewer.jsonc   # Code quality specialist
│   │   ├── database_engineer.jsonc # Database specialist
│   │   ├── api_designer.jsonc    # API design specialist
│   │   ├── frontend_optimizer.jsonc # Frontend perf specialist
│   │   ├── documentation_writer.jsonc # Docs specialist
│   │   ├── bug_fixer.jsonc       # Debugging specialist
│   │   ├── security_auditor.jsonc # Security specialist
│   │   ├── devops_engineer.jsonc # Infrastructure specialist
│   │   ├── mobile_developer.jsonc # Mobile specialist
│   │   ├── data_scientist.jsonc  # Data/ML specialist
│   │   ├── refactor_specialist.jsonc # Refactoring specialist
│   │   ├── architect.jsonc       # System design specialist
│   │   ├── ml_engineer.jsonc     # ML pipeline specialist
│   │   ├── cloud_architect.jsonc # Multi-cloud specialist
│   │   ├── performance_engineer.jsonc # Profiling specialist
│   │   ├── accessibility_auditor.jsonc # A11y specialist
│   │   ├── migration_specialist.jsonc # Migration specialist
│   │   └── sre_engineer.jsonc    # Reliability specialist
│   │
│   ├── functions/                # Backend Functions (Deno serverless)
│   │   ├── githubWrite/
│   │   │   └── entry.ts          # CRUD: read/write/delete files in repo
│   │   ├── githubRepoContents/
│   │   │   └── entry.ts          # Index repo: file tree, key files, stack
│   │   └── githubRepos/
│   │       └── entry.ts          # List user's GitHub repos
│   │
│   └── entities/
│       ├── Project.jsonc         # Repo metadata, file tree, stack
│       └── Session.jsonc         # CEO conversation ↔ project mapping
│
├── index.html                    # App shell, fonts, meta tags
├── package.json                  # Dependencies
├── vite.config.js                # Vite + Base44 plugin
├── tailwind.config.js            # Tailwind theme (Editorial Mono)
├── postcss.config.js
├── jsconfig.json
├── eslint.config.js
└── README.md                     # This file
```

## AI Agents

### CEO Orchestrator — Oikos
Oikos is the only agent that talks to the user directly. It:
- Receives the task with full project context
- Breaks it into sub-tasks
- Outputs `[ASSIGNMENTS]` JSON mapping each sub-task to a specialist
- Does NOT write code itself

### 22 Specialist Agents

| # | Agent | Domain | Plan |
|---|-------|--------|------|
| 1 | `ui_builder` | React components, CSS, Tailwind, layouts | Free |
| 2 | `backend_engineer` | APIs, server logic, databases, middleware | Free |
| 3 | `terminal_ops` | DevOps, scripts, CI/CD, Dockerfiles | Free |
| 4 | `test_engineer` | Unit tests, integration tests, coverage | Free |
| 5 | `code_reviewer` | Code quality, best practices, readability | Free |
| 6 | `database_engineer` | Schemas, migrations, query optimization | Starter |
| 7 | `api_designer` | REST/GraphQL design, OpenAPI specs | Starter |
| 8 | `frontend_optimizer` | Bundle size, lazy loading, render perf | Starter |
| 9 | `documentation_writer` | READMEs, API docs, guides | Starter |
| 10 | `bug_fixer` | Root cause analysis, bug fixes | Starter |
| 11 | `security_auditor` | Vulnerability scanning, auth hardening | Pro |
| 12 | `devops_engineer` | Terraform, Kubernetes, cloud infra | Pro |
| 13 | `mobile_developer` | React Native, mobile-optimized UI | Pro |
| 14 | `data_scientist` | Analysis, ML models, ETL pipelines | Pro |
| 15 | `refactor_specialist` | Code restructuring, DRY, patterns | Pro |
| 16 | `architect` | System design, architecture docs | Builder |
| 17 | `ml_engineer` | ML pipelines, model deployment | Builder |
| 18 | `cloud_architect` | Multi-cloud, scalability design | Builder |
| 19 | `performance_engineer` | Profiling, bottleneck identification | Builder |
| 20 | `accessibility_auditor` | WCAG, screen readers, a11y | Builder |
| 21 | `migration_specialist` | Framework upgrades, language migrations | Builder |
| 22 | `sre_engineer` | Monitoring, alerting, observability | Builder |

Every specialist follows the same autonomous workflow:
1. **READ** — Fetch relevant files via `githubWrite(operation: "read")`
2. **WRITE** — Write complete, production-ready files via `githubWrite(operation: "write")`
3. **VERIFY** — Read back one file to confirm the commit landed
4. **DONE** — Short summary of what was created

### Agent Configuration Format
Each agent is a JSONC file in `base44/agents/`:
```jsonc
{
  "name": "backend_engineer",
  "description": "What this agent does",
  "instructions": "System prompt: domain expertise, workflow rules, anti-loop rules, code standards",
  "tool_configs": [
    { "entity_name": "Project", "allowed_operations": ["read"] },
    { "function_name": "githubWrite", "description": "Read, write, or delete files..." }
  ]
}
```

## Backend Functions

### `githubWrite` — File CRUD
The primary tool for all specialist agents. Handles read, write/update, and delete operations on files in any connected GitHub repo.

**Input:**
```json
{
  "operation": "read" | "write" | "delete",
  "repo_full_name": "owner/repo",
  "file_path": "src/components/Login.tsx",
  "content": "file contents (for write)",
  "commit_message": "optional custom message",
  "branch": "optional branch name"
}
```

**Write flow:** Checks if file exists → gets SHA → creates or updates with base64-encoded content → returns commit SHA and URL.

### `githubRepoContents` — Repo Indexing
Fetches the complete file tree, key configuration files, and detects the tech stack (Next.js, React, Vue, Express, Go, Rust, Python, Ruby, Java, etc.).

**Returns:** `{ file_tree, key_files, stack, default_branch, file_count }`

### `githubRepos` — Repo Listing
Lists the authenticated user's 50 most recently updated GitHub repositories.

**Returns:** `{ repos: [{ name, url, private, updated_at }] }`

## Subscription Plans

| Plan | Agents | Description |
|------|--------|-------------|
| **Free** | 5 | Basic agents for small projects |
| **Starter** | 10 | Growing projects with database, API, docs support |
| **Pro** | 15 | Professional teams with security, DevOps, mobile |
| **Builder** | 22 | The full autonomous engineering organization |

Plans are free to switch — no payment required. The user's selected plan is stored on their User entity and determines which agents the Workspace will deploy.

## Design Language — Editorial Mono

- **Canvas:** Pure white backgrounds
- **Typography:** Space Grotesk (headings), Inter (body), Space Mono (monospace)
- **Accents:** Chartreuse `#D4FF00` (CSS var `--editorial`) for highlights, active states, and badges
- **Grid:** Thin black hairline borders, no shadows or gradients
- **No glassmorphism, no dark mode in the main UI**

## Data Model

### Project Entity
| Field | Type | Description |
|-------|------|-------------|
| `repo_name` | string | Repository short name |
| `repo_full_name` | string | `owner/repo` format |
| `repo_url` | string | Full GitHub URL |
| `stack` | string | Detected tech stack |
| `architecture_notes` | string | File count, branch info |
| `key_decisions` | string[] | Architecture decision records |
| `file_tree` | string | Newline-separated file paths |

### Session Entity
| Field | Type | Description |
|-------|------|-------------|
| `project_id` | string | Linked Project ID |
| `conversation_id` | string | Oikos CEO conversation ID |
| `title` | string | Session title |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub personal access token for repo operations |
| `BASE44_APP_ID` | Auto-populated by platform |

Set `GITHUB_TOKEN` in Dashboard → Settings → Environment Variables.

## Run Locally

```bash
# Install dependencies
npm install

# Install Base44 CLI
npm install -g base44@latest

# Run full dev environment (backend + frontend)
base44 dev

# Or frontend only against hosted backend
npm run dev
```

For frontend-only development, create `.env.local`:
```bash
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=https://your-app.base44.app
```

## Publish

```bash
# Push changes to git, then open the dashboard
base44 dashboard open
```

## Tech Stack

- **Frontend:** React 18, Vite 6, Tailwind CSS 3, React Router 6
- **UI Components:** shadcn/ui (Radix primitives), lucide-react icons
- **State:** React Query (TanStack), React hooks
- **Backend:** Deno serverless functions (TypeScript)
- **AI:** Base44 agent framework (22 specialist configs + CEO)
- **Auth:** Base44 auth (email/password, Google OAuth, OTP)
- **GitHub:** REST API v3 via `githubWrite`, `githubRepoContents`, `githubRepos`

## License

Proprietary — Consul Platform