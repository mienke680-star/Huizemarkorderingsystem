// Netlify's manual zip-upload deploy path can't run Netlify Build Plugins
// (confirmed by reproducing the same generic "exit code 2" failure with a
// completely vanilla create-next-app project on both Next 15 and Next 16 —
// @netlify/plugin-nextjs, which normally converts the build into
// per-route serverless functions automatically, simply doesn't run here).
//
// This script is the manual equivalent: it copies the `output: "standalone"`
// build (a self-contained Node HTTP server) into a single catch-all Netlify
// Function, which the function then boots as a child process and reverse
// proxies every request to. Less granular than the real plugin (one
// function instead of per-route splitting, and static assets round-trip
// through the function instead of being served from the CDN edge), but it
// gets a fully working deployment out of a deploy path that won't run
// build plugins at all.
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const functionDir = path.join(root, "netlify", "functions", "next-server");
const standaloneOut = path.join(functionDir, "standalone");

function moveInto(src, dest) {
  mkdirSync(path.dirname(dest), { recursive: true });
  execFileSync("mv", [src, dest]);
}

rmSync(standaloneOut, { recursive: true, force: true });

// The full root node_modules (hundreds of MB) and the webpack/turbopack
// build cache are both dead weight once `next build` has finished — the
// standalone output already carries its own minimal, traced node_modules.
// Freeing this before moving files around keeps peak disk usage on
// constrained CI build containers as low as possible.
rmSync(path.join(root, "node_modules"), { recursive: true, force: true });
rmSync(path.join(root, ".next", "cache"), { recursive: true, force: true });

// mv (not cp) so the source is never duplicated on disk, even briefly.
mkdirSync(functionDir, { recursive: true });
execFileSync("mv", [path.join(root, ".next", "standalone"), standaloneOut]);
moveInto(path.join(root, ".next", "static"), path.join(standaloneOut, ".next", "static"));
moveInto(path.join(root, "public"), path.join(standaloneOut, "public"));

console.log("Prepared standalone Next.js server for Netlify Function at", standaloneOut);
