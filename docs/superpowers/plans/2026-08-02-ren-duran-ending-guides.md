# Ren and Duran Ending Guides Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the decorative hero portraits with a matched Ren and Duran portrait pair that appears at the end of each story and explains difficult context in character.

**Architecture:** The reference JSON remains the source of truth and gains a `guide` object per document. The archive builder validates and publishes that object, while the reader renders a character-specific ending panel above the existing glossary. The two portrait assets share one canvas ratio, transparent background, subject scale, baseline, and edge padding.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js content builder, Vinext/Cloudflare Sites, Playwright visual verification.

## Global Constraints

- The public world name is `비레스 5083`; `아르카디아` must not appear in public output.
- Ren and Duran are guides, not the authors of the discovered documents and not an omniscient source of truth.
- Guide summaries explain only the practical reading lens; unresolved responsibility, motive, rumor, and folklore remain unresolved.
- Ren handles everyday life, names, trade, travel, and social context.
- Duran handles procedure, evidence, risk, responsibility, contracts, and safety.
- Character portraits use identical `4:5` canvases with transparent backgrounds, generous edge padding, and no cropped hair, cloak, limbs, or equipment.
- Duran uses the active outfit canon: red mantle, black upper shirt, dark navy trousers, worn brown leather, and simple silver bracers.
- Validate a small portrait A/B set before integrating selected assets.

---

### Task 1: Add Guide Ownership to the Reference Source

**Files:**
- Modify: `../00_관리/초기열람_참고설명_v1.json`
- Modify: `../90_도구/build_viewer.mjs`
- Modify: `tests/verify-public-contract.mjs`

**Interfaces:**
- Consumes: existing `{ id, references[] }` records.
- Produces: `{ id, guide: { id, name, label, summary }, references[] }` for all 14 public documents.

- [ ] **Step 1: Add failing contract assertions**

Assert that all 14 reference records contain `guide.id`, `guide.name`, `guide.label`, and `guide.summary`, that `guide.id` is `ren` or `duran`, and that both guides own seven documents.

- [ ] **Step 2: Run the contract test and verify failure**

Run: `npm test`

Expected: failure because current reference records do not contain `guide`.

- [ ] **Step 3: Add the 7/7 assignment and in-character summaries**

Assign Ren to `ini-com-01`, `ini-com-02`, `ini-com-05`, `ini-com-06`, `ini-com-07`, `ini-rol-03`, and `ini-rol-05`.

Assign Duran to `ini-com-03`, `ini-com-04`, `ini-rol-01`, `ini-rol-02`, `ini-rol-04`, `ini-rol-06`, and `ini-rol-07`.

Each summary must be one or two Korean sentences, concrete enough to orient a first-time reader without resolving the document's intended ambiguity.

- [ ] **Step 4: Extend builder validation and public serialization**

Validate the guide object in `build_viewer.mjs`, retain it in `referencesById`, and emit it beside `references` in each public document.

- [ ] **Step 5: Rebuild and run the contract test**

Run:

```powershell
node ..\90_도구\build_viewer.mjs
npm run sync:content
npm test
```

Expected: all contract checks pass and 14 public documents include guide data.

### Task 2: Produce the Matched Guide Portrait Pair

**Files:**
- Create: `../05_뷰어/assets/story-guides/ren-ending-guide.png`
- Create: `../05_뷰어/assets/story-guides/duran-ending-guide.png`
- Modify: `tests/verify-public-contract.mjs`

**Interfaces:**
- Consumes: approved Vireth character references and the canonical character style lock.
- Produces: two transparent 4:5 PNG assets with matched scale and padding.

- [ ] **Step 1: Generate two small A/B candidates per character**

Use the approved character references. Keep the scene to one fully contained character on a flat removable chroma-key background, with a calm three-quarter waist-up guide pose and no text, props, frame, shadow, or scenery.

- [ ] **Step 2: Remove the chroma key and validate alpha**

Run the installed `remove_chroma_key.py` helper with soft matte and despill. Confirm transparent corners, visible alpha variation, no key-color fringe, and no edge contact.

- [ ] **Step 3: Select one matched pair**

Select the pair with the closest head scale, shoulder width, lower baseline, visual weight, and rendering style. Reject any candidate with cropped hair, cloak, arm, hand, or equipment.

- [ ] **Step 4: Add image contract checks**

Assert both final files exist, are PNGs with alpha, share the same pixel dimensions, and have a `4:5` aspect ratio.

### Task 3: Render the Character-Owned Ending Panel

**Files:**
- Modify: `../05_뷰어/review.html`
- Modify: `../05_뷰어/review.js`
- Modify: `../05_뷰어/review.css`
- Modify: `tests/verify-public-contract.mjs`

**Interfaces:**
- Consumes: `sourceDocument.guide` and the two story-guide portrait assets.
- Produces: a responsive ending panel containing portrait, guide identity, summary, and the existing reference glossary.

- [ ] **Step 1: Remove the decorative hero guide figures**

Delete the `stage-guides` block from `review.html` so Ren and Duran no longer compete with the hero copy or become cropped decoration.

- [ ] **Step 2: Add the ending guide markup**

Add `readerGuide`, `readerGuidePortrait`, `readerGuideLabel`, `readerGuideName`, and `readerGuideSummary` elements above the glossary list inside `readerReferences`.

- [ ] **Step 3: Populate the panel in `renderReferences()`**

Map `ren` to `assets/story-guides/ren-ending-guide.png` and `duran` to `assets/story-guides/duran-ending-guide.png`. Set text, `alt`, and a `data-guide-id` attribute from the document guide object.

- [ ] **Step 4: Style the panel for desktop and mobile**

Use an unframed two-column layout on desktop and a compact portrait-plus-copy layout on mobile. Use `object-fit: contain`, fixed aspect ratio, adequate text padding, dark body text, and no nested card treatment.

- [ ] **Step 5: Add DOM contract checks**

Assert that the stage no longer references the guide portraits and the reader code references both story-guide files and all guide panel hooks.

### Task 4: Verify, Publish, and Deploy

**Files:**
- Modify: `README.md` only if the public reader behavior description is stale.
- Create: `output/playwright/vireth-ending-guides-desktop.png`
- Create: `output/playwright/vireth-ending-guides-mobile.png`

**Interfaces:**
- Consumes: synchronized public source.
- Produces: verified Git commit, GitHub push, saved Sites version, and production deployment.

- [ ] **Step 1: Synchronize and run automated verification**

Run:

```powershell
npm run sync:content
npm test
npm run build
npx wrangler deploy --dry-run --config dist/server/wrangler.json
```

Expected: all commands exit successfully.

- [ ] **Step 2: Run local browser checks**

Verify at desktop and `390x844` mobile widths that:

- the hero has no Ren or Duran decoration;
- all 14 documents show exactly one guide;
- the correct guide and summary change between documents;
- portraits are fully visible with no clipping or overlap;
- body copy remains dark, bold enough, and separated from adjacent layers.

- [ ] **Step 3: Commit and push the exact verified source**

Commit the source and generated public artifacts, then push `main` to GitHub and confirm the remote SHA matches local `HEAD`.

- [ ] **Step 4: Save and deploy through Sites**

Use `.openai/hosting.json` project id `appgprj_6a6c8cb85eec81918795f437298535e0`. Save a version with the pushed commit SHA, deploy that saved version, and inspect the deployment until terminal success.
