import { validateCard } from "@/lib/validation/flashcards";
// ...
const { ok, errors } = validateCard(await req.json());
if (!ok) return new Response(JSON.stringify({ errors }), { status: 400 });
