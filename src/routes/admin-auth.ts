import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'

export const Route = createFileRoute('/admin-auth')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { password } = await request.json()

          if (
            typeof password !== 'string' ||
            !env.ADMIN_PASSWORD ||
            password !== env.ADMIN_PASSWORD
          ) {
            return Response.json({ ok: false }, { status: 401 })
          }

          return Response.json({ ok: true })
        } catch {
          return Response.json({ ok: false }, { status: 400 })
        }
      },
    },
  },
})
