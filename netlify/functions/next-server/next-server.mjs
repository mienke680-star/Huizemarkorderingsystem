// Catch-all Netlify Function that boots the standalone Next.js server
// (copied in at build time by scripts/prepare-netlify-function.mjs) as a
// child process on first invocation, then reverse-proxies every request to
// it. See that script for why this exists instead of the usual
// @netlify/plugin-nextjs integration.
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 4000;
const HOST = "127.0.0.1";

let serverReady;

function bootServer() {
  if (serverReady) return serverReady;

  serverReady = new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, "standalone", "server.js");
    const child = spawn(process.execPath, [serverPath], {
      env: { ...process.env, PORT: String(PORT), HOSTNAME: HOST },
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code !== 0) {
        serverReady = undefined;
        reject(new Error(`Next.js server exited with code ${code}`));
      }
    });

    const deadline = Date.now() + 9000;
    const check = async () => {
      try {
        await fetch(`http://${HOST}:${PORT}/login`, { method: "HEAD" });
        resolve();
      } catch {
        if (Date.now() > deadline) {
          reject(new Error("Next.js server did not become ready in time"));
          return;
        }
        setTimeout(check, 150);
      }
    };
    setTimeout(check, 250);
  });

  return serverReady;
}

export default async (request) => {
  await bootServer();

  const url = new URL(request.url);
  const target = `http://${HOST}:${PORT}${url.pathname}${url.search}`;
  const hasBody = !["GET", "HEAD"].includes(request.method);

  const upstream = await fetch(target, {
    method: request.method,
    headers: request.headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: upstream.headers,
  });
};

export const config = { path: "/*" };
