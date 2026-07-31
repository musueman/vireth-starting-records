import { copyFile, mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const archiveRoot = path.resolve(siteRoot, "..");
const viewerRoot = path.join(archiveRoot, "05_뷰어");
const publicRoot = path.join(siteRoot, "public");
const publicAssets = path.join(publicRoot, "assets", "start-situations");
const sourceAssets = path.join(viewerRoot, "assets", "start-situations");

await mkdir(publicAssets, { recursive: true });

const files = [
  ["review.html", "reader.html"],
  ["review.css", "review.css"],
  ["review.js", "review.js"],
  ["public-reading-data.js", "public-reading-data.js"]
];

for (const [source, destination] of files) {
  await copyFile(path.join(viewerRoot, source), path.join(publicRoot, destination));
}

for (const filename of await readdir(sourceAssets)) {
  if (filename.endsWith(".webp")) {
    await copyFile(path.join(sourceAssets, filename), path.join(publicAssets, filename));
  }
}

const publicData = await readFile(path.join(publicRoot, "public-reading-data.js"), "utf8");
const forbidden = ["canonicalRoot", "00_관리", "04_검증", "searchText", '"path":'];
const leaked = forbidden.filter((value) => publicData.includes(value));
if (leaked.length) {
  throw new Error(`Internal fields found in public data: ${leaked.join(", ")}`);
}

console.log(`Public reader synchronized: ${publicRoot}`);
