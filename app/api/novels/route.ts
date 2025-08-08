import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check if we have Blob storage configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.log('Blob storage not configured, returning empty novels list')
      return NextResponse.json({ novels: [] })
    }

    // Import Vercel Blob functions only if token is available
    const { list } = await import('@vercel/blob')

    // Try to get novels index from Blob storage
    try {
      const { blobs } = await list({
        prefix: 'novels/index.json',
        limit: 1
      })
      
      if (blobs.length > 0) {
        const indexResponse = await fetch(blobs[0].url)
        if (indexResponse.ok) {
          const novels = await indexResponse.json()
          return NextResponse.json({ novels })
        }
      }
    } catch (error) {
      console.log('No index found in blob storage')
    }

    // If no index file, try to list all novel files
    try {
      const { blobs } = await list({
        prefix: 'novels/',
        limit: 100
      })
      
      const novelBlobs = blobs.filter(blob => 
        blob.pathname.startsWith('novels/') && 
        blob.pathname.endsWith('.json') && 
        !blob.pathname.includes('index.json')
      )
      
      const novels = []
      for (const blob of novelBlobs) {
        try {
          const response = await fetch(blob.url)
          if (response.ok) {
            const novel = await response.json()
            novels.push({
              id: novel.id,
              title: novel.title,
              author: novel.author,
              category: novel.category,
              status: novel.status,
              chapters: novel.chapters?.length || 0,
              lastUpdate: novel.lastUpdate,
              createdAt: novel.createdAt,
              cover: novel.cover
            })
          }
        } catch (error) {
          console.error('Error loading novel:', error)
        }
      }
      
      return NextResponse.json({ novels })
    } catch (error) {
      console.error('Error listing novels from blob:', error)
      return NextResponse.json({ novels: [] })
    }
  } catch (error) {
    console.error('Get novels error:', error)
    return NextResponse.json({ novels: [] })
  }
}
