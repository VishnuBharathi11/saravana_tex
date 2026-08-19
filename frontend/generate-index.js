import { spawn } from "child_process";
import http from "http";
import fs from "fs";
import path from "path";

const PORT = "3333";
console.log("Starting server to generate index.html...");

// Run the generated Nitro server
const server = spawn("node", [".output/server/index.mjs"], {
  env: { ...process.env, PORT, HOST: "localhost", NITRO_PORT: PORT, NITRO_HOST: "localhost" },
  stdio: "pipe",
});

let generated = false;

server.stdout.on("data", (data) => {
  const output = data.toString();
  console.log("[server]:", output);

  if (output.includes("Listening") && !generated) {
    generated = true;
    console.log("Server listening. Fetching HTML...");

    http
      .get(`http://localhost:${PORT}/`, (res) => {
        let html = "";
        res.on("data", (chunk) => {
          html += chunk;
        });
        res.on("end", () => {
          console.log("HTML fetched. Writing to .output/public/index.html...");
          fs.writeFileSync(path.join(".output", "public", "index.html"), html);

          console.log("Copying .output/public to dist...");
          if (fs.existsSync("dist")) {
            fs.rmSync("dist", { recursive: true, force: true });
          }
          fs.cpSync(path.join(".output", "public"), "dist", { recursive: true });

          console.log("Shutting down server...");
          server.kill();
          process.exit(0);
        });
      })
      .on("error", (err) => {
        console.error("Failed to fetch HTML:", err);
        server.kill();
        process.exit(1);
      });
  }
});

server.stderr.on("data", (data) => {
  console.error("[server err]:", data.toString());
});

setTimeout(() => {
  if (!generated) {
    console.error("Timeout waiting for server to start");
    server.kill();
    process.exit(1);
  }
}, 10000);
