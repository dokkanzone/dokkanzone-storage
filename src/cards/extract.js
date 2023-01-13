import { readdirSync, rmSync, lstatSync } from "fs";
import { join, resolve, extname } from "path";
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

export function extractAll() {
  const sourcePath = resolve("./data/files/assets");
  const destPath = resolve("./images");
  const cpkFiles = getAllCpkFiles(sourcePath);

  for (const filePath of cpkFiles) {
    try {
      const basePath = filePath.split(sourcePath)[1].slice(0, -4);
      const imagePath = resolve(join(destPath, basePath));
      extractCpk(filePath, imagePath);
      console.info(`🟢 Extracted ${basePath} !`);
    } catch (e) {
      console.info(`🔴 Error extracting ${basePath} ! `, e);
    }
  }
}

function getAllCpkFiles(path, allFiles = []) {
  const files = readdirSync(path);

  for (const file of files) {
    const stat = lstatSync(join(path, file));
    if (stat.isDirectory()) {
      getAllCpkFiles(join(path, file), allFiles);
    } else if (extname(file) === ".cpk") {
      allFiles.push(join(path, file));
    }
  }

  return allFiles;
}
