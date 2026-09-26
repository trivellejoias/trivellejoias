import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'

type Summary = {
  visits: number
  productViews: number
  whatsappClicks: number
  instagramClicks: number
  products: Record<string, { name: string; views: number; whatsappClicks: number }>
  days: Record<string, { visits: number; productViews: number; whatsappClicks: number; instagramClicks: number }>
}

const emptySummary = (): Summary => ({
  visits: 0,
  productViews: 0,
  whatsappClicks: 0,
  instagramClicks: 0,
  products: {},
  days: {},
})

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

async function ensureSchema() {
  await env.DB
    .prepare(
      `CREATE TABLE IF NOT EXISTS catalog (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL
      )`,
    )
    .run()
}

async function readSummary(): Promise<Summary> {
  const row = await env.DB
    .prepare('SELECT data FROM catalog WHERE id = ?')
    .bind('summary')
    .first<{ data: string }>()

  if (!row?.data) return emptySummary()
  return JSON.parse(row.data) as Summary
}

async function writeSummary(summary: Summary) {
  await env.DB
    .prepare(
      `INSERT INTO catalog (id, data)
       VALUES (?, ?)
       ON CONFLICT(id) DO UPDATE SET data = excluded.data`,
    )
    .bind('summary', JSON.stringify(summary))
    .run()
}

export const Route = createFileRoute('/analytics')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json()

          await ensureSchema()

          if (body?.action === 'stats') {
            if (
              typeof body.password !== 'string' ||
              !env.ADMIN_PASSWORD ||
              body.password !== env.ADMIN_PASSWORD
            ) {
              return json({ error: 'unauthorized' }, 401)
            }

            return json(await readSummary())
          }

          const allowed = new Set([
            'visit',
            'product_view',
            'whatsapp_click',
            'instagram_click',
          ])

          if (!allowed.has(body?.type)) {
            return json({ error: 'invalid_event' }, 400)
          }

          const current = await readSummary()
          const day = new Date().toISOString().slice(0, 10)
          const daily = current.days[day] ?? {
            visits: 0,
            productViews: 0,
            whatsappClicks: 0,
            instagramClicks: 0,
          }

          if (body.type === 'visit') {
            current.visits++
            daily.visits++
          }

          if (body.type === 'product_view') {
            current.productViews++
            daily.productViews++
            const id = String(body.productId ?? '')
            if (id) {
              const item = current.products[id] ?? {
                name: String(body.productName ?? 'Produto'),
                views: 0,
                whatsappClicks: 0,
              }
              item.views++
              if (body.productName) item.name = String(body.productName)
              current.products[id] = item
            }
          }

          if (body.type === 'whatsapp_click') {
            current.whatsappClicks++
            daily.whatsappClicks++
            const id = String(body.productId ?? '')
            if (id) {
              const item = current.products[id] ?? {
                name: String(body.productName ?? 'Produto'),
                views: 0,
                whatsappClicks: 0,
              }
              item.whatsappClicks++
              if (body.productName) item.name = String(body.productName)
              current.products[id] = item
            }
          }

          if (body.type === 'instagram_click') {
            current.instagramClicks++
            daily.instagramClicks++
          }

          current.days[day] = daily
          await writeSummary(current)

          return json({ ok: true })
        } catch (error) {
          console.error('analytics error', error)
          return json({ error: 'server_error' }, 500)
        }
      },
    },
  },
})
