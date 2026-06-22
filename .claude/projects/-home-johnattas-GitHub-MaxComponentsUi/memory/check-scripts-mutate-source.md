---
name: check-scripts-mutate-source
description: scripts/check-*.cjs rewrite component .vue files when run (auto-add imports)
metadata:
  type: project
---

The `scripts/check-*.cjs` utilities (check-imports, check-vue-imports, check-vueuse-imports, check-more-imports) are NOT read-only — running them parses each `src/components/*.vue` template and **auto-writes missing imports** into the `<script setup>` block ("-> Automatically added!"). Most components rely on the unplugin auto-import resolver, so running these scripts will introduce explicit imports across many files as a side effect.

**Why:** Easy to accidentally mutate dozens of components by running a check script for verification.

**How to apply:** Run them only intentionally; `git diff` after, and revert unwanted additions. Moved from `src/` to `scripts/` on 2026-06-22 (their `__dirname` paths were rewritten to point at `../src`).
