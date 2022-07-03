import { extractCards, extractThumbs } from "./cards/extract.js";
import pullMissingCards from "./cards/pull.js";

console.info("🚀 START");

console.info("⌛ Pulling missing cards...");
const missingCards = pullMissingCards();
if (missingCards) {
  console.info("⌛ Extracting missing cards...");
  extractCards();
  console.info("⌛ Extracting thumbnails...");
  extractThumbs();
} else {
  console.info("🟢 No missing cards !");
}

console.info("⭐ END");
