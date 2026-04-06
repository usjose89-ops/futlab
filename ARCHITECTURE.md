# AppAcademiaFut Structure

This project is organized for incremental scaling without introducing a build step.

## Current layout

- `index.html`: main app shell and view markup.
- `styles.css`: CSS aggregator that imports modular styles.
- `dashboard.html`, `dashboard.css`, `training-panel.html`: legacy/auxiliary views.
- `assets/images/branding`: brand assets (logos).
- `assets/images/landing`: landing and manager hero assets.
- `assets/images/shared`: shared profile/demo images.
- `src/js/data/mockData.js`: demo data generator and stats engine.
- `src/js/core/state.js`: global state and core helpers.
- `src/js/modules/auth.js`: login, onboarding, app shell transitions.
- `src/js/modules/player.js`: player profile rendering and charts.
- `src/js/modules/academy.js`: academy list/detail, manager workflows, navigation.
- `src/js/modules/video/index.js`: scaffold for video workflows.
- `src/js/modules/pagos/index.js`: scaffold for billing/payments workflows.
- `src/js/modules/calendario/index.js`: scaffold for scheduling workflows.
- `src/js/main.js`: bootstrap listeners (`keydown`, `window.onload`).
- `src/styles/base.css`: reset, tokens, and shared layout styles.
- `src/styles/auth.css`: landing/login/onboarding styles.
- `src/styles/player.css`: player HUD/profile styles.
- `src/styles/academy.css`: academy/manager styles.

## Module rules

- Keep shared mutable state only in `src/js/core/state.js`.
- Add new feature code under `src/js/modules/<feature>.js`.
- For larger features, prefer `src/js/modules/<feature>/index.js` plus subfiles.
- Do not place new images or media in repository root.
- Avoid adding inline styles and inline event handlers for new features.
- Keep script loading order in `index.html`: data -> core -> modules -> main.

## Next scaling step (recommended)

- Replace remaining inline `style="..."` attributes in `index.html` with component classes.
- Add a lightweight module registry in `src/js/main.js` to initialize optional modules by feature flag.
