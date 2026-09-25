import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { GripVertical, Instagram, PackagePlus, Plus, Save, Trash2, Upload, X } from 'lucide-react'
import products, { type Product, type ProductCategory } from '@/data/products'
import type { CatalogAdditions, CatalogOverrides, CatalogSettings, ProductOverride } from '@/lib/catalog'

export const Route = createFileRoute('/admin')({ component: AdminPage })

type AdminTab = 'inicio' | 'estatisticas' | 'novo' | 'ativos' | 'ocultos' | 'sem-estoque' | 'excluidos' | 'configuracoes'
type AnalyticsStats = { visits: number; productViews: number; whatsappClicks: number; instagramClicks: number; products: Record<string, { name: string; views: number; whatsappClicks: number }>; days: Record<string, { visits: number; productViews: number; whatsappClicks: number; instagramClicks: number }> }
const categories: ProductCategory[] = ['Anéis', 'Brincos', 'Colares', 'Pulseiras', 'Tornozeleiras', 'Conjuntos', 'Outros']

function AdminPage() {
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [overrides, setOverrides] = useState<CatalogOverrides>({})
  const [additions, setAdditions] = useState<CatalogAdditions>({})
  const [settings, setSettings] = useState<CatalogSettings>({ instagramUrl: 'https://www.instagram.com/trivellejoias/', whatsappNumber: '5519982124939', whatsappMessage: 'Olá! Vim pelo catálogo da Trivelle e gostaria de saber mais sobre as peças.' })
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<number | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')
  const [tab, setTab] = useState<AdminTab>('inicio')
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragProductId = useRef<number | null>(null)
  const dragImageIndex = useRef<number | null>(null)

  useEffect(() => { const session = sessionStorage.getItem('trivelle-admin-auth'); if (session === 'ok') setAuthorized(true); setChecking(false) }, [])

  async function loadData() {
    const [catalogResponse, settingsResponse, additionsResponse] = await Promise.all([
      fetch('/.netlify/functions/catalog-data', { cache: 'no-store' }),
      fetch('/.netlify/functions/catalog-data?type=settings', { cache: 'no-store' }),
      fetch('/.netlify/functions/catalog-data?type=additions', { cache: 'no-store' }),
    ])
    if (!catalogResponse.ok) throw new Error()
    const catalog = await catalogResponse.json()
    const remoteSettings = settingsResponse.ok ? await settingsResponse.json() : {}
    const remoteAdditions = additionsResponse.ok ? await additionsResponse.json() : {}
    setOverrides(catalog ?? {})
    setSettings((prev) => ({ ...prev, ...(remoteSettings ?? {}) }))
    setAdditions(remoteAdditions ?? {})
    setLoaded(true)
  }

  useEffect(() => { if (authorized) loadData().catch(() => setLoaded(true)) }, [authorized])

  async function login() {
    setLoginError('')
    try {
      const response = await fetch('/.netlify/functions/admin-auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
      if (!response.ok) throw new Error()
      sessionStorage.setItem('trivelle-admin-auth', 'ok'); sessionStorage.setItem('trivelle-admin-password', password); setAuthorized(true); setPassword('')
    } catch { setLoginError('Senha incorreta. Tente novamente.') }
  }

  const allProducts = useMemo<Product[]>(() => [...products, ...Object.values(additions)], [additions])
  const orderedProducts = useMemo(() => {
    const originalIndex = new Map(allProducts.map((p, i) => [p.id, i]))
    return [...allProducts].sort((a, b) => {
      const ao = overrides[String(a.id)]?.order
      const bo = overrides[String(b.id)]?.order
      if (ao != null || bo != null) return (ao ?? 1_000_000_000 + (originalIndex.get(a.id) ?? 0)) - (bo ?? 1_000_000_000 + (originalIndex.get(b.id) ?? 0))
      return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0)
    })
  }, [allProducts, overrides])

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orderedProducts.filter((p) => {
      const o = overrides[String(p.id)] ?? {}
      const stock = Number(o.stock ?? p.stock ?? 0)
      const isDeleted = Boolean(o.deleted)
      const isHidden = Boolean(o.hidden) && !isDeleted
      const matchesTab = tab === 'excluidos' ? isDeleted : tab === 'ocultos' ? isHidden : tab === 'sem-estoque' ? !isDeleted && !isHidden && stock <= 0 : !isDeleted && !isHidden && stock > 0
      const matchesSearch = !q || (o.name ?? p.name).toLowerCase().includes(q) || String(p.id).includes(q)
      return matchesTab && matchesSearch
    })
  }, [query, overrides, orderedProducts, tab])

  const counts = useMemo(() => {
    let ativos = 0, ocultos = 0, excluidos = 0, semEstoque = 0
    for (const p of allProducts) {
      const o = overrides[String(p.id)] ?? {}; const stock = Number(o.stock ?? p.stock ?? 0)
      if (o.deleted) excluidos++; else if (o.hidden) ocultos++; else if (stock <= 0) semEstoque++; else ativos++
    }
    return { ativos, ocultos, excluidos, semEstoque, total: allProducts.length }
  }, [overrides, allProducts])

  const current = selected == null ? null : allProducts.find((p) => p.id === selected) ?? null
  const currentOverride = current ? (overrides[String(current.id)] ?? {}) : {}
  const currentImages = currentOverride.images ?? current?.images ?? []

  function update(id: number, patch: ProductOverride) {
    setOverrides((prev) => ({ ...prev, [String(id)]: { ...(prev[String(id)] ?? {}), ...patch } }))
    setSavedMessage('Alteração pendente — clique em “Salvar alterações”.')
  }
  function updateSettings(patch: CatalogSettings) { setSettings((prev) => ({ ...prev, ...patch })); setSavedMessage('Configuração pendente — clique em “Salvar alterações”.') }
  function setImages(id: number, images: string[]) { update(id, { images, image: images[0] ?? '' }) }
  function deleteImage(id: number, index: number) { const images = [...(overrides[String(id)]?.images ?? allProducts.find((x) => x.id === id)?.images ?? [])]; images.splice(index, 1); setImages(id, images) }

  function addProduct() {
    const id = -Date.now()
    const maxOrder = orderedProducts.reduce((max, p) => Math.max(max, overrides[String(p.id)]?.order ?? -1), -1)
    const newProduct: Product = { id, stock: 1, name: 'Novo produto', category: 'Outros', image: '', images: [], description: '', shortDescription: '', price: 0 }
    setAdditions((prev) => ({ ...prev, [String(id)]: newProduct }))
    setOverrides((prev) => ({ ...prev, [String(id)]: { ...(prev[String(id)] ?? {}), order: maxOrder + 1 } }))
    setSelected(id); setTab('ativos'); setQuery(''); setSavedMessage('Novo produto criado. Preencha os dados, envie as fotos e clique em Salvar alterações.')
  }

  async function saveChanges() {
    const adminPassword = sessionStorage.getItem('trivelle-admin-password')
    if (!adminPassword) { setSavedMessage('Sua sessão expirou. Entre novamente.'); setAuthorized(false); return }
    setSavedMessage('Salvando…')
    try {
      const response = await fetch('/.netlify/functions/catalog-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: adminPassword, overrides, additions, settings }) })
      if (!response.ok) throw new Error()
      setSavedMessage('✓ Tudo salvo no catálogo para todas as clientes.'); window.setTimeout(() => setSavedMessage(''), 5000)
    } catch { setSavedMessage('Não foi possível salvar. Verifique sua conexão e tente novamente.') }
  }

  function reorderProducts(draggedId: number, targetId: number) {
    if (draggedId === targetId) return
    const visibleIds = filteredProducts.map((p) => p.id)
    const from = visibleIds.indexOf(draggedId); const to = visibleIds.indexOf(targetId)
    if (from < 0 || to < 0) return
    const reorderedIds = [...visibleIds]
    const [item] = reorderedIds.splice(from, 1); reorderedIds.splice(to, 0, item)
    const replacements = new Map(reorderedIds.map((id, index) => [visibleIds[index], id]))
    const nextOrder = [...orderedProducts]
    for (let i = 0; i < nextOrder.length; i++) {
      if (replacements.has(nextOrder[i].id)) nextOrder[i] = allProducts.find((p) => p.id === replacements.get(nextOrder[i].id)) ?? nextOrder[i]
    }
    const next: CatalogOverrides = { ...overrides }
    nextOrder.forEach((p, index) => { next[String(p.id)] = { ...(next[String(p.id)] ?? {}), order: index } })
    setOverrides(next); setSavedMessage('Ordem alterada — clique em “Salvar alterações”.')
  }

  function reorderImages(id: number, from: number, to: number) {
    if (from === to) return
    const images = [...(overrides[String(id)]?.images ?? allProducts.find((p) => p.id === id)?.images ?? [])]
    if (!images[from] || to < 0 || to >= images.length) return
    const [item] = images.splice(from, 1); images.splice(to, 0, item); setImages(id, images)
  }

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file) })
  }

  async function optimizeImage(file: File): Promise<string> {
    const data = await fileToDataUrl(file)
    return await new Promise((resolve) => {
      const image = new Image(); image.onload = () => {
        const max = 1800; const scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const ctx = canvas.getContext('2d'); if (!ctx) return resolve(data); ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => { if (!blob) return resolve(data); const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(blob) }, 'image/webp', 0.9)
      }; image.onerror = () => resolve(data); image.src = data
    })
  }

  async function uploadFiles(files: FileList | File[]) {
    const id = current?.id
    if (!id || !files.length) return
    const adminPassword = sessionStorage.getItem('trivelle-admin-password'); if (!adminPassword) return
    setUploading(true); setSavedMessage('Enviando fotos…')
    try {
      const urls: string[] = []
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        const dataUrl = await optimizeImage(file)
        const response = await fetch('/.netlify/functions/catalog-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'uploadImage', password: adminPassword, dataUrl }) })
        if (!response.ok) throw new Error()
        const result = await response.json(); if (result.url) urls.push(result.url)
      }
      setImages(id, [...currentImages, ...urls]); setSavedMessage(`${urls.length} foto(s) adicionada(s). Clique em “Salvar alterações”.`)
    } catch { setSavedMessage('Não foi possível enviar uma das fotos. Tente novamente.') } finally { setUploading(false) }
  }

  async function loadStats() {
    const adminPassword = sessionStorage.getItem('trivelle-admin-password'); if (!adminPassword) return
    setStatsLoading(true); setStatsError('')
    try { const response = await fetch('/.netlify/functions/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'stats', password: adminPassword }) }); if (!response.ok) throw new Error(); setStats(await response.json() as AnalyticsStats) }
    catch { setStatsError('Não foi possível carregar as estatísticas agora.') } finally { setStatsLoading(false) }
  }
  async function refreshFromServer() { try { await loadData(); setSavedMessage('✓ Dados recarregados do servidor.'); window.setTimeout(() => setSavedMessage(''), 4000) } catch { setSavedMessage('Não foi possível recarregar os dados.') } }

  if (checking) return <div className="min-h-screen p-8">Verificando acesso…</div>
  if (!authorized) return <div className="min-h-screen bg-[#fffdfc] flex items-center justify-center px-6"><div className="w-full max-w-md bg-white rounded-3xl border p-8 shadow-sm"><Link to="/" className="text-sm underline">← Voltar ao catálogo</Link><h1 className="font-display text-3xl mt-8">Área administrativa</h1><p className="text-sm opacity-70 mt-2 mb-6">Esta área é exclusiva da Trivelle.</p><label className="block text-sm">Senha<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && login()} className="mt-1 w-full rounded-xl border px-4 py-3" autoComplete="current-password" /></label>{loginError && <p className="text-sm text-red-600 mt-3">{loginError}</p>}<button onClick={login} className="w-full mt-5 rounded-full px-5 py-3 bg-[color:var(--color-brand-dark)] text-white">Entrar</button></div></div>
  if (!loaded) return <div className="min-h-screen p-8">Carregando painel…</div>

  const nav: [AdminTab, string][] = [['inicio', '📊 Início'], ['estatisticas', '📈 Estatísticas'], ['novo', '➕ Novo produto'], ['ativos', `💎 Ativos (${counts.ativos})`], ['ocultos', `👁 Ocultos (${counts.ocultos})`], ['sem-estoque', `📦 Sem estoque (${counts.semEstoque})`], ['excluidos', `🗑 Excluídos (${counts.excluidos})`], ['configuracoes', '⚙️ Configurações']]

  const productEditorTabs = (['ativos','ocultos','sem-estoque','excluidos'] as AdminTab[]).includes(tab)

  return <div className="min-h-screen bg-[#fffdfc] p-4 md:p-8"><div className="max-w-7xl mx-auto">
    <header className="sticky top-0 z-30 bg-[#fffdfc]/95 backdrop-blur py-3 mb-5 border-b"><div className="flex flex-wrap items-center justify-between gap-3"><div><Link to="/" className="text-sm underline">← Ver catálogo</Link><h1 className="font-display text-3xl md:text-4xl mt-2">Painel Trivelle</h1><p className="text-sm opacity-65">Produtos, fotos, estoque, ordem, contatos e estatísticas.</p></div><div className="flex items-center gap-2"><button onClick={refreshFromServer} className="rounded-full px-4 py-2 border text-sm">↻ Recarregar</button><button onClick={saveChanges} className="rounded-full px-5 py-2.5 bg-[color:var(--color-brand-dark)] text-white font-medium"><Save size={16} className="inline mr-1"/> Salvar alterações</button></div></div>{savedMessage && <div className="mt-3 rounded-xl bg-[color:var(--color-brand-light)] px-4 py-2 text-sm text-[color:var(--color-brand-dark)]">{savedMessage}</div>}</header>

    <nav className="flex gap-2 overflow-x-auto pb-2 mb-6">{nav.map(([value, label]) => <button key={value} onClick={() => { setTab(value); setSelected(null); if (value === 'estatisticas') loadStats() }} className={`whitespace-nowrap rounded-full px-4 py-2.5 border text-sm font-medium ${tab === value ? 'bg-[color:var(--color-brand-dark)] text-white border-[color:var(--color-brand-dark)]' : 'bg-white border-gray-200 hover:bg-[color:var(--color-brand-light)]'}`}>{label}</button>)}</nav>

    {tab === 'inicio' && <div className="space-y-6"><div className="grid grid-cols-2 lg:grid-cols-5 gap-4">{[['Produtos', counts.total, '📦'], ['Ativos', counts.ativos, '💎'], ['Ocultos', counts.ocultos, '👁'], ['Sem estoque', counts.semEstoque, '📦'], ['Excluídos', counts.excluidos, '🗑']].map(([label, value, icon]) => <div key={String(label)} className="bg-white rounded-2xl border p-5"><div className="text-2xl">{icon}</div><div className="text-2xl font-semibold mt-3">{value}</div><div className="text-sm opacity-60">{label}</div></div>)}</div><div className="grid lg:grid-cols-3 gap-4"><button onClick={addProduct} className="bg-white rounded-2xl border p-6 text-left hover:shadow-md"><div className="text-3xl">➕</div><h2 className="font-display text-2xl mt-3">Adicionar produto</h2><p className="text-sm opacity-60 mt-1">Cadastre uma peça nova e envie as fotos direto do celular ou computador.</p></button><button onClick={() => setTab('ativos')} className="bg-white rounded-2xl border p-6 text-left hover:shadow-md"><div className="text-3xl">💎</div><h2 className="font-display text-2xl mt-3">Organizar ativos</h2><p className="text-sm opacity-60 mt-1">Arraste produtos para mudar a ordem do catálogo.</p></button><button onClick={() => setTab('configuracoes')} className="bg-white rounded-2xl border p-6 text-left hover:shadow-md"><div className="text-3xl">📲</div><h2 className="font-display text-2xl mt-3">Redes e contato</h2><p className="text-sm opacity-60 mt-1">Instagram e WhatsApp do catálogo.</p></button></div></div>}

    {tab === 'estatisticas' && <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-3xl">Estatísticas</h2><p className="text-sm opacity-65 mt-1">Dados anônimos de uso do catálogo.</p></div><button onClick={loadStats} className="rounded-full px-4 py-2 border text-sm">↻ Atualizar estatísticas</button></div>{statsLoading && <div className="rounded-2xl border bg-white p-6">Carregando…</div>}{statsError && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{statsError}</div>}{stats && !statsLoading && <><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[[stats.visits, 'Visitas'], [stats.productViews, 'Visualizações'], [stats.whatsappClicks, 'WhatsApp'], [stats.instagramClicks, 'Instagram']].map(([value, label]) => <div key={String(label)} className="bg-white rounded-2xl border p-5"><div className="text-2xl font-semibold">{value}</div><div className="text-sm opacity-60 mt-1">{label}</div></div>)}</div><div className="bg-white rounded-2xl border p-6"><h3 className="font-display text-2xl">Produtos mais vistos</h3><div className="mt-4 space-y-3">{Object.entries(stats.products).sort((a,b) => b[1].views-a[1].views).slice(0,10).map(([id,item]) => <div key={id} className="flex items-center justify-between gap-4 border-b last:border-0 pb-3"><div className="min-w-0"><div className="font-medium truncate">{item.name}</div><div className="text-xs opacity-50">ID {id}</div></div><div className="text-sm whitespace-nowrap">{item.views} visualizações · {item.whatsappClicks} WhatsApp</div></div>)}</div></div></>}</div>}

    {tab === 'novo' && <section className="bg-white rounded-2xl border p-8 max-w-3xl"><div className="w-14 h-14 rounded-2xl bg-[color:var(--color-brand-light)] flex items-center justify-center"><PackagePlus /></div><h2 className="font-display text-3xl mt-5">Novo produto</h2><p className="text-sm opacity-65 mt-2 mb-6">Crie o produto e depois preencha os dados e envie as fotos diretamente da sua galeria.</p><button onClick={addProduct} className="rounded-full px-6 py-3 bg-[color:var(--color-brand-dark)] text-white font-medium"><Plus size={17} className="inline mr-1"/> Criar produto</button></section>}

    {tab === 'configuracoes' && <section className="bg-white rounded-2xl border p-6 md:p-8 max-w-3xl"><h2 className="font-display text-3xl">Configurações</h2><p className="text-sm opacity-65 mt-1 mb-7">Esses contatos aparecem no catálogo público.</p><div className="space-y-5"><label className="block text-sm font-medium">Instagram<input className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={settings.instagramUrl ?? ''} onChange={(e) => updateSettings({ instagramUrl: e.target.value })} placeholder="https://www.instagram.com/seuusuario/" /></label><label className="block text-sm font-medium">WhatsApp<input className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={settings.whatsappNumber ?? ''} onChange={(e) => updateSettings({ whatsappNumber: e.target.value })} placeholder="5519999999999" /></label><label className="block text-sm font-medium">Mensagem padrão<textarea rows={3} className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={settings.whatsappMessage ?? ''} onChange={(e) => updateSettings({ whatsappMessage: e.target.value })} /></label><button onClick={saveChanges} className="rounded-full px-6 py-3 bg-[color:var(--color-brand-dark)] text-white font-medium"><Save size={17} className="inline mr-1"/> Salvar configurações</button></div></section>}

    {productEditorTabs && <div className="grid md:grid-cols-[330px_1fr] gap-6"><aside className="bg-white rounded-2xl border p-4 h-fit md:sticky md:top-28"><div className="mb-3"><div className="flex items-center justify-between"><span className="text-xs opacity-60">{filteredProducts.length} anúncio(s)</span>{query && <button onClick={() => setQuery('')} className="text-xs underline">Limpar</button>}</div><p className="text-xs opacity-50 mt-1">Arraste um produto sobre outro para mudar a ordem.</p></div><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="🔎 Buscar nome ou ID" className="w-full rounded-xl border px-4 py-3 mb-4" /><div className="max-h-[70vh] overflow-auto space-y-2">{filteredProducts.map((p) => { const o=overrides[String(p.id)]??{}; const stock=o.stock??p.stock; return <div key={p.id} draggable onDragStart={()=>{dragProductId.current=p.id}} onDragOver={(e)=>e.preventDefault()} onDrop={()=>{if(dragProductId.current!=null) reorderProducts(dragProductId.current,p.id); dragProductId.current=null}} className={`w-full rounded-xl p-3 border ${selected===p.id?'border-[color:var(--color-brand)] bg-[color:var(--color-brand-light)]':'border-gray-200'} cursor-grab`}><div className="flex gap-2 items-center"><GripVertical size={18} className="opacity-35 shrink-0"/><button onClick={()=>setSelected(p.id)} className="flex gap-3 items-center text-left min-w-0 flex-1"><img src={o.image||p.image||'/placeholder.png'} alt="" className="w-14 h-14 rounded-lg object-cover bg-gray-100 border"/><div className="min-w-0"><div className="text-sm font-medium line-clamp-2">{o.name??p.name}</div><div className="text-xs opacity-60 mt-1">{p.category} · estoque {stock}</div></div></button></div></div>})}{filteredProducts.length===0&&<p className="text-sm opacity-60 py-5 text-center">Nenhum anúncio nesta aba.</p>}</div></aside>
      <section className="bg-white rounded-2xl border p-5 md:p-7">{!current?<div className="py-20 text-center opacity-60"><div className="text-5xl mb-3">💎</div><p>Selecione um produto para editar.</p></div>:<><div className="flex flex-wrap items-start justify-between gap-4 mb-7"><div><div className="text-xs opacity-60">ID {current.id} · {current.category}</div><h2 className="font-display text-2xl mt-1">{currentOverride.name??current.name}</h2></div><div className="flex flex-wrap gap-2">{currentOverride.deleted?<button onClick={()=>update(current.id,{deleted:false})} className="rounded-full px-4 py-2 text-sm border">↩ Restaurar</button>:currentOverride.hidden?<button onClick={()=>update(current.id,{hidden:false})} className="rounded-full px-4 py-2 text-sm border">↩ Mostrar</button>:<><button onClick={()=>update(current.id,{hidden:true})} className="rounded-full px-4 py-2 text-sm border">👁 Ocultar</button><button onClick={()=>update(current.id,{deleted:true,hidden:false})} className="rounded-full px-4 py-2 text-sm border border-red-200 text-red-700">🗑 Excluir</button></>}</div></div>
        <div className="grid lg:grid-cols-[1fr_340px] gap-7"><div className="space-y-5"><label className="block text-sm font-medium">Título<input className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={currentOverride.name??current.name} onChange={(e)=>update(current.id,{name:e.target.value})}/></label><div className="grid sm:grid-cols-2 gap-4"><label className="block text-sm font-medium">Preço (R$)<input type="number" min="0" step="0.01" className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={currentOverride.price??current.price} onChange={(e)=>update(current.id,{price:Math.max(0,Number(e.target.value))})}/></label><label className="block text-sm font-medium">Estoque<input type="number" min="0" step="1" className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={currentOverride.stock??current.stock} onChange={(e)=>update(current.id,{stock:Math.max(0,Math.floor(Number(e.target.value)))})}/></label></div><label className="block text-sm font-medium">Categoria<select className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={currentOverride.category??current.category} onChange={(e)=>{const value=e.target.value as ProductCategory; if (String(current.id) in additions) setAdditions(prev=>({...prev,[String(current.id)]:{...prev[String(current.id)],category:value}})); else update(current.id,{category:value})}}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label className="block text-sm font-medium">Descrição<textarea rows={8} className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={currentOverride.description??current.description} onChange={(e)=>update(current.id,{description:e.target.value})}/></label><label className="block text-sm font-medium">Descrição curta<textarea rows={3} className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={currentOverride.shortDescription??current.shortDescription} onChange={(e)=>update(current.id,{shortDescription:e.target.value})}/></label></div>
          <div><div className="flex items-center justify-between mb-2"><div><div className="text-sm font-medium">Fotos do produto</div><p className="text-xs opacity-50">Arraste para ordenar. A primeira será a principal.</p></div><button type="button" disabled={uploading} onClick={()=>fileInputRef.current?.click()} className="rounded-full px-3 py-2 border text-xs font-medium"><Upload size={15} className="inline mr-1"/>{uploading?'Enviando…':'Adicionar fotos'}</button><input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e)=>{if(e.target.files) uploadFiles(e.target.files); e.currentTarget.value=''}} /></div><div className="grid grid-cols-2 gap-3">{currentImages.map((img,i)=><div key={`${img}-${i}`} draggable onDragStart={()=>{dragImageIndex.current=i}} onDragOver={(e)=>e.preventDefault()} onDrop={()=>{if(dragImageIndex.current!=null) reorderImages(current.id,dragImageIndex.current,i); dragImageIndex.current=null}} className="rounded-2xl border p-2 bg-[#fffdfc] cursor-grab"><div className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative">{img?<img src={img} alt={`Foto ${i+1}`} className="w-full h-full object-contain"/>:<div className="h-full flex items-center justify-center text-xs opacity-50">Sem imagem</div>}<div className="absolute top-2 left-2 rounded-full bg-black/60 text-white text-[11px] px-2 py-1">{i===0?'Principal':`Foto ${i+1}`}</div></div><div className="flex items-center justify-between gap-2 mt-2"><span className="text-[11px] opacity-50">↕ Arraste</span><button type="button" onClick={()=>deleteImage(current.id,i)} className="rounded-full px-2.5 py-1.5 border text-[11px] text-red-700"><Trash2 size={13} className="inline mr-1"/>Remover</button></div></div>)}</div>{currentImages.length===0&&<button type="button" onClick={()=>fileInputRef.current?.click()} className="w-full mt-3 rounded-xl border border-dashed px-4 py-8 text-sm opacity-70"><Upload size={20} className="mx-auto mb-2"/>Clique para escolher fotos da galeria</button>}</div></div><div className="mt-8 pt-5 border-t flex flex-wrap gap-3 items-center"><button onClick={saveChanges} className="rounded-full px-6 py-3 bg-[color:var(--color-brand-dark)] text-white font-medium"><Save size={17} className="inline mr-1"/> Salvar alterações</button><span className="text-xs opacity-60">As fotos, a ordem e os dados ficam salvos no servidor.</span></div></>}</section></div>}
  </div></div>
}
