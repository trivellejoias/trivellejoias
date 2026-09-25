import { getStore } from '@netlify/blobs'

const STORE_NAME = 'trivelle-catalog'
const KEY = 'overrides'

function headers() {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  }
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: headers() })
}

export default async (request: Request) => {
  const store = getStore(STORE_NAME)

  if (request.method === 'GET') {
    const url = new URL(request.url)
    if (url.searchParams.get('type') === 'image') {
      const key = url.searchParams.get('key')
      if (!key || !key.startsWith('uploads/')) return new Response('Not found', { status: 404 })
      const result = await store.getWithMetadata(key, { type: 'arrayBuffer' })
      if (!result?.data) return new Response('Not found', { status: 404 })
      return new Response(result.data, { headers: { 'Content-Type': String(result.metadata?.contentType ?? 'image/jpeg'), 'Cache-Control': 'public, max-age=31536000, immutable' } })
    }
    if (url.searchParams.get('type') === 'settings') {
      const settings = await store.get('settings', { type: 'json' })
      return response(settings ?? {})
    }
    if (url.searchParams.get('type') === 'additions') {
      const additions = await store.get('additions', { type: 'json' })
      return response(additions ?? {})
    }
    const data = await store.get(KEY, { type: 'json' })
    return response(data ?? {})
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = await request.json()
    const password = body?.password
    const expected = process.env.ADMIN_PASSWORD

    if (!expected || typeof password !== 'string' || password !== expected) {
      return response({ ok: false, error: 'unauthorized' }, 401)
    }

    if (body?.action === 'uploadImage') {
      const dataUrl = typeof body?.dataUrl === 'string' ? body.dataUrl : ''
      if (!dataUrl.startsWith('data:image/')) return response({ ok: false, error: 'invalid_image' }, 400)
      const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
      if (!match) return response({ ok: false, error: 'invalid_image' }, 400)
      const mime = match[1]
      const base64 = match[2]
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
      if (bytes.byteLength > 8 * 1024 * 1024) return response({ ok: false, error: 'image_too_large' }, 413)
      const extension = mime.split('/')[1].replace('jpeg', 'jpg').replace(/[^a-z0-9]/gi, '') || 'jpg'
      const key = `uploads/${crypto.randomUUID()}.${extension}`
      await store.set(key, bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), { metadata: { contentType: mime } })
      const url = `/.netlify/functions/catalog-data?type=image&key=${encodeURIComponent(key)}`
      return response({ ok: true, url })
    }

    const overrides = body?.overrides
    if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
      return response({ ok: false, error: 'invalid_overrides' }, 400)
    }

    await store.setJSON(KEY, overrides, {
      metadata: { updatedAt: new Date().toISOString() },
    })

    const additions = body?.additions
    if (additions && typeof additions === 'object' && !Array.isArray(additions)) {
      await store.setJSON('additions', additions, {
        metadata: { updatedAt: new Date().toISOString() },
      })
    }

    if (body?.settings && typeof body.settings === 'object' && !Array.isArray(body.settings)) {
      await store.setJSON('settings', body.settings, {
        metadata: { updatedAt: new Date().toISOString() },
      })
    }

    return response({ ok: true, savedAt: new Date().toISOString() })
  } catch (error) {
    console.error('catalog-data error', error)
    return response({ ok: false, error: 'server_error' }, 500)
  }
}

export const config = {
  path: '/.netlify/functions/catalog-data',
}
