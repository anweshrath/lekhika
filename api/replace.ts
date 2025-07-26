import { NextRequest, NextResponse } from 'next/server';
import { replaceWordsInText, generateWordSuggestions } from '../lib/textAnalyzer';

interface WordReplacementRequest {
  copyText: string;
  replacements: { original: string; replacement: string }[];
}

export async function POST(request: NextRequest) {
  try {
    const { copyText, replacements }: WordReplacementRequest = await request.json();
    
    if (!copyText) {
      return NextResponse.json(
        { error: 'Copy text is required' },
        { status: 400 }
      );
    }

    const updatedText = replaceWordsInText(copyText, replacements);
    
    return NextResponse.json({ 
      success: true, 
      originalText: copyText, 
      updatedText, 
      replacements, 
      replacementsCount: replacements.length 
    });
  } catch (error) {
    console.error('Word replacement error:', error);
    return NextResponse.json(
      { error: 'Word replacement failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const copyText = searchParams.get('text');
    const copyType = searchParams.get('type') || 'general';
    
    if (!copyText) {
      return NextResponse.json(
        { error: 'Text parameter is required' },
        { status: 400 }
      );
    }

    const wordSuggestions = generateWordSuggestions(copyText, copyType);
    
    return NextResponse.json({ 
      success: true, 
      wordSuggestions, 
      suggestionsCount: wordSuggestions.length 
    });
  } catch (error) {
    console.error('Word suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to generate word suggestions' },
      { status: 500 }
    );
  }
} 