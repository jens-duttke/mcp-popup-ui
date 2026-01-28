# Contributing to MCP Popup UI

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm

### Development Setup

1. Fork and clone the repository:

   ```bash
   git clone https://github.com/jens-duttke/mcp-popup-ui.git
   cd mcp-popup-ui
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the project:

   ```bash
   npm run build
   ```

4. For development with auto-rebuild:

   ```bash
   npm run dev          # Watch MCP server changes
   npm run dev:frontend # Development server for UI
   ```

## Project Structure

```markdown
mcp-popup-ui/
├── frontend/          # React-based popup UI
│   ├── components/    # UI components
│   ├── hooks/         # Custom React hooks
│   ├── services/      # API services
│   └── types/         # TypeScript types
├── mcp/               # MCP server implementation
│   ├── http/          # HTTP server for UI
│   ├── server/        # MCP server setup
│   ├── tools/         # Tool definitions
│   └── types/         # TypeScript types
├── scripts/           # Build and test scripts
└── docs/              # Documentation
```

## Code Style

This project uses automated linting. Run before committing:

```bash
npm run lint
```

### Key Guidelines

- Use TypeScript with strict mode
- Prefer functional components with hooks for React
- Use CSS Modules for component styling
- Write descriptive commit messages

## Pull Request Process

1. Create a feature branch from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and ensure:
   - Code passes linting (`npm run lint`)
   - Project builds successfully (`npm run build`)
   - Changes are tested manually

3. Commit with a clear message describing the change

4. Push and open a Pull Request against `main`

5. Fill out the PR template with:
   - Description of changes
   - Related issues (if any)
   - Screenshots for UI changes

## Reporting Issues

When reporting bugs, please include:

- Node.js version (`node --version`)
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Error messages or logs

## Questions?

Feel free to open an issue for questions or discussions about potential contributions.
