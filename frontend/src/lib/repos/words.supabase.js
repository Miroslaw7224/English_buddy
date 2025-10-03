import { supabase } from '@/lib/supabase'

export const SupabaseWordsRepo = (userId) => ({
  async list(limit=100){
    const { data, error } = await supabase.from('words')
      .select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit)
    if (error) throw error; return data ?? []
  },
  async add({ term, translation, example }){
    const { data, error } = await supabase.from('words')
      .insert([{ user_id: userId, term, translation, example }]).select().single()
    if (error) throw error; return data
  },
  async update(id, patch){
    const { data, error } = await supabase.from('words')
      .update(patch).eq('id', id).eq('user_id', userId).select().single()
    if (error) throw error; return data
  },
  async remove(id){
    const { error } = await supabase.from('words').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
  }
})
