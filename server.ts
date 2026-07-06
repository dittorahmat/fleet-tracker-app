import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import app from "./index.js";
import dotenv from "dotenv";

dotenv.config();

// Serve static dashboard files from the 'public' directory
app.use("/*", serveStatic({ root: "./public" }));

const port = process.env.PORT || 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port: Number(port),
});
