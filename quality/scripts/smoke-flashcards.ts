import fs from "node:fs";
import path from "node:path";
import { validateCard } from "./validate-flashcards";

const dir = process.argv[2] ?? "data/flashcards";
const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
let bad = 0;

for (const f of files) {
  const raw = fs.readFileSync(path.join(dir,f), "utf8");
  const rows = JSON.parse(raw);
  const cards = Array.isArray(rows) ? rows : [rows];

  for (const c of cards) {
    const { ok, errors } = validateCard(c);
    if (!ok) { bad++; console.error(`❌ ${f}:`, errors); }
    // Proste heurystyki poziomu:
    if ((c.cefr === "A1" || c.cefr === "A2") && (c.definition?.split(/\s+/).length ?? 0) > 20) {
      bad++; console.error(`❌ ${f}: A1/A2 definition too long`);
    }
    if ((c.cefr === "B2" || c.cefr === "C1" || c.cefr === "C2") && !(c.examples?.length > 0)) {
      bad++; console.error(`❌ ${f}: B2+ requires at least one example`);
    }
  }
}

if (bad) { console.error(`FAILED smoke: ${bad} issues.`); process.exit(1); }
console.log("✅ Smoke OK");
