export const dynamic = 'force-static';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey || apiKey.includes('your_google_ai')) {
      return NextResponse.json({ 
        summary: "This is a mock AI-generated summary because the Google AI API key is not yet configured. Once you add your key, real summaries will appear here!" 
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Summarize the following blog post in approximately 200 words. Write a concise, engaging summary that captures the key points and main ideas. Do not include any prefixes like "Summary:" — just provide the summary text directly.\n\n${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    return NextResponse.json({ summary });
  } catch (error: unknown) {
    console.error('AI Summary generation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate summary';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
