import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import products from '@/data/products'
import type { CatalogOverrides, ProductOverride } from '@/lib/catalog'

export const Route = createFileRoute('/admin')({ component: AdminPage })

function AdminPage() {
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [overrides, setOverrides] = useState<CatalogOverrides>({})
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<number | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const session = sessionStorage.getItem('trivelle-admin-auth')
    if (session === 'ok') setAuthorized(true)
    setChecking(false)
  }, [])

  useEffect(() => {
    if (!authorized) return
    fetch('/catalog-overrides.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => setOverrides(data))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [authorized])

  async function login() {
    setLoginError('')
    try {
      const response = await fetch('/.netlify/functions/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!response.ok) throw new Error()
      sessionStorage.setItem('trivelle-admin-auth', 'ok')
      setAuthorized(true)
      setPassword('')
    } catch {
      setLoginError('Senha incorreta. Tente novamente.')
    }
  }

  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => !q || p.name.toLowerCase().includes(q) || String(p.id).includes(q))
  }, [query])

  const current = selected == null ? null : products.find((p) => p.id === selected) ?? null
  const currentOverride = current ? (overrides[String(current.id)] ?? {}) : {}

  function update(id: number, patch: ProductOverride) {
    setOverrides((prev) => ({ ...prev, [String(id)]: { ...(prev[String(id)] ?? {}), ...patch } }))
  }

  function saveLocal() {
    localStorage.setItem('trivelle-catalog-overrides', JSON.stringify(overrides))
    alert('Alterações salvas neste dispositivo.')
  }

  function download() {
    const blob = new Blob([JSON.stringify(overrides, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'catalog-overrides.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (checking) return <div className="min-h-screen p-8">Verificando acesso…</div>

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#fffdfc] flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-white rounded-3xl border p-8 shadow-sm">
          <Link to="/" className="text-sm underline">← Voltar ao catálogo</Link>
          <h1 className="font-display text-3xl mt-8">Área administrativa</h1>
          <p className="text-sm opacity-70 mt-2 mb-6">Esta área é exclusiva da Trivelle.</p>
          <label className="block text-sm">
            Senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') login() }}
              className="mt-1 w-full rounded-xl border px-4 py-3"
              autoComplete="current-password"
            />
          </label>
          {loginError && <p className="text-sm text-red-600 mt-3">{loginError}</p>}
          <button onClick={login} className="w-full mt-5 rounded-full px-5 py-3 bg-[color:var(--color-brand-dark)] text-white">
            Entrar
          </button>
        </div>
      </div>
    )
  }

  if (!loaded) return <div className="min-h-screen p-8">Carregando editor…</div>

  return (
    <div className="min-h-screen bg-[#fffdfc] p-5 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <Link to="/" className="text-sm underline">← Voltar ao catálogo</Link>
            <h1 className="font-display text-3xl md:text-4xl mt-3">Editar catálogo</h1>
            <p className="text-sm opacity-70 mt-2">Edite títulos, descrições, preços, fotos ou oculte anúncios.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={saveLocal} className="rounded-full px-5 py-3 border border-[color:var(--color-brand-dark)] text-[color:var(--color-brand-dark)]">Salvar neste dispositivo</button>
            <button onClick={download} className="rounded-full px-5 py-3 bg-[color:var(--color-brand-dark)] text-white">Baixar alterações</button>
          </div>
        </div>
        <div className="grid md:grid-cols-[320px_1fr] gap-6">
          <aside className="bg-white rounded-2xl border p-4 h-fit">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome ou ID" className="w-full rounded-xl border px-4 py-3 mb-4" />
            <div className="max-h-[65vh] overflow-auto space-y-2">
              {visibleProducts.map((p) => {
                const o = overrides[String(p.id)] ?? {}
                return <button key={p.id} onClick={() => setSelected(p.id)} className={`w-full text-left rounded-xl p-3 border ${selected === p.id ? 'border-[color:var(--color-brand)] bg-[color:var(--color-brand-light)]' : 'border-gray-200'}`}>
                  <div className="text-sm font-medium line-clamp-2">{o.name ?? p.name}</div>
                  <div className="text-xs opacity-60 mt-1">{p.category} · estoque {p.stock} {o.hidden ? '· oculto' : ''}</div>
                </button>
              })}
            </div>
          </aside>
          <section className="bg-white rounded-2xl border p-5 md:p-7">
            {!current ? <p className="opacity-60">Selecione um produto para editar.</p> : <>
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="text-xs opacity-60">ID {current.id} · estoque {current.stock}</div>
                  <h2 className="font-display text-2xl mt-1">{current.name}</h2>
                </div>
                <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                  <input type="checkbox" checked={!!currentOverride.hidden} onChange={(e) => update(current.id, { hidden: e.target.checked })} />
                  Ocultar produto
                </label>
              </div>
              <div className="space-y-5">
                <label className="block text-sm">Título<input className="mt-1 w-full rounded-xl border px-4 py-3" value={currentOverride.name ?? current.name} onChange={(e) => update(current.id, { name: e.target.value })} /></label>
                <label className="block text-sm">Preço<input type="number" step="0.01" className="mt-1 w-full rounded-xl border px-4 py-3" value={currentOverride.price ?? current.price} onChange={(e) => update(current.id, { price: Number(e.target.value) })} /></label>
                <label className="block text-sm">Descrição<textarea rows={9} className="mt-1 w-full rounded-xl border px-4 py-3" value={currentOverride.description ?? current.description} onChange={(e) => update(current.id, { description: e.target.value })} /></label>
                <label className="block text-sm">Descrição curta<textarea rows={3} className="mt-1 w-full rounded-xl border px-4 py-3" value={currentOverride.shortDescription ?? current.shortDescription} onChange={(e) => update(current.id, { shortDescription: e.target.value })} /></label>
                <div>
                  <div className="text-sm mb-2">Fotos (URLs)</div>
                  <div className="space-y-2">
                    {(currentOverride.images ?? current.images).map((img, i) => <input key={i} className="w-full rounded-xl border px-4 py-3 text-sm" value={img} onChange={(e) => { const arr = [...(currentOverride.images ?? current.images)]; arr[i] = e.target.value; update(current.id, { images: arr, image: arr[0] }) }} />)}
                  </div>
                </div>
                <p className="text-xs opacity-60">Depois de editar, baixe o arquivo de alterações e substitua <b>public/catalog-overrides.json</b> no GitHub para publicar.</p>
              </div>
            </>}
          </section>
        </div>
      </div>
    </div>
  )
}
