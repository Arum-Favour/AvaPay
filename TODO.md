# Fix RefreshRuntime Error in use-auth.tsx

## Plan Steps
- [x] Create TODO.md with steps
- [x] Step 1: Update vite.config.ts - Scope expressPlugin middleware to '/api' only to preserve Vite HMR/Fast Refresh
- [ ] Step 2: Restart dev server with `pnpm dev`
- [ ] Step 3: Test - Navigate to app, edit/reload use-auth.tsx, confirm no $RefreshReg$ error
- [ ] Step 4: Clear caches if needed `rm -rf node_modules/.vite client/node_modules/.vite && pnpm install`
- [ ] Step 5: If persists, switch to @vitejs/plugin-react (install + replace)
- [ ] Complete: attempt_completion

Current progress: Config updated. User needs to run `pnpm dev` and test reload on use-auth.tsx.

