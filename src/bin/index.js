#!/usr/bin/env node

import { NpmMirrorManger } from "../lib/index.js";

async function coreDispatch() {
  const mangeger = new NpmMirrorManger();
  const command = process.argv[2] || "help";
  await mangeger.dispatchCommand(command);
}

coreDispatch();
