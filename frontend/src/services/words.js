import { supabase } from "../lib/supabase";

// LIST
export async function listWords() {
  const { data, error } = await supabase
    .from("words")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// CREATE
export async function addWord({ term, translation = null, example = null }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak zalogowanego użytkownika");

  const { data, error } = await supabase
    .from("words")
    .insert([{ user_id: user.id, term, translation, example }])
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

// UPDATE
export async function updateWord(id, patch) {
  const { data, error } = await supabase
    .from("words")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

// DELETE
export async function deleteWord(id) {
  const { error } = await supabase.from("words").delete().eq("id", id);
  if (error) throw error;
  return true;
}
