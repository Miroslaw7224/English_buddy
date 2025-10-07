import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { session_id, final_cefr, confidence, scores } = await request.json();

    if (!session_id || !final_cefr) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update user_profil
    const { error } = await supabase
      .from('user_profil')
      .update({
        cefr_level: final_cefr,
        placement_score: Math.round((confidence || 0.8) * 100),
        placement_mode: 'agent',
        placement_source: 'ai',
        placement_taken_at: new Date().toISOString(),
        answers: JSON.stringify({ session_id, scores })
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating user_profil:', error);
      return NextResponse.json(
        { error: 'Failed to save results' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cefr_level: final_cefr
    });
  } catch (error) {
    console.error('Error finalizing placement test:', error);
    return NextResponse.json(
      { error: 'Failed to finalize test' },
      { status: 500 }
    );
  }
}

