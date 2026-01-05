#!/usr/bin/env node

import { mkdir, cp } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const source = path.resolve(
  __dirname,
  "../src/schema/surfaces.web.contract.schema.json",
);
const destinationDir = path.resolve(__dirname, "../dist/schema");
const destination = path.join(destinationDir, "surfaces.web.contract.schema.json");

await mkdir(destinationDir, { recursive: true });
await cp(source, destination);

