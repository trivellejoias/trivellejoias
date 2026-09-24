import { getStore } from '@netlify/blobs'

const STORE_NAME = 'trivelle-analytics'
const SUMMARY_KEY = 'summary'

type Summary = {
  visits: number
  productViews: number
  whatsappClicks: number
  instagramClicks: number
  products: Record<string, { name: string; views: number; whatsappClicks: number }>
  days: Record<string, { visits: number; productViews: number; whatsappClicks: number; instagramClicks: number }>
}

const emptySummary = (): Summary => ({ visits: 0, productViews: 0, whatsappClicks: 0, instagramClicks: 0, products: {}, days: {} })

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
}

export default async (request: Request) => {
  const store = getStore(STORE_NAME)

  try {
    const body = await request.json()

    // Admin statistics request. Password is sent in the POST body, not the URL.
    if (body?.action === 'stats') {
      if (!process.env.ADMIN_PASSWORD || body.password !== process.env.ADMIN_PASSWORD) return json({ error: 'unauthorized' }, 401)
      const summary = (await store.get(SUMMARY_KEY, { type: 'json' })) as Summary | null
      return json(summary ?? emptySummary())
    }

    const allowed = new Set(['visit', 'product_view', 'whatsapp_click', 'instagram_click'])
    if (!allowed.has(body?.type)) return json({ error: 'invalid_event' }, 400)

    const day = new Date().toISOString().slice(0, 10)
    const current = ((await store.get(SUMMARY_KEY, { type: 'json' })) as Summary | null) ?? emptySummary()
    const daily = current.days[day] ?? { visits: 0, productViews: 0, whatsappClicks: 0, instagramClicks: 0 }

    if (body.type === 'visit') { current.visits++; daily.visits++ }
    if (body.type === 'product_view') {
      current.productViews++; daily.productViews++
      const id = String(body.productId ?? '')
      if (id) {
        const item = current.products[id] ?? { name: String(body.productName ?? 'Produto'), views: 0, whatsappClicks: 0 }
        item.views++
        if (body.productName) item.name = String(body.productName)
        current.products[id] = item
      }
    }
    if (body.type === 'whatsapp_click') {
      current.whatsappClicks++; daily.whatsappClicks++
      const id = String(body.productId ?? '')
      if (id) {
        const item = current.products[id] ?? { name: String(body.productName ?? 'Produto'), views: 0, whatsappClicks: 0 }
        item.whatsappClicks++
        if (body.productName) item.name = String(body.productName)
        current.products[id] = item
      }
    }
    if (body.type === 'instagram_click') { current.instagramClicks++; daily.instagramClicks++ }
    current.days[day] = daily

    await store.setJSON(SUMMARY_KEY, current, { metadata: { updatedAt: new Date().toISOString() } })
    return json({ ok: true })
  } catch (error) {
    console.error('analytics error', error)
    return json({ error: 'server_error' }, 500)
  }
}

export const config = { path: '/.netlify/functions/analytics' }
