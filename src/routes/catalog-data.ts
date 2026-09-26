import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers })
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

async function getCatalog(key: string) {
  const result = await env.DB
    .prepare('SELECT data FROM catalog WHERE id = ?')
    .bind(key)
    .first<{ data: string }>()

  if (!result?.data) return {}
  return JSON.parse(result.data)
}

export const Route = createFileRoute('/catalog-data')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await ensureSchema()
          const type = new URL(request.url).searchParams.get('type')
          const key =
            type === 'settings'
              ? 'settings'
              : type === 'additions'
                ? 'additions'
                : 'overrides'

          return json(await getCatalog(key))
        } catch (error) {
          console.error('catalog-data GET error', error)
          return json({})
        }
      },

      POST: async ({ request }) => {
        try {
          await ensureSchema()
          const body = await request.json()
          const password = body?.password

          if (
            typeof password !== 'string' ||
            !env.ADMIN_PASSWORD ||
            password !== env.ADMIN_PASSWORD
          ) {
            return json({ ok: false, error: 'unauthorized' }, 401)
          }

          const values: Array<[string, unknown]> = [
            ['overrides', body?.overrides],
            ['additions', body?.additions],
            ['settings', body?.settings],
          ]

          for (const [id, data] of values) {
            if (
              data === undefined ||
              data === null ||
              typeof data !== 'object' ||
              Array.isArray(data)
            ) {
              continue
            }

            await env.DB
              .prepare(
                `INSERT INTO catalog (id, data)
                 VALUES (?, ?)
                 ON CONFLICT(id) DO UPDATE SET data = excluded.data`,
              )
              .bind(id, JSON.stringify(data))
              .run()
          }

          return json({ ok: true, savedAt: new Date().toISOString() })
        } catch (error) {
          console.error('catalog-data POST error', error)
          return json({ ok: false, error: 'server_error' }, 500)
        }
      },
    },
  },
})
