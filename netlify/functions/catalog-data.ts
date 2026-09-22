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

    const overrides = body?.overrides
    if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
      return response({ ok: false, error: 'invalid_overrides' }, 400)
    }

    await store.setJSON(KEY, overrides, {
      metadata: { updatedAt: new Date().toISOString() },
    })

    return response({ ok: true, savedAt: new Date().toISOString() })
  } catch (error) {
    console.error('catalog-data error', error)
    return response({ ok: false, error: 'server_error' }, 500)
  }
}

export const config = {
  path: '/.netlify/functions/catalog-data',
}
