import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface QuizTask {
  type: 'multiple_choice';
  prompt: string;
  options: string[];
  answer_index: number;
  feedback_correct: string;
  feedback_incorrect: string;
}

export interface Quiz {
  tasks: QuizTask[];
}

export interface Flashcard {
  word_id: string;
  user_id: string;
  term: string;
  term_lang: string;
  translation: string;
  translation_lang: string;
  definition: string;
  part_of_speech: string;
  ipa: string | null;
  lemma: string | null;
  inflections: string[];
  examples: Array<{
    text: string;
    translation: string | null;
  }>;
  difficulty: string;
  cefr: string;
  category: string | null;
  deck_id: string | null;
  tags: string[];
  audio_url: string | null;
  image_url: string | null;
  license: string | null;
  media_attribution: string | null;
  srs: {
    interval: number;
    ease: number;
    due_at: string;
    last_review_at: string;
    streak: number;
    lapses: number;
  };
  visibility: string;
  status: string;
  source: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  quiz?: Quiz;
}

// Helper function to generate quiz for cards without one
function generateQuiz(term: string, translation: string, allCards: any[]): Quiz {
  // Get 3 random wrong answers from other cards
  const wrongAnswers = allCards
    .filter(c => c.translation !== translation && c.translation)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(c => c.translation);
  
  // Combine correct answer with wrong ones and shuffle
  const options = [translation, ...wrongAnswers].sort(() => Math.random() - 0.5);
  const answerIndex = options.indexOf(translation);

  return {
    tasks: [
      {
        type: 'multiple_choice',
        prompt: `What is the Polish meaning of '${term}'?`,
        options,
        answer_index: answerIndex,
        feedback_correct: 'Correct!',
        feedback_incorrect: `Not quite. The correct answer is '${translation}'.`
      }
    ]
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');

    if (!level) {
      return NextResponse.json({ error: 'Level parameter is required' }, { status: 400 });
    }

    const levelPath = path.join(process.cwd(), 'data', 'flashcards', level);
    
    if (!fs.existsSync(levelPath)) {
      return NextResponse.json({ flashcards: [] });
    }

    const allFlashcards: Flashcard[] = [];
    const tempCards: any[] = []; // For quiz generation

    // Read all topic folders in the level directory
    const entries = fs.readdirSync(levelPath, { withFileTypes: true });
    const topicFolders = entries.filter(entry => entry.isDirectory());

    for (const folder of topicFolders) {
      const topicPath = path.join(levelPath, folder.name);
      const jsonFiles = fs.readdirSync(topicPath).filter(file => file.endsWith('.json'));

      for (const file of jsonFiles) {
        const filePath = path.join(topicPath, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        
        // Handle different file formats
        let cards = [];
        if (Array.isArray(data)) {
          // Array of word_id objects (basic files)
          cards = data.map((card: any) => ({
            ...card,
            category: card.category || folder.name,
            source: `${folder.name}/${file}`,
          }));
          tempCards.push(...data);
        } else if (data.cards && Array.isArray(data.cards)) {
          // Transform pack format to expected format (extra files)
          cards = data.cards.map((card: any) => ({
            word_id: card.id || `generated_${Date.now()}_${Math.random()}`,
            user_id: 'system',
            term: card.front || card.term || '',
            term_lang: 'en',
            translation: card.back || card.translation || '',
            translation_lang: 'pl',
            definition: card.hint || card.definition || '',
            part_of_speech: card.pos || card.part_of_speech || 'unknown',
            ipa: card.ipa || null,
            lemma: card.lemma || null,
            inflections: card.inflections || [],
            examples: Array.isArray(card.examples) ? card.examples.map((ex: any) => ({
              text: Array.isArray(ex) ? ex[0] : ex.text || ex,
              translation: Array.isArray(ex) ? ex[1] : ex.translation || null
            })) : [],
            difficulty: card.difficulty || 'beginner',
            cefr: card.level || level,
            category: card.topic || card.category || folder.name,
            deck_id: data.pack_id || null,
            tags: card.tags || [],
            audio_url: card.audio_url || null,
            image_url: card.image_url || null,
            license: card.license || null,
            media_attribution: card.media_attribution || null,
            srs: {
              interval: 1,
              ease: 2.5,
              due_at: new Date().toISOString(),
              last_review_at: new Date().toISOString(),
              streak: 0,
              lapses: 0
            },
            visibility: 'public',
            status: 'active',
            source: `${folder.name}/${file}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            deleted_at: null,
            quiz: card.quiz || undefined
          }));
          tempCards.push(...data.cards.map((c: any) => ({ term: c.front, translation: c.back })));
        } else {
          // Single flashcard object
          cards = [data];
        }
        
        allFlashcards.push(...cards);
      }
    }

    // Generate quiz for cards that don't have one
    for (const card of allFlashcards) {
      if (!card.quiz && card.term && card.translation) {
        card.quiz = generateQuiz(card.term, card.translation, tempCards);
      }
    }

    return NextResponse.json({ flashcards: allFlashcards });
  } catch (error) {
    console.error('Error loading flashcards:', error);
    return NextResponse.json({ error: 'Failed to load flashcards' }, { status: 500 });
  }
}
