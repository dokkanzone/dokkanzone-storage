import { execSync } from "child_process";
import { readdirSync } from "fs";
import { resolve } from "path";
import {
  CPKS_CARDS_PATH,
  CPKS_THUMB_PATH,
  GAME_CARDS_PATH,
  GAME_CARDS_THUMB_PATH,
} from "./constants.js";

function getCurrentCards() {
  return readdirSync("./assets/cards");
}

function getGameCards() {
  const output = execSync(
    `adb shell "ls ${GAME_CARDS_PATH} | sed -e 's/\\.cpk$//'"`
  ).toString();

  const ids = output.split("\n");
  ids.pop();

  return ids;
}

function getMissingCards() {
  const currentIds = getCurrentCards();
  const gameIds = getGameCards();

  return gameIds.filter((c) => !currentIds.includes(c));
}

export default function pullMissingCards() {
  const ids = getMissingCards();

  if (ids.length) {
    try {
      execSync(`adb pull ${GAME_CARDS_THUMB_PATH} ${resolve(CPKS_THUMB_PATH)}`);
      console.info("🟢 Pulled thumbnails !");
    } catch (e) {
      console.info("🔴 Error pulling thumbnails !", e);
    }

    for (const id of ids) {
      try {
        execSync(
          `adb pull ${GAME_CARDS_PATH}/${id}.cpk ${resolve(CPKS_CARDS_PATH)}`
        );
        console.info(`🟢 Pulled card ${id} !`);
      } catch (e) {
        console.info(`🔴 Error pulling card ${id} ! `, e);
      }
    }
  }

  return ids.length;
}
