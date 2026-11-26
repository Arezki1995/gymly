# Gymly

A phone-first PWA for gym mobility training: shoulder rotation, overhead mobility, hips and joint health, with XP, levels and weekly streaks. Static site, no backend; data stays in your browser.

- Spec and phased plan: [`docs/BRIEF.md`](docs/BRIEF.md)
- Rules for contributors/agents: [`CLAUDE.md`](CLAUDE.md)
- Decisions log: [`docs/DECISIONS.md`](docs/DECISIONS.md)

## Commands

```bash
npm install
npm run dev      # local dev server
npm run lint     # ESLint + Prettier check
npm run test     # Vitest
npm run build    # type-check + production build to dist/
```

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes `dist/` to GitHub Pages. In the repo settings, set **Pages → Source** to **GitHub Actions** once.
