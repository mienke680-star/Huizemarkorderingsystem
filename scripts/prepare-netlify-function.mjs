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
import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const functionDir = path.join(root, "netlify", "functions", "next-server");
const standaloneOut = path.join(functionDir, "standalone");

await rm(standaloneOut, { recursive: true, force: true });
await mkdir(standaloneOut, { recursive: true });

await cp(path.join(root, ".next", "standalone"), standaloneOut, { recursive: true });
await cp(path.join(root, ".next", "static"), path.join(standaloneOut, ".next", "static"), { recursive: true });
await cp(path.join(root, "public"), path.join(standaloneOut, "public"), { recursive: true });

console.log("Prepared standalone Next.js server for Netlify Function at", standaloneOut);
