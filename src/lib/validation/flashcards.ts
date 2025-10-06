import Ajv from "ajv";
import addFormats from "ajv-formats";
import schema from "../../../quality/schemas/flashcard.schema.json" assert { type: "json" };

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

export function validateCard(card: unknown) {
  const ok = validate(card);
  const errors = !ok && validate.errors ? validate.errors.map(e => `${e.instancePath} ${e.message}`) : [];
  
  // Dodatkowe reguły biznesowe
  const cardObj = card as Record<string, unknown>;
  const term = (cardObj.term as string)?.trim();
  const translation = (cardObj.translation as string)?.trim();
  
  if (term && translation && term.toLowerCase() === translation.toLowerCase()) {
    errors.push("term and translation must differ");
  }
  
  // HTTPS-only dla URL-i
  for (const key of ["audio_url", "image_url"] as const) {
    const url = cardObj[key] as string | null;
    if (url && !url.startsWith("https://")) {
      errors.push(`${key} must use https://`);
    }
  }
  
  // Spójność SRS
  const srs = cardObj.srs as any;
  if (srs && srs.last_review_at && srs.due_at) {
    if (new Date(srs.last_review_at) > new Date(srs.due_at)) {
      errors.push("srs.last_review_at must be <= srs.due_at");
    }
  }
  
  return { ok: errors.length === 0, errors };
}
