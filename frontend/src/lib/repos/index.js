import { LocalAuthRepo } from './auth.local';
import { LocalWordsRepo } from './words.local';
import { SupabaseAuthRepo } from './auth.supabase'
import { SupabaseWordsRepo } from './words.supabase'


const MODE = (import.meta.env.VITE_DATA_MODE || 'local').toLowerCase()


export function createRepos(currentUserId) {
  const isSupabase = MODE === 'supabase'
  return {
    auth: isSupabase ? SupabaseAuthRepo : LocalAuthRepo,
    words: isSupabase
      ? (currentUserId ? SupabaseWordsRepo(currentUserId) : null)
      : (currentUserId ? LocalWordsRepo(currentUserId) : null),
  }
}