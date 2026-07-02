import { tmpdir } from "node:os";
import path from "node:path";
import { createApp } from "./app";

/** Process entry point: build the app (see app.ts) and bind the port. */
const PORT = Number(process.env.PORT ?? 8787);

createApp().listen(PORT, () => {
  console.log(`\n  CodeConsul verify server → http://localhost:${PORT}`);
  console.log(`  clones under: ${path.join(tmpdir(), "codeconsul-verify")}\n`);
});
