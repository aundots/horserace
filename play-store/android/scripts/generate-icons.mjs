import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import sharp from "../../../assets/apps-in-toss/node_modules/sharp/lib/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const res = join(root, "app", "src", "main", "res");
const logo = join(
  root,
  "..",
  "..",
  "assets",
  "apps-in-toss",
  "export",
  "app-logo-600x600.png",
);

const sizes = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

for (const [folder, size] of Object.entries(sizes)) {
  const dir = join(res, folder);
  mkdirSync(dir, { recursive: true });
  await sharp(logo)
    .resize(size, size, { fit: "cover" })
    .png()
    .toFile(join(dir, "ic_launcher.png"));
  await sharp(logo)
    .resize(size, size, { fit: "cover" })
    .png()
    .toFile(join(dir, "ic_launcher_round.png"));
}

const fgDir = join(res, "drawable");
mkdirSync(fgDir, { recursive: true });
await sharp(logo)
  .resize(432, 432, { fit: "cover" })
  .png()
  .toFile(join(fgDir, "ic_launcher_foreground.png"));

console.log("Launcher icons generated from", logo);
