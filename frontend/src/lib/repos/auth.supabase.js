import { supabase } from '@/lib/supabase'

export const SupabaseAuthRepo = {
  async signUp(email, password){ return (await supabase.auth.signUp({ email, password })).data?.user ?? null },
  async signIn(email, password){
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data.user
  },
  async signOut(){ await supabase.auth.signOut() },
  getCurrentUser(){ return supabase.auth.getSession().then(({data}) => data.session?.user ?? null) },
  onAuthStateChanged(cb){ const { data } = supabase.auth.onAuthStateChange((_e, s)=>cb(s?.user ?? null)); return () => data.subscription.unsubscribe() }
}
