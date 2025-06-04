import { NextRequest, NextResponse } from 'next/server'
import { analyzeNote } from '@/lib/ai/openai'
import { enhancedAnalysis } from '@/lib/ai/claude'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, mode = 'quick', provider = 'openai' } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    let result
    
    if (provider === 'claude') {
      result = await enhancedAnalysis(content)
    } else {
      result = await analyzeNote(content, mode)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('AI analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze content' },
      { status: 500 }
    )
  }
}