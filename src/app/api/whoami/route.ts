import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const jar = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return jar.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                jar.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    
    console.log('Whoami - User:', user?.id || 'not authenticated');
    console.log('Cookies:', jar.getAll().map(c => c.name).join(', '));
    
    return NextResponse.json({ 
      user: user ? { id: user.id, email: user.email } : null,
      cookies: jar.getAll().map(c => c.name)
    });
  } catch (error) {
    console.error('Whoami error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

