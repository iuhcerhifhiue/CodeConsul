# ARCHITECTURE.md: Consul — Autonomous Multi-Agent Coding Platform

## 1. Introduction

Consul is an autonomous multi-agent AI coding platform designed to decompose user tasks into sub-tasks and delegate them to specialized engineering agents. These agents interact directly with GitHub repositories to read, write, and commit code. This document outlines the system's architecture, key components, technology choices, and data flow.

## 2. Overall Architecture

The Consul platform follows a client-server architecture with a clear separation between the frontend user interface and the backend services. The core of the system is the Oikos (CEO) orchestrator, which manages the task delegation to various specialist agents. All agent interactions with code repositories are facilitated through the GitHub API.

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

## 3. Key Components

### 3.1 Frontend (`consul/src/`)

Developed with React and Vite, the frontend provides the user interface for interacting with the Consul platform.

-   **Pages**:
    -   `Landing.jsx`: Marketing page for the platform.
    -   `Dashboard.jsx`: Displays the list of connected repositories and allows connecting new ones.
    -   `Workspace.jsx`: The primary interface for users to submit tasks and observe agent activity. It features the CEO chat and specialist agent panels.
    -   `Plans.jsx`: Manages plan selection (Free/Starter/Pro/Builder).
    -   `Login.jsx` & `Register.jsx`: Handles user authentication (email/password and Google OAuth).
-   **Components**: Reusable UI elements such as `ChatMessages`, `AgentPanel`, `FileTree`, `CodeBlock`, etc., facilitating a rich user experience.
-   **Libraries (`lib/`)**: Includes `plans.js` for agent and plan metadata, `AuthContext.jsx` for authentication context, and `query-client.js` for React Query setup.
-   **API Client (`api/`)**: `base44Client.js` an initialized Base44 SDK client for interacting with backend services.

### 3.2 Backend (`consul/base44/`)

The backend is built using Deno serverless functions, providing the computational and integration layer for the AI agents and GitHub interactions.

-   **AI Agent Configurations (`agents/`)**:
    -   `oikos.jsonc`: Configuration for the CEO orchestrator.
    -   `ui_builder.jsonc`, `backend_engineer.jsonc`, `terminal_ops.jsonc`, `architect.jsonc`, etc.: Configurations for the 22 specialist agents, each with a defined domain and plan level.
-   **Serverless Functions (`functions/`)**:
    -   `githubWrite/entry.ts`: Provides CRUD operations (read, write, delete) for files within GitHub repositories. This is the primary mechanism for agents to modify code.
    -   `githubRepoContents/entry.ts`: Indexes repository content, extracts file trees, identifies key configuration files, and detects the technology stack.
    -   `githubRepos/entry.ts`: Lists the user's accessible GitHub repositories.
-   **Entities (`entities/`)**:
    -   `Project.jsonc`: Stores metadata about connected repositories, including file tree and detected stack.
    -   `Session.jsonc`: Maps CEO conversations to specific project contexts.

## 4. Technology Stack

-   **Frontend**: React, Vite, Tailwind CSS, React Query
-   **Backend**: Deno (serverless functions), TypeScript
-   **Version Control**: Git, GitHub API v3 (REST)
-   **Authentication**: Email/Password, Google OAuth
-   **Styling**: Tailwind CSS, PostCSS
-   **Tooling**: ESLint, Prettier (implied by project structure), Vite

## 5. Data Flow and Workflow

The platform operates through the following workflow:

1.  **Repository Connection**: A user connects a GitHub repository via the Dashboard. The `githubRepoContents` function is invoked to index the repository's file tree, identify key configuration files, and determine the technology stack. This information is stored in the `Project` entity.

2.  **Task Submission**: The user describes a desired task in the Workspace chat panel. This task is sent to the Oikos (CEO) orchestrator.

3.  **CEO Orchestration (Oikos)**: The Oikos agent, with full project context (repo name, stack, file tree, key files), analyzes the task. It then decomposes the task into sub-tasks and generates structured `[ASSIGNMENTS]` JSON. Each assignment specifies the specialist agent responsible and the sub-task description.

4.  **Specialist Execution**:
    -   The Workspace filters assignments and initiates a conversation for each specialist agent.
    -   Each specialist agent follows an autonomous workflow:
        1.  **READ**: Fetches relevant files from the repository using `githubWrite(operation: "read")`.
        2.  **WRITE**: Writes or modifies code and other files using `githubWrite(operation: "write")`. This results in direct commits to the user's GitHub repository.
        3.  **VERIFY**: Reads back a file to confirm the commit was successful.
        4.  **DONE**: Provides a short summary of its completed work.
    -   Real-time updates on agent activities (file reads, writes, commits, status) are streamed back to the user in the Workspace.

## 6. Project Structure

The repository `consul/` is organized as follows:

```
consul/
├── src/                          # Frontend (React + Tailwind)
│   ├── pages/                    # React Pages
│   ├── components/               # Reusable React Components
│   ├── lib/                      # Frontend utility libraries
│   ├── api/                      # Frontend API client
│   ├── App.jsx                   # Main React Router
│   ├── index.css                 # Global CSS
│   └── main.jsx                  # Frontend Entry point
│
├── base44/
│   ├── agents/                   # AI Agent Configurations (JSONC)
│   ├── functions/                # Backend Serverless Functions (Deno/TypeScript)
│   │   ├── githubWrite/
│   │   ├── githubRepoContents/
│   │   └── githubRepos/
│   │
│   └── entities/                 # Data Models (JSONC)
│       ├── Project.jsonc
│       └── Session.jsonc
│
├── index.html                    # App shell
├── package.json                  # Node.js dependencies
├── vite.config.js                # Vite configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── postcss.config.js             # PostCSS configuration
├── jsconfig.json                 # JavaScript configuration
├── eslint.config.js              # ESLint configuration
└── README.md                     # Project README
```
