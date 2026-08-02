# Scenario Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the scenario selector into a responsive one-row carousel and reveal the updated scenario detail after direct mobile selection.

**Architecture:** The canonical static viewer in `../05_뷰어` owns HTML, CSS, and JavaScript behavior. The public site receives those files through `npm run sync:content`; the existing Node contract test protects required carousel hooks and the browser verifies real layout and scrolling.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js contract tests, Vinext/Vite build, Cloudflare Sites

## Global Constraints

- Keep all eight existing scenarios, images, copy, ordering, and reading-progress behavior unchanged.
- Use one horizontal scenario row at every viewport width.
- Reveal the updated detail only after direct activation on mobile.
- Preserve ARIA tab semantics and reduced-motion support.
- Edit canonical viewer files before synchronizing `public`.

---

### Task 1: Carousel Contract

**Files:**
- Modify: `tests/verify-public-contract.mjs`

**Interfaces:**
- Consumes: Canonical `review.html`, `review.css`, and `review.js` files under `../05_뷰어`.
- Produces: Assertions for carousel controls, one-row overflow CSS, active-card alignment, and mobile detail reveal.

- [ ] **Step 1: Write the failing test**

Add source assertions for `scenarioPrevious`, `scenarioNext`, horizontal overflow and scroll snap, `scrollActiveScenarioIntoView`, and `revealScenarioDetail`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`

Expected: FAIL because the canonical viewer still uses a desktop grid and has no carousel controls or reveal helpers.

- [ ] **Step 3: Keep the failure focused**

Confirm the first failure names a missing carousel hook rather than unrelated content or asset drift.

### Task 2: Canonical Carousel

**Files:**
- Modify: `../05_뷰어/review.html`
- Modify: `../05_뷰어/review.css`
- Modify: `../05_뷰어/review.js`

**Interfaces:**
- Consumes: Existing `scenarioList`, `scenarioView`, flow data, and Lucide arrow assets.
- Produces: `scenarioPrevious`, `scenarioNext`, `scrollActiveScenarioIntoView()`, and `revealScenarioDetail()`.

- [ ] **Step 1: Add carousel structure**

Wrap the tablist with previous and next icon buttons while preserving the tablist element and its label.

- [ ] **Step 2: Replace the responsive grid**

Use flex, horizontal overflow, stable card bases, and scroll snapping at all widths. Show three to four cards on desktop and one card plus a next-card edge on mobile.

- [ ] **Step 3: Implement horizontal controls**

Scroll by approximately one visible card per control activation and center the active card after a flow changes.

- [ ] **Step 4: Implement mobile reveal**

Pass a direct-activation option into `openFlow()`, render first, then scroll `scenarioView` below the sticky header only at `max-width: 760px`.

- [ ] **Step 5: Respect reduced motion**

Use instant scrolling when `prefers-reduced-motion: reduce` matches.

- [ ] **Step 6: Run the contract test**

Run: `npm test`

Expected: PASS with the existing public contract summary.

### Task 3: Public Sync And Visual Verification

**Files:**
- Modify: `public/reader.html`
- Modify: `public/review.css`
- Modify: `public/review.js`

**Interfaces:**
- Consumes: Canonical viewer files from Task 2.
- Produces: Deployable public assets matching the canonical implementation.

- [ ] **Step 1: Synchronize public output**

Run: `npm run sync:content`

Expected: `Public reader synchronized` with no internal-field leak error.

- [ ] **Step 2: Run tests and build**

Run: `npm test`

Run: `npm run build`

Expected: Both commands exit with code 0.

- [ ] **Step 3: Verify desktop layout**

At 1440x900, confirm one horizontal row, visible arrow controls, no card overlap, and a visible scenario detail below the row.

- [ ] **Step 4: Verify mobile interaction**

At 390x844, swipe or horizontally scroll the row, activate a non-current card, and confirm its scenario detail title is visible below the sticky header.

- [ ] **Step 5: Verify accessibility behavior**

Confirm arrow-key tab navigation still changes the active tab without forcing an unwanted vertical jump.

### Task 4: Publish

**Files:**
- Modify: Git history and the saved Sites version only.

**Interfaces:**
- Consumes: Verified source state and exact pushed commit SHA.
- Produces: GitHub branch update and production Sites deployment from the same commit.

- [ ] **Step 1: Review the diff**

Run: `git diff --check`

Run: `git status --short`

Expected: Only intended docs, tests, canonical viewer files, and synchronized public files appear.

- [ ] **Step 2: Commit and push**

Commit the verified change and push the current branch to GitHub.

- [ ] **Step 3: Save and deploy the exact commit**

Save a Sites version using the pushed commit SHA and deploy that saved version.

- [ ] **Step 4: Verify production**

Open the production reader with a fresh cache query and repeat the mobile scenario-selection check.

