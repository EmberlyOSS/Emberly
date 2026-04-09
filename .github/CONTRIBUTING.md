# Contributing to Emberly

Thank you for your interest in contributing to Emberly! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Reporting Issues](#reporting-issues)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [hey@embrly.ca](mailto:hey@embrly.ca).

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18.x or later
- [Bun](https://bun.sh/) (recommended) or npm/yarn
- [PostgreSQL](https://www.postgresql.org/) 14.x or later
- [Redis](https://redis.io/) 6.x or later (optional, for caching)
- [Git](https://git-scm.com/)

### Development Setup

1. **Fork the repository**

   Click the "Fork" button on GitHub to create your own copy of the repository.

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/Website.git
   cd Website
   ```

3. **Add the upstream remote**

   ```bash
   git remote add upstream https://github.com/EmberlyOSS/Emberly.git
   ```

4. **Install dependencies**

   ```bash
   bun install
   ```

5. **Set up environment variables**

   ```bash
   cp .env.template .env
   ```

   Edit `.env` with your local configuration. See the comments in `.env.template` for guidance.

6. **Set up the database**

   ```bash
   bun prisma generate
   bun prisma db push
   ```

7. **Start the development server**

   ```bash
   bun dev
   ```

   The app will be available at `http://localhost:3000`.

## How to Contribute

### Types of Contributions

We welcome many types of contributions:

- **Bug fixes** - Help us squash bugs and improve stability
- **Features** - Implement new functionality (please discuss first)
- **Documentation** - Improve docs, fix typos, add examples
- **Tests** - Add or improve test coverage
- **Performance** - Optimize code and improve efficiency
- **Accessibility** - Make Emberly more accessible to everyone
- **Translations** - Help translate the interface (coming soon)

### Before You Start

1. **Check existing issues** - Someone may already be working on it
2. **Open a discussion** - For large features, discuss your approach first
3. **Create an issue** - For bugs or smaller features, create an issue to track work

### Finding Issues to Work On

Look for issues labeled:

- `good first issue` - Great for newcomers
- `help wanted` - We'd love community help
- `bug` - Something isn't working correctly
- `enhancement` - New feature or improvement

## Pull Request Process

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or fixes
- `chore/` - Maintenance tasks

### 2. Make Your Changes

- Write clean, readable code
- Follow our [coding standards](#coding-standards)
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run the linter
bun lint

# Run type checking
bun typecheck

# Build the project
bun run build
```

### 4. Commit Your Changes

Follow our [commit message guidelines](#commit-message-guidelines):

```bash
git commit -m "feat: add user profile avatar upload"
```

### 5. Push and Create a Pull Request

```bash
git push origin feature/your-feature-name
```

Then open a Pull Request on GitHub with:

- A clear title describing the change
- A description of what changed and why
- Reference to any related issues (e.g., "Fixes #123")
- Screenshots for UI changes

### 6. Code Review

- Address reviewer feedback promptly
- Keep discussions constructive and respectful
- Make requested changes in new commits (we'll squash on merge)

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode (`strict: true`)
- Prefer explicit types over `any`
- Use interfaces for object shapes

```typescript
// ✅ Good
interface UserProfile {
  id: string
  name: string
  email: string
}

// ❌ Avoid
const user: any = { ... }
```

### React/Next.js

- Use functional components with hooks
- Prefer server components when possible
- Use `'use client'` directive only when necessary
- Follow Next.js App Router conventions

### Styling

- Use Tailwind CSS for styling
- Follow the existing design system (shadcn/ui)
- Maintain responsive design (mobile-first)
- Support dark mode

### File Organization

```
app/                    # Next.js App Router pages
packages/
  ├── components/       # React components
  ├── lib/              # Utility functions and libraries
  ├── hooks/            # Custom React hooks
  └── types/            # TypeScript type definitions
prisma/                 # Database schema and migrations
public/                 # Static assets
```

### Naming Conventions

- **Files**: kebab-case (`user-profile.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Functions/Variables**: camelCase (`getUserProfile`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Types/Interfaces**: PascalCase (`UserProfile`)

## Commit Message Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) enforced by commitlint.

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type       | Description                                      |
|------------|--------------------------------------------------|
| `feat`     | New feature                                      |
| `fix`      | Bug fix                                          |
| `docs`     | Documentation changes                            |
| `style`    | Formatting, missing semicolons, etc.             |
| `refactor` | Code change that neither fixes nor adds features |
| `perf`     | Performance improvement                          |
| `test`     | Adding or updating tests                         |
| `chore`    | Maintenance tasks, dependency updates            |
| `ci`       | CI/CD changes                                    |
| `revert`   | Reverting a previous commit                      |

### Examples

```bash
feat(auth): add two-factor authentication support
fix(upload): resolve file size validation error
docs(readme): update installation instructions
refactor(api): consolidate error handling
```

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

1. **Description** - Clear description of the issue
2. **Steps to Reproduce** - How to trigger the bug
3. **Expected Behavior** - What should happen
4. **Actual Behavior** - What actually happens
5. **Environment** - OS, browser, Node version
6. **Screenshots** - If applicable

### Feature Requests

For feature requests, please include:

1. **Problem Statement** - What problem does this solve?
2. **Proposed Solution** - How would you implement it?
3. **Alternatives** - Other approaches considered
4. **Additional Context** - Mockups, examples, etc.

## Community

### Getting Help

- **Discord** - Join our [Discord server](https://discord.gg/A8c58ScRCj) for realtime chat
- **GitHub Discussions** - For longer form conversations
- **Issues** - For bug reports and feature requests

### Recognition

Contributors are recognized in several ways:

- Listed in release notes for significant contributions
- Contributor badge on your Emberly profile
- Tiered perks based on contribution level (Bronze → Diamond)

See our [Contributor Perks documentation](docs/CONTRIBUTOR_PERKS.md) for details.

---

## License

By contributing to Emberly, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Emberly!
