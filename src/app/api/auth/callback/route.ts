import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // { event, session }
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              console.error('Error setting cookies:', error);
            }
          },
        },
      }
    );

    console.log('Auth callback - Event:', body.event, 'Session:', body.session?.user?.id || 'null');

    // Synchronizuj sesję z server-side cookies
    if (body.session) {
      await supabase.auth.setSession(body.session);
      console.log('Session synchronized to server cookies');
    } else {
      // Wylogowanie - wyczyść sesję
      await supabase.auth.signOut();
      console.log('Session cleared from server cookies');
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to sync session' }, { status: 500 });
  }
}

