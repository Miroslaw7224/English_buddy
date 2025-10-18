import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ProgressUpdate {
  word_id: string;
  level: string;
  category?: string;
  quality: number; // 0-5 (0 = complete blackout, 5 = perfect response)
}

async function supabaseServer() {
  const jar = await cookies();
  return createServerClient(
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
}

// SM-2 algorithm for SRS
function calculateSRS(oldInterval: number, oldEase: number, quality: number) {
  let interval = oldInterval;
  let ease = oldEase;
  
  // Update ease factor
  ease = Math.max(130, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)) * 100);
  
  // Calculate new interval
  if (quality < 3) {
    // Failed - restart
    interval = 0;
  } else {
    if (interval === 0) {
      interval = 1;
    } else if (interval === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * (ease / 100));
    }
  }
  
  return { interval, ease };
}

// GET - Fetch user progress for flashcards (only by level, no word_ids to avoid 431 error)
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // Check authentication - if not authenticated, return empty progress
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ progress: {} });
    }

    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');

    let query = supabase
      .from('user_flashcard_progress')
      .select('*')
      .eq('user_id', user.id);

    if (level) {
      query = query.eq('level', level);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching progress:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Convert to map for easy lookup
    const progressMap = (data || []).reduce((acc, item) => {
      acc[item.word_id] = item;
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({ progress: progressMap });
  } catch (error) {
    console.error('Error in GET /api/flashcard-progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Update progress after answering a flashcard
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // Check authentication - if not authenticated, silently ignore
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Not authenticated' });
    }

    const body: ProgressUpdate = await request.json();
    const { word_id, level, category, quality } = body;

    if (!word_id || !level || quality === undefined) {
      return NextResponse.json(
        { error: 'word_id, level, and quality are required' },
        { status: 400 }
      );
    }

    // Fetch existing progress
    const { data: existing, error: fetchError } = await supabase
      .from('user_flashcard_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('word_id', word_id)
      .eq('level', level)
      .single();

    const now = new Date().toISOString();
    let progressData;

    if (existing) {
      // Update existing progress
      const { interval, ease } = calculateSRS(
        existing.interval || 0,
        existing.ease || 250,
        quality
      );

      const dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + interval);

      progressData = {
        interval,
        ease,
        due_at: dueAt.toISOString(),
        last_review_at: now,
        streak: quality >= 3 ? (existing.streak || 0) + 1 : 0,
        lapses: quality < 3 ? (existing.lapses || 0) + 1 : existing.lapses,
        total_reviews: (existing.total_reviews || 0) + 1,
        correct_reviews: quality >= 3 ? (existing.correct_reviews || 0) + 1 : existing.correct_reviews,
      };

      const { error: updateError } = await supabase
        .from('user_flashcard_progress')
        .update(progressData)
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error updating progress:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    } else {
      // Create new progress
      const { interval, ease } = calculateSRS(0, 250, quality);
      
      const dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + interval);

      progressData = {
        user_id: user.id,
        word_id,
        level,
        category,
        interval,
        ease,
        due_at: dueAt.toISOString(),
        last_review_at: now,
        streak: quality >= 3 ? 1 : 0,
        lapses: quality < 3 ? 1 : 0,
        total_reviews: 1,
        correct_reviews: quality >= 3 ? 1 : 0,
      };

      const { error: insertError } = await supabase
        .from('user_flashcard_progress')
        .insert([progressData]);

      if (insertError) {
        console.error('Error creating progress:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, progress: progressData });
  } catch (error) {
    console.error('Error in POST /api/flashcard-progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

