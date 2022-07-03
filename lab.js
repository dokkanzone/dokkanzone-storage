import { readdirSync } from "fs";

const dirs = readdirSync("./assets/cards");

for (const dir of dirs) {
  const files = readdirSync(`./assets/cards/${dir}`);
  if (files.length < 4) console.log(dir, files);
}
