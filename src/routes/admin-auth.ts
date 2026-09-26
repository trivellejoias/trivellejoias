export default async (request: Request, context: any) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { password } = await request.json()

    const expected = context.env.ADMIN_PASSWORD

    if (
      !expected ||
      typeof password !== 'string' ||
      password !== expected
    ) {
      return Response.json({ ok: false }, { status: 401 })
    }

    return Response.json({ ok: true })
  } catch {
    return Response.json({ ok: false }, { status: 400 })
  }
}
