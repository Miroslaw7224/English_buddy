import Ajv from "ajv";
import addFormats from "ajv-formats";
import schema from "../schemas/flashcard.schema.json";

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
addFormats(ajv);
const validate = ajv.compile(schema);

type Card = Record<string, unknown>;
export function validateCard(card: Card) {
  const ok = validate(card);
  const errors: string[] = [];
  if (!ok && validate.errors) {
    errors.push(...validate.errors.map(e => `${e.instancePath} ${e.message}`));
  }
  // Dodatkowe reguły:
  const term = (card.term as string)?.trim();
  const trans = (card.translation as string)?.trim();
  if (term && trans && term.toLowerCase() === trans.toLowerCase()) {
    errors.push("term and translation must differ.");
  }
  const badChars = /[<>]/; // uniknij HTML-injection
  if (badChars.test(term) || badChars.test(trans)) {
    errors.push("term/translation contains forbidden characters (< or >).");
  }
  // Prosta kontrola „poziomu vs słowo” (heurystyka)
  const cefr = card.cefr as string;
  if (cefr === "A1" && term && term.length > 20) {
    errors.push("A1 term seems too long — heuristic length check.");
  }
  // Spójność SRS
  const srs = card.srs as any;
  if (srs) {
    if (new Date(srs.last_review_at) > new Date(srs.due_at)) {
      errors.push("srs.last_review_at must be <= srs.due_at.");
    }
  }
  // URL-e muszą być https w kontekście produkcyjnym
  for (const k of ["audio_url","image_url"] as const) {
    const url = card[k] as string | null;
    if (url && !url.startsWith("https://")) {
      errors.push(`${k} must use https://`);
    }
  }
  return { ok: errors.length === 0, errors };
}
