# Contributing to Fraud Vision

Thank you for your interest in contributing! Here's how to get started.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/Fraud-Vision.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Commit: `git commit -m "feat: describe your change"`
6. Push: `git push origin feature/your-feature-name`
7. Open a Pull Request

## Commit Message Format

Use conventional commits:
- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation changes
- `refactor:` — code refactoring
- `test:` — adding or updating tests
- `chore:` — maintenance tasks

## Development Setup

See the [README](README.md) for full local setup instructions.

### Running backend tests
```bash
python -m backend.test_rules
```

### Linting frontend
```bash
cd frontend && npm run lint
```

## Code Style

- **Python**: Follow PEP 8. Keep functions focused and add docstrings for complex logic.
- **TypeScript/React**: Use functional components with typed props. Keep components small and reusable.
- **API**: Follow RESTful conventions. All new endpoints must be secured with `Depends(auth.get_current_user)`.

## Reporting Bugs

Open a [GitHub Issue](https://github.com/hemanthkumarrrdy-bit/Fraud-Vision/issues) with:
- Steps to reproduce
- Expected vs actual behaviour
- Environment details (OS, Python version, Node version)
