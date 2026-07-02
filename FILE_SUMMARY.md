# Repository File Summary

This document provides an overview of the key directories and files within the `CodeConsul` repository, outlining their general purpose and contribution to the project.

## Directory Structure

*   `.base44/`: This directory appears to be central to the Base44 platform integration.
    *   `agents/`: Contains JSON configuration files (`.jsonc`) for various AI agents (e.g., `architect.jsonc`, `backend_engineer.jsonc`, `devops_engineer.jsonc`). These files define the roles, capabilities, and instructions for each autonomous agent within the system.
    *   `entities/`: Houses JSON schema definitions for data entities (e.g., `Project.jsonc`, `Session.jsonc`, `User.jsonc`). This defines the data model used across the application and by the agents.
    *   `functions/`: Contains TypeScript files (`.ts`) that implement custom functions or tools, primarily interacting with GitHub (e.g., `githubPullRequest/entry.ts`, `githubWrite/entry.ts`, `githubSearch/entry.ts`). These functions extend the capabilities of the agents.
    *   `.app.jsonc`: Likely the main application configuration file for the Base44 platform, orchestrating how agents, entities, and functions are utilized.
    *   `config.jsonc`: General configuration settings for the Base44 environment.
*   `src/`: The primary source code directory for the web application.
    *   `api/`: Contains client-side API integration logic, notably `base44Client.js`, which likely handles communication with the Base44 backend services.
    *   `components/`: Houses reusable React/JSX components that form the building blocks of the user interface (e.g., `ActivityFeed.jsx`, `AgentPanel.jsx`, `ChatMessages.jsx`, `CodeBlock.jsx`, `FileTree.jsx`, `RepoPicker.jsx`).
    *   `components/ui/`: Contains UI components, possibly from a component library (e.g., Shadcn UI or similar), providing styled and interactive elements like `button.jsx`, `dialog.jsx`, `form.jsx`, `input.jsx`.

## Key Files

*   `.gitignore`: Specifies files and directories that Git should ignore, such as build outputs, dependency modules, and temporary files.
*   `AGENTS.md`: Documentation detailing the various AI agents, their roles, and functionalities.
*   `ARCHITECTURE.md`: Provides a high-level overview and detailed descriptions of the system's architecture.
*   `CLAUDE.md`: Specific documentation, possibly relating to integration or usage of the Claude AI model.
*   `README.md`: The main project README file, offering a general introduction, setup instructions, and project goals.
*   `index.html`: The entry point for the web application, serving as the root HTML document.
*   `package.json`: Defines the project's metadata, scripts, and lists all dependencies for the Node.js project.
*   `package-lock.json`: Records the exact versions of dependencies used, ensuring consistent installations across environments.
*   `jsconfig.json`: Configures JavaScript language features and paths for development environments and tools like VS Code.
*   `eslint.config.js`: Configuration for ESLint, used to enforce code style and identify potential issues.
*   `postcss.config.js`: Configuration for PostCSS, a tool for transforming CSS with JavaScript.
*   `tailwind.config.js`: Configuration for Tailwind CSS, a utility-first CSS framework.
*   `vite.config.js`: Configuration for Vite, a fast build tool for modern web projects.
*   `src/App.jsx`: The main React application component, typically where the primary layout and routing are defined.

## General Purpose

The `CodeConsul` repository appears to host a web application that acts as an interface or platform for an agent-based system. It integrates with the Base44 framework, utilizing configured AI agents, data entities, and custom GitHub interaction functions to provide a rich, interactive environment. The application is built using React, leveraging modern web development tools and practices to deliver a user-friendly experience for managing and interacting with autonomous development or operational agents.