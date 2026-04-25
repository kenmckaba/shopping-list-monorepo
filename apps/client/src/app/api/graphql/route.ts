import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log(
      'Making request to Hasura:',
      process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL
    )
    console.log(
      'Admin secret (first 10 chars):',
      `${process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET?.slice(0, 10)}...`
    )
    console.log('Request body:', JSON.stringify(body, null, 2))

    // Add timeout for the request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const hasuraResponse = await fetch(
      process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'x-hasura-admin-secret': process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET!,
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    console.log('Hasura response status:', hasuraResponse.status)

    // Check if response is actually JSON
    const contentType = hasuraResponse.headers.get('content-type')
    console.log('Content-Type:', contentType)

    if (!contentType?.includes('application/json')) {
      const text = await hasuraResponse.text()
      console.error('Non-JSON response from Hasura:', text.slice(0, 500))
      return NextResponse.json(
        {
          error: 'Hasura returned non-JSON response',
          details: text.slice(0, 500),
        },
        { status: 500 }
      )
    }

    const data = await hasuraResponse.json()

    return NextResponse.json(data, {
      status: hasuraResponse.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('GraphQL proxy error:', error)

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - Hasura took too long to respond' },
        { status: 504 }
      )
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  )
}
