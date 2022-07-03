import { readdirSync, rmSync } from "fs";
import { resolve } from "path";
import {
  ASSETS_CARDS_PATH,
  CPKS_CARDS_PATH,
  CPKS_THUMB_PATH,
} from "./constants.js";
import extractCpk from "../cpk/cpk.js";

export function extractCards() {
  const files = readdirSync(resolve(CPKS_CARDS_PATH));

  for (const file of files) {
    try {
      const id = file.slice(0, -4);
      const path = resolve(CPKS_CARDS_PATH, file);
      extractCpk(path, resolve(ASSETS_CARDS_PATH, id));
      rmSync(path);
      console.info(`🟢 Extracted card ${id} !`);
    } catch (e) {
      console.info(`🔴 Error extracting card ${id} ! `, e);
    }
  }
}

export function extractThumbs() {
  try {
    const cpkThumbPath = resolve(CPKS_THUMB_PATH);
    extractCpk(cpkThumbPath, resolve(ASSETS_CARDS_PATH, "thumbnails"));
    rmSync(cpkThumbPath);
    console.info("🟢 Extracted thumbnails !");
  } catch (e) {
    console.info("🔴 Error extracting thumbnails ! ", e);
  }
}
