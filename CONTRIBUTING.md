# Contributing to Traveler

Thank you for your interest in contributing to **Traveler** — a social travel platform for explorers!

We welcome bug reports, feature suggestions, and pull requests.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## Code of Conduct

This project follows a standard open-source code of conduct. Be respectful, constructive, and inclusive in all interactions.

---

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/your-username/traveler.git
   cd traveler
   ```
3. **Install dependencies** for all three subsystems:
   ```bash
   npm install --prefix client
   npm install --prefix server
   npm install --prefix agent
   ```
4. **Create a `.env` file** in `server/` and `client/` using the provided `.env.example` templates.
5. **Run the development servers:**
   ```bash
   # Terminal 1 — Backend
   cd server && node index.js

   # Terminal 2 — AI Recommendation Engine
   cd agent && node server.js

   # Terminal 3 — Frontend
   cd client && npm run dev
   ```

---

## Development Workflow

- Always create a **new branch** for your work:
  ```bash
  git checkout -b feat/your-feature-name
  ```
- Keep changes **focused and minimal** — one feature or fix per PR.
- Write **meaningful commit messages** following the Conventional Commits standard (see below).
- Test your changes locally before opening a PR.

---

## Commit Message Guidelines

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short description>
```

| Type | When to use |
|------|------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes |
| `style` | Code formatting, no logic change |
| `refactor` | Code restructure without feature/bug change |
| `test` | Adding or updating tests |
| `chore` | Tooling, config, or dependency updates |

**Examples:**
```
feat(server): add geolocation filtering to advisor endpoint
fix(client): resolve story map marker rendering on mobile
docs: update environment variable examples
```

---

## Pull Request Process

1. Ensure your branch is up-to-date with `main`:
   ```bash
   git fetch origin
   git rebase origin/main
   ```
2. Open a pull request with:
   - A clear **title** following Conventional Commits style.
   - A **description** explaining what changed and why.
   - Screenshots or recordings for UI changes.
3. Wait for a code review. Address all feedback before merging.
4. A maintainer will merge your PR once approved.

---

## Reporting Bugs

Please open a [GitHub Issue](https://github.com/your-username/traveler/issues) with:

- A clear, descriptive title.
- Steps to reproduce the bug.
- Expected behaviour vs. actual behaviour.
- Environment details (OS, Node version, browser).

---

## Suggesting Features

Open a [GitHub Issue](https://github.com/your-username/traveler/issues) with the label `enhancement` and describe:

- The problem you're trying to solve.
- Your proposed solution.
- Any alternatives you considered.
