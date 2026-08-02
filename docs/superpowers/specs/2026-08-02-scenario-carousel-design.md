# Scenario Carousel Design

## Goal

Replace the tall opening-scenario grid with a single horizontal carousel so a selected scenario and its updated detail remain easy to connect, especially on mobile.

## Interaction

- Use one horizontal row at every viewport width.
- Show roughly three to four cards on desktop and one card plus a visible next-card edge on mobile.
- Keep touch drag, trackpad scroll, mouse-wheel horizontal scrolling, and keyboard tab behavior.
- Provide icon-only previous and next controls on desktop. Hide them on mobile where direct touch scrolling is primary.
- Keep the existing ARIA tablist and arrow-key navigation.
- Center the active card horizontally after selection.
- When a scenario card is directly activated on a mobile viewport, render the new detail and then scroll its top below the sticky header.
- Do not force vertical scrolling during initial page load, hash routing, or arrow-key browsing.
- Respect `prefers-reduced-motion`.

## Visual Rules

- Reuse the existing scenario images, titles, progress states, active border, and card proportions.
- Preserve a small visible portion of the next mobile card to communicate that the row is swipeable.
- Keep the carousel unframed. Arrow controls sit beside the row and use the existing Lucide arrow assets.
- Do not change scenario content, document content, illustration assignments, or reading-progress storage.

## Implementation Boundary

- Canonical viewer files remain under `../05_뷰어`.
- `npm run sync:content` copies canonical viewer output into `public`.
- Contract tests verify that the canonical viewer uses a horizontal carousel, includes controls, and contains mobile detail-reveal behavior.
- Browser verification covers desktop and mobile framing, horizontal overflow, active-card alignment, and post-selection detail visibility.

