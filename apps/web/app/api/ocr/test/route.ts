import { NextRequest, NextResponse } from 'next/server';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

export async function GET(request: NextRequest) {
  if (!MISTRAL_API_KEY) {
    return NextResponse.json(
      { error: 'Mistral API key not configured' },
      { status: 500 }
    );
  }

  try {
    // Test the Mistral API with a simple request
    const response = await fetch('https://api.mistral.ai/v1/models', {
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: 'Mistral API error', details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Filter for vision-capable models
    const visionModels = data.data?.filter((model: any) => 
      model.id.includes('pixtral') || 
      model.capabilities?.vision === true
    ) || [];

    return NextResponse.json({
      success: true,
      availableModels: data.data?.map((m: any) => m.id) || [],
      visionModels: visionModels.map((m: any) => m.id),
      recommendedModel: 'pixtral-large-latest'
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { error: 'Failed to test Mistral API' },
      { status: 500 }
    );
  }
}