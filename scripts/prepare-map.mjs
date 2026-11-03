import { copyFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const dist = dirname(fileURLToPath(import.meta.resolve("maplibre-gl")));
const target = join(process.cwd(), "public/vendor/maplibre");
mkdirSync(target, { recursive: true });
copyFileSync(join(dist, "maplibre-gl-worker.mjs"), join(target, "worker.mjs"));
copyFileSync(join(dist, "../LICENSE.txt"), join(target, "LICENSE.txt"));
