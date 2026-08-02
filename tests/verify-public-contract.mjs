import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const archiveRoot = path.resolve(repoRoot, "..");
const masterPath = path.join(
  archiveRoot,
  "00_관리",
  "기록문서_마스터인덱스_v1.json",
);
const referencesPath = path.join(
  archiveRoot,
  "00_관리",
  "초기열람_참고설명_v1.json",
);
const visualManifestPath = path.join(
  archiveRoot,
  "00_관리",
  "기록문서_시각자산_매니페스트_v1.json",
);
const generatedDataPath = path.join(
  archiveRoot,
  "05_뷰어",
  "public-reading-data.js",
);

const expectedExistingFlows = new Map([
  [
    "gate-watch",
    ["ini-com-03", "ini-com-04", "ini-com-07", "ini-rol-01"],
  ],
  [
    "mercenary-contract",
    ["ini-com-05", "ini-com-06", "ini-com-04", "ini-rol-02"],
  ],
  [
    "held-cargo",
    ["ini-com-02", "ini-com-03", "ini-com-04", "ini-rol-03"],
  ],
  [
    "strange-tracks",
    ["ini-com-01", "ini-com-06", "ini-com-07", "ini-rol-04"],
  ],
  [
    "market-ledger",
    ["ini-com-03", "ini-com-05", "ini-com-02", "ini-rol-05"],
  ],
  [
    "ration-line",
    ["ini-com-02", "ini-com-03", "ini-com-04", "ini-rol-06"],
  ],
  [
    "harbor-dawn",
    ["ini-com-01", "ini-com-02", "ini-com-06", "ini-rol-07"],
  ],
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readGeneratedData(filePath) {
  const source = fs.readFileSync(filePath, "utf8").trim();
  const match = source.match(
    /^window\.VIRETH_PUBLIC_READING\s*=\s*(\{[\s\S]*\});?$/,
  );
  assert.ok(match, "generated reading data must assign a JSON object");
  return JSON.parse(match[1]);
}

function assertUnique(values, label) {
  assert.equal(
    new Set(values).size,
    values.length,
    `${label} must contain unique values`,
  );
}

function assertPngHasAlpha(filePath, label) {
  const bytes = fs.readFileSync(filePath);
  const pngSignature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  assert.ok(bytes.subarray(0, 8).equals(pngSignature), `${label} must be PNG`);
  assert.ok(
    [4, 6].includes(bytes[25]),
    `${label} must include an alpha channel`,
  );
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

const master = readJson(masterPath);
const visualManifest = readJson(visualManifestPath);
const referencesSource = readJson(referencesPath);
const generated = readGeneratedData(generatedDataPath);

assert.equal(master.project.name, "비레스 5083 이야기 서고");
assert.equal(master.project.world, "Vireth 5083");
assert.equal(master.startReading.defaultFlowCount, 1);
assert.equal(master.startReading.readingFlows.length, 8);
assert.equal(master.startReading.readingFlows[0].id, "gate-arrival");

const flowIds = master.startReading.readingFlows.map((flow) => flow.id);
assertUnique(flowIds, "reading flow ids");

const startImages = master.startReading.readingFlows.map((flow) => flow.image);
assertUnique(startImages, "reading flow images");
assert.deepEqual(master.startReading.readingFlows[0].documentIds, [
  "ini-com-02",
  "ini-rol-02",
  "ini-com-06",
  "ini-com-03",
]);

for (const [flowId, documentIds] of expectedExistingFlows) {
  const flow = master.startReading.readingFlows.find(
    (candidate) => candidate.id === flowId,
  );
  assert.ok(flow, `existing flow ${flowId} must remain`);
  assert.deepEqual(
    flow.documentIds,
    documentIds,
    `existing flow ${flowId} document order changed`,
  );
}

const sourceDocumentIds = master.sourceDocuments
  .filter((document) => document.id.startsWith("ini-"))
  .map((document) => document.id);
assert.equal(sourceDocumentIds.length, 14);
assertUnique(sourceDocumentIds, "source document ids");

assert.equal(referencesSource.schemaVersion, 1);
assert.equal(referencesSource.documents.length, 14);
assertUnique(
  referencesSource.documents.map((document) => document.id),
  "reference document ids",
);

const expectedGuideAssignments = {
  ren: [
    "ini-com-01",
    "ini-com-02",
    "ini-com-05",
    "ini-com-06",
    "ini-com-07",
    "ini-rol-03",
    "ini-rol-05",
  ],
  duran: [
    "ini-com-03",
    "ini-com-04",
    "ini-rol-01",
    "ini-rol-02",
    "ini-rol-04",
    "ini-rol-06",
    "ini-rol-07",
  ],
};

for (const documentId of sourceDocumentIds) {
  const referenceDocument = referencesSource.documents.find(
    (document) => document.id === documentId,
  );
  assert.ok(referenceDocument, `references missing for ${documentId}`);
  assert.ok(referenceDocument.guide, `guide missing for ${documentId}`);
  assert.ok(
    ["ren", "duran"].includes(referenceDocument.guide.id),
    `${documentId} has an invalid guide id`,
  );
  assert.ok(referenceDocument.guide.name?.trim(), `${documentId} guide name missing`);
  assert.ok(referenceDocument.guide.label?.trim(), `${documentId} guide label missing`);
  assert.ok(
    referenceDocument.guide.summary?.trim(),
    `${documentId} guide summary missing`,
  );
  assert.ok(
    referenceDocument.references.length >= 1 &&
      referenceDocument.references.length <= 5,
    `${documentId} must have 1-5 references`,
  );
  for (const reference of referenceDocument.references) {
    assert.ok(reference.term?.trim(), `${documentId} has an empty term`);
    assert.ok(
      reference.explanation?.trim(),
      `${documentId} has an empty explanation`,
    );
  }
}

for (const [guideId, expectedDocumentIds] of Object.entries(expectedGuideAssignments)) {
  const assignedDocumentIds = referencesSource.documents
    .filter((document) => document.guide.id === guideId)
    .map((document) => document.id);
  assert.deepEqual(
    assignedDocumentIds,
    expectedDocumentIds,
    `${guideId} guide assignment changed`,
  );
}

const allTerms = referencesSource.documents.flatMap((document) =>
  document.references.map((reference) => reference.term),
);
for (const requiredTerm of [
  "첫째 종",
  "스물여섯째 종",
  "녹지절력·해도력·명예력",
  "은량·동각·철각",
]) {
  assert.ok(allTerms.includes(requiredTerm), `missing reference: ${requiredTerm}`);
}

const illustrationEntries = Object.values(visualManifest.documents).flatMap(
  (document) => document.illustrations,
);
assert.equal(illustrationEntries.length, 30);
assertUnique(
  illustrationEntries.map((illustration) => illustration.id),
  "illustration ids",
);

assert.equal(generated.project.name, "비레스 5083 이야기 서고");
assert.equal(generated.project.world, "Vireth 5083");
assert.equal(generated.startReading.readingFlows.length, 8);
assert.equal(generated.startReading.readingFlows[0].id, "gate-arrival");
assert.equal(generated.documents.length, 14);
assert.equal(
  generated.documents.filter(
    (document) =>
      Array.isArray(document.references) &&
      document.references.length >= 1 &&
      document.references.length <= 5,
  ).length,
  14,
);
assert.equal(
  generated.documents.filter(
    (document) =>
      ["ren", "duran"].includes(document.guide?.id) &&
      document.guide?.name?.trim() &&
      document.guide?.label?.trim() &&
      document.guide?.summary?.trim(),
  ).length,
  14,
  "all public documents must include a complete guide",
);

for (const relativePath of [
  "public/reader.html",
  "public/review.js",
  "public/public-reading-data.js",
  "app/page.tsx",
  "app/layout.tsx",
]) {
  const contents = fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
  assert.doesNotMatch(
    contents,
    /Arcadia|ARCADIA|arcadia|아르카디아/,
    `forbidden public name found in ${relativePath}`,
  );
}

for (const flow of generated.startReading.readingFlows) {
  const assetPath = path.join(archiveRoot, "05_뷰어", flow.image);
  assert.ok(fs.existsSync(assetPath), `missing start image ${flow.image}`);
}

const viewerHtml = fs.readFileSync(
  path.join(archiveRoot, "05_뷰어", "review.html"),
  "utf8",
);
const viewerJs = fs.readFileSync(
  path.join(archiveRoot, "05_뷰어", "review.js"),
  "utf8",
);
const viewerCss = fs.readFileSync(
  path.join(archiveRoot, "05_뷰어", "review.css"),
  "utf8",
);
assert.doesNotMatch(
  viewerHtml,
  /assets\/archive-stage\/(?:ren|duran)-cutout\.png/,
  "hero must not contain decorative Ren or Duran portraits",
);
for (const requiredCarouselHook of [
  'id="scenarioPrevious"',
  'id="scenarioNext"',
]) {
  assert.match(
    viewerHtml,
    new RegExp(requiredCarouselHook),
    `missing scenario carousel hook ${requiredCarouselHook}`,
  );
}
assert.match(
  viewerCss,
  /\.scenario-list\s*\{[^}]*display:\s*flex;[^}]*overflow-x:\s*auto;[^}]*scroll-snap-type:\s*x\s+mandatory;/s,
  "scenario list must be a one-row horizontal snap carousel",
);
assert.doesNotMatch(
  viewerCss,
  /\.scenario-list\s*\{[^}]*grid-template-columns:/s,
  "scenario list must not fall back to a multi-row grid",
);
for (const requiredBehavior of [
  "function scrollActiveScenarioIntoView",
  "function revealScenarioDetail",
  'window.matchMedia("(max-width: 760px)")',
  "scenarioView.scrollIntoView",
]) {
  assert.match(
    viewerJs,
    new RegExp(requiredBehavior.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `missing scenario carousel behavior ${requiredBehavior}`,
  );
}
for (const requiredHook of [
  'id="readerGuide"',
  'id="readerGuidePortrait"',
  'id="readerGuideLabel"',
  'id="readerGuideName"',
  'id="readerGuideSummary"',
]) {
  assert.match(viewerJs, new RegExp(requiredHook), `missing guide hook ${requiredHook}`);
}

const guideDimensions = [];
for (const character of ["ren", "duran"]) {
  const relativeAsset = `assets/story-guides/${character}-ending-guide.png`;
  assert.match(
    viewerJs,
    new RegExp(relativeAsset.replaceAll("/", "\\/").replace(".", "\\.")),
    `${character} ending guide must be rendered by the reader`,
  );
  guideDimensions.push(
    assertPngHasAlpha(
      path.join(archiveRoot, "05_뷰어", relativeAsset),
      `${character} ending guide`,
    ),
  );
}
assert.deepEqual(
  guideDimensions[0],
  guideDimensions[1],
  "guide portraits must use identical pixel dimensions",
);
assert.ok(
  Math.abs(guideDimensions[0].width / guideDimensions[0].height - 4 / 5) < 0.001,
  "guide portraits must use a 4:5 aspect ratio",
);

console.log(
  "Public contract verified: 8 flows, 14 documents, 30 illustrations, 14 reference sets.",
);
