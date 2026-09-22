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
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    const session = sessionStorage.getItem('trivelle-admin-auth')
    if (session === 'ok') setAuthorized(true)
    setChecking(false)
  }, [])

  useEffect(() => {
    if (!authorized) return
    fetch('/catalog-overrides.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        let next = data as CatalogOverrides
        try {
          const local = localStorage.getItem('trivelle-catalog-overrides')
          if (local) {
            const localData: CatalogOverrides = JSON.parse(local)
            next = { ...next }
            for (const [id, override] of Object.entries(localData)) {
              next[id] = { ...(next[id] ?? {}), ...override }
            }
          }
        } catch {}
        setOverrides(next)
      })
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
      sessionStorage.setItem('trivelle-admin-password', password)
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
  const currentImages = currentOverride.images ?? current?.images ?? []

  function update(id: number, patch: ProductOverride) {
    setOverrides((prev) => ({ ...prev, [String(id)]: { ...(prev[String(id)] ?? {}), ...patch } }))
    setSavedMessage('Alteração pendente — clique em “Salvar alterações”.')
  }

  function saveChanges() {
    localStorage.setItem('trivelle-catalog-overrides', JSON.stringify(overrides))
    setSavedMessage('✓ Alterações salvas neste dispositivo.')
    window.setTimeout(() => setSavedMessage(''), 4000)
  }

  function downloadForPublish() {
    saveChanges()
    const blob = new Blob([JSON.stringify(overrides, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'catalog-overrides.json'
    a.click()
    URL.revokeObjectURL(url)
    setSavedMessage('✓ Salvo e arquivo baixado. Para publicar para todas as clientes, substitua catalog-overrides.json no GitHub.')
  }

  function restorePublished() {
    localStorage.removeItem('trivelle-catalog-overrides')
    window.location.reload()
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
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') login() }} className="mt-1 w-full rounded-xl border px-4 py-3" autoComplete="current-password" />
          </label>
          {loginError && <p className="text-sm text-red-600 mt-3">{loginError}</p>}
          <button onClick={login} className="w-full mt-5 rounded-full px-5 py-3 bg-[color:var(--color-brand-dark)] text-white">Entrar</button>
        </div>
      </div>
    )
  }

  if (!loaded) return <div className="min-h-screen p-8">Carregando editor…</div>

  return (
    <div className="min-h-screen bg-[#fffdfc] p-5 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="sticky top-0 z-20 bg-[#fffdfc]/95 backdrop-blur py-3 mb-5 border-b">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link to="/" className="text-sm underline">← Voltar ao catálogo</Link>
              <h1 className="font-display text-3xl md:text-4xl mt-2">Editar catálogo</h1>
              <p className="text-sm opacity-70 mt-1">Edite produto por produto e salve quando terminar.</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {savedMessage && <span className="text-xs max-w-xs text-right text-[color:var(--color-brand-dark)]">{savedMessage}</span>}
              <button onClick={restorePublished} className="rounded-full px-4 py-2 border text-sm">Desfazer alterações locais</button>
              <button onClick={downloadForPublish} className="rounded-full px-4 py-2 border text-sm">Baixar para publicar</button>
              <button onClick={saveChanges} className="rounded-full px-5 py-2 bg-[color:var(--color-brand-dark)] text-white font-medium">Salvar alterações</button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[330px_1fr] gap-6">
          <aside className="bg-white rounded-2xl border p-4 h-fit md:sticky md:top-28">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome ou ID" className="w-full rounded-xl border px-4 py-3 mb-4" />
            <div className="max-h-[70vh] overflow-auto space-y-2">
              {visibleProducts.map((p) => {
                const o = overrides[String(p.id)] ?? {}
                const stock = o.stock ?? p.stock
                return (
                  <button key={p.id} onClick={() => setSelected(p.id)} className={`w-full text-left rounded-xl p-3 border ${selected === p.id ? 'border-[color:var(--color-brand)] bg-[color:var(--color-brand-light)]' : 'border-gray-200'}`}>
                    <div className="flex gap-3 items-center">
                      <img src={o.image ?? p.image} alt="" className="w-14 h-14 rounded-lg object-cover bg-gray-100 border" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium line-clamp-2">{o.name ?? p.name}</div>
                        <div className="text-xs opacity-60 mt-1">{p.category} · estoque {stock} {o.hidden ? '· oculto' : ''}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>

          <section className="bg-white rounded-2xl border p-5 md:p-7">
            {!current ? <p className="opacity-60">Selecione um produto para editar.</p> : <>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
                <div>
                  <div className="text-xs opacity-60">ID {current.id} · estoque original {current.stock}</div>
                  <h2 className="font-display text-2xl mt-1">{currentOverride.name ?? current.name}</h2>
                </div>
                <button onClick={() => update(current.id, { hidden: !currentOverride.hidden })} className={`rounded-full px-4 py-2 text-sm border ${currentOverride.hidden ? 'bg-gray-100' : ''}`}>
                  {currentOverride.hidden ? '↩ Mostrar no catálogo' : '🚫 Excluir/ocultar do catálogo'}
                </button>
              </div>

              <div className="grid lg:grid-cols-[1fr_280px] gap-7">
                <div className="space-y-5">
                  <label className="block text-sm font-medium">Título<input className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={currentOverride.name ?? current.name} onChange={(e) => update(current.id, { name: e.target.value })} /></label>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="block text-sm font-medium">Preço (R$)<input type="number" min="0" step="0.01" className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={currentOverride.price ?? current.price} onChange={(e) => update(current.id, { price: Math.max(0, Number(e.target.value)) })} /></label>
                    <label className="block text-sm font-medium">Estoque<input type="number" min="0" step="1" className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={currentOverride.stock ?? current.stock} onChange={(e) => update(current.id, { stock: Math.max(0, Math.floor(Number(e.target.value))) })} /></label>
                  </div>
                  <label className="block text-sm font-medium">Descrição<textarea rows={9} className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={currentOverride.description ?? current.description} onChange={(e) => update(current.id, { description: e.target.value })} /></label>
                  <label className="block text-sm font-medium">Descrição curta<textarea rows={3} className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={currentOverride.shortDescription ?? current.shortDescription} onChange={(e) => update(current.id, { shortDescription: e.target.value })} /></label>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Fotos do produto</div>
                  <p className="text-xs opacity-60 mb-3">Você não precisa identificar pelo link: veja a imagem aqui. Para trocar, cole a nova URL.</p>
                  <div className="space-y-4">
                    {currentImages.map((img, i) => (
                      <div key={i} className="rounded-xl border p-2 bg-[#fffdfc]">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                          <img src={img} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        </div>
                        <div className="text-xs opacity-60 mb-1">Foto {i + 1}</div>
                        <input className="w-full rounded-lg border px-3 py-2 text-xs" value={img} onChange={(e) => { const arr = [...currentImages]; arr[i] = e.target.value; update(current.id, { images: arr, image: arr[0] }) }} />
                        <a href={img} target="_blank" rel="noreferrer" className="inline-block text-xs underline mt-2">Abrir imagem</a>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => update(current.id, { images: [...currentImages, ''] })} className="w-full mt-3 rounded-xl border px-4 py-2 text-sm">+ Adicionar foto</button>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t flex flex-wrap gap-3 items-center">
                <button onClick={saveChanges} className="rounded-full px-6 py-3 bg-[color:var(--color-brand-dark)] text-white font-medium">Salvar alterações</button>
                <button onClick={() => update(current.id, { hidden: !currentOverride.hidden })} className="rounded-full px-5 py-3 border">{currentOverride.hidden ? 'Mostrar novamente' : 'Ocultar este anúncio'}</button>
                <span className="text-xs opacity-60">As alterações ficam salvas neste dispositivo. Use “Baixar para publicar” quando quiser atualizar o catálogo para todas as clientes.</span>
              </div>
            </>}
          </section>
        </div>
      </div>
    </div>
  )
}
