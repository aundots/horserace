import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(
  join(root, "assets/apps-in-toss/horse-gallop.svg"),
  "utf8",
);
const viewBox = svg.match(/viewBox="([^"]+)"/)[1];
const start = svg.indexOf('<path d="') + 9;
const end = svg.indexOf('z"/>', start) + 1;
const path = svg.slice(start, end).replace(/\s+/g, " ").trim();

mkdirSync(join(root, "src/assets"), { recursive: true });
writeFileSync(
  join(root, "src/assets/horseGallop.ts"),
  `export const GALLOP_VIEWBOX = ${JSON.stringify(viewBox)};\nexport const GALLOP_PATH = ${JSON.stringify(path)};\n`,
);

console.log("wrote src/assets/horseGallop.ts");
