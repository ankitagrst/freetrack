Design tokens and semantic classes

Purpose
- Reduce visual noise by using semantic color tokens and standardized typographic settings.

Usage
- Buttons: use `.btn-primary`, `.btn-success`, `.btn-danger`, `.btn-info`, `.btn-warning`, `.btn-accent`.
- Gradients/backgrounds: use `.bg-gradient-primary`, `.bg-gradient-success`, `.bg-gradient-danger`, `.bg-gradient-info`, `.bg-gradient-muted`.
- Text: use `.text-body` for body text and `.text-muted` for secondary text.
- Base font: `Inter` is included; default body uses `Inter` with system fallbacks.

Notes
- Avoid `from-...`/`to-...` hard-coded color utilities for major UI elements; prefer semantic classes so the entire app can switch palette centrally.
- For small, contextual color accents (e.g., status badges), continue using lighter gray/green/red utilities where appropriate.

Where defined
- Tailwind tokens: `tailwind.config.js`.
- Component utilities and variables: `src/index.css`.

Typography
- Base font: Inter (imported in `src/index.css`).
- Headings: use class combinations `text-xl font-bold` (page titles), `text-2xl/3xl font-bold` for larger headings.
- Body: use `text-body` for main text and `text-muted` for secondary text.

Next steps
- Convert remaining ad-hoc gradients to semantic classes where they represent significant UI surfaces.
- Add a `Dark Mode` palette and CSS variable themes (optional).

If you want different brand colors or to add theme variants (dark mode), I can add CSS variables or theme toggles next.