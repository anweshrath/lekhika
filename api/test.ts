import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey } = await request.json();

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Provider and API key are required' },
        { status: 400 }
      );
    }

    let testResult = { success: false, message: '' };

    try {
      if (provider === 'openai') {
        const openai = new OpenAI({ apiKey });
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hello! This is a test message.' }],
          max_tokens: 10
        });
        testResult = {
          success: true,
          message: 'OpenAI API connection successful'
        };
      } else if (provider === 'anthropic') {
        const anthropic = new Anthropic({ apiKey });
        const message = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello! This is a test message.' }]
        });
        testResult = {
          success: true,
          message: 'Anthropic API connection successful'
        };
      } else if (provider === 'gemini') {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent('Hello! This is a test message.');
        testResult = {
          success: true,
          message: 'Gemini API connection successful'
        };
      } else {
        testResult = {
          success: false,
          message: 'Unsupported provider'
        };
      }
    } catch (error: any) {
      testResult = {
        success: false,
        message: `API test failed: ${error.message || 'Unknown error'}`
      };
    }

    return NextResponse.json(testResult);

  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { error: 'Failed to test API connection' },
      { status: 500 }
    );
  }
} 