import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(siteRoot, ".openai", "hosting.json");
const destinationDir = path.join(siteRoot, "dist", ".openai");
const destination = path.join(destinationDir, "hosting.json");

await mkdir(destinationDir, { recursive: true });
await copyFile(source, destination);

console.log(`Sites metadata copied: ${destination}`);
