import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers,
  })
}

export const Route = createFileRoute('/catalog-data')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const type = url.searchParams.get('type')
          const key = type === 'settings' ? 'settings' : 'overrides'

          const result = await env.DB
            .prepare('SELECT data FROM catalog WHERE id = ?')
            .bind(key)
            .first<{ data: string }>()

          if (!result?.data) {
            return json({})
          }

          return json(JSON.parse(result.data))
        } catch (error) {
          console.error('catalog-data GET error', error)
          return json({})
        }
      },

      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const password = body?.password

          if (
            typeof password !== 'string' ||
            !env.ADMIN_PASSWORD ||
            password !== env.ADMIN_PASSWORD
          ) {
            return json({ ok: false, error: 'unauthorized' }, 401)
          }

          const overrides = body?.overrides
          const settings = body?.settings

          if (
            !overrides ||
            typeof overrides !== 'object' ||
            Array.isArray(overrides)
          ) {
            return json({ ok: false, error: 'invalid_overrides' }, 400)
          }

          await env.DB
            .prepare(
              `INSERT INTO catalog (id, data)
               VALUES (?, ?)
               ON CONFLICT(id) DO UPDATE SET data = excluded.data`,
            )
            .bind('overrides', JSON.stringify(overrides))
            .run()

          if (
            settings &&
            typeof settings === 'object' &&
            !Array.isArray(settings)
          ) {
            await env.DB
              .prepare(
                `INSERT INTO catalog (id, data)
                 VALUES (?, ?)
                 ON CONFLICT(id) DO UPDATE SET data = excluded.data`,
              )
              .bind('settings', JSON.stringify(settings))
              .run()
          }

          return json({
            ok: true,
            savedAt: new Date().toISOString(),
          })
        } catch (error) {
          console.error('catalog-data POST error', error)
          return json({ ok: false, error: 'server_error' }, 500)
        }
      },
    },
  },
})
