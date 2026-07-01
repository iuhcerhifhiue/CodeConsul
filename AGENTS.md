# AGENTS.md

## Project Context

Consul is a multi-agent AI coding platform built on Base44. A CEO orchestrator (Oikos) delegates sub-tasks to 22 specialist agents that read, write, and commit code directly to GitHub repositories.

## Architecture

- **Frontend:** React + Vite + Tailwind (Editorial Mono design language)
- **Backend:** Deno serverless functions (`base44/functions/`)
- **AI Agents:** 23 JSONC config files (`base44/agents/`) — 1 CEO + 22 specialists
- **Data:** Base44 entities (Project, Session, User)

## Key Directories

| Path | Purpose |
|------|---------|
| `src/pages/` | Page components (Landing, Dashboard, Workspace, Plans, Login, Register) |
| `src/components/` | Reusable UI components (ChatMessages, AgentPanel, AgentRoster, ToolCall, etc.) |
| `src/lib/plans.js` | Plan definitions (Free/Starter/Pro/Builder) + agent metadata (22 agents) |
| `src/api/base44Client.js` | Pre-initialized Base44 SDK client |
| `base44/agents/` | AI agent configurations (oikos.jsonc + 22 specialists) |
| `base44/functions/` | Backend functions (githubWrite, githubRepoContents, githubRepos) |
| `base44/entities/` | Entity schemas (Project, Session) |

## Multi-Agent Flow

1. User submits a task in `Workspace.jsx`
2. Task + project context (repo, stack, file tree, key files) sent to Oikos CEO conversation
3. Oikos outputs `[ASSIGNMENTS]` JSON mapping sub-tasks to specialist agents
4. Workspace filters assignments by user's plan (`PLANS[userPlan].agents`)
5. Each specialist gets its own conversation with the sub-task + context
6. Specialists call `githubWrite` to read/write/delete files → commits land in repo
7. Real-time subscriptions stream each specialist's work to the UI

## Agent Standards

Every specialist agent follows:
- **Autonomous execution** — no pausing for approval, no asking "shall I proceed?"
- **Single-turn workflow** — READ → WRITE → VERIFY → DONE
- **Anti-loop rules** — never restart planning, never re-output after done
- **Complete files only** — no stubs, no placeholders, no TODO comments
- **`githubWrite` tool** — the only file manipulation function

## Base44 References

- CLI overview: https://docs.base44.com/developers/references/cli/get-started/overview.md
- Agent skills: https://docs.base44.com/developers/backend/overview/skills.md
- GitHub integration: https://docs.base44.com/Integrations/Using-GitHub

## Development

```bash
npm install
base44 dev          # Full dev (backend + frontend)
# or
npm run dev         # Frontend only
```

Set `GITHUB_TOKEN` in Dashboard → Settings → Environment Variables.