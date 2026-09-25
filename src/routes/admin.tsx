import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import products, { type Product, type ProductCategory } from '@/data/products'
import type { CatalogAdditions, CatalogOverrides, CatalogSettings, ProductOverride } from '@/lib/catalog'

export const Route = createFileRoute('/admin')({ component: AdminPage })

type AdminTab = 'inicio' | 'estatisticas' | 'novo' | 'ativos' | 'ocultos' | 'excluidos' | 'configuracoes'
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
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allProducts.filter((p) => {
      const o = overrides[String(p.id)] ?? {}
      const isDeleted = Boolean(o.deleted); const isHidden = Boolean(o.hidden) && !isDeleted
      const matchesTab = tab === 'excluidos' ? isDeleted : tab === 'ocultos' ? isHidden : !isDeleted && !isHidden
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || String(p.id).includes(q)
      return matchesTab && matchesSearch
    })
  }, [query, overrides, allProducts, tab])

  const counts = useMemo(() => {
    let ativos = 0, ocultos = 0, excluidos = 0, estoqueZero = 0
    for (const p of allProducts) { const o = overrides[String(p.id)] ?? {}; if (o.deleted) excluidos++; else if (o.hidden) ocultos++; else ativos++; if ((o.stock ?? p.stock ?? 0) <= 0) estoqueZero++ }
    return { ativos, ocultos, excluidos, estoqueZero, total: allProducts.length }
  }, [overrides, allProducts])

  const current = selected == null ? null : allProducts.find((p) => p.id === selected) ?? null
  const currentOverride = current ? (overrides[String(current.id)] ?? {}) : {}
  const currentImages = currentOverride.images ?? current?.images ?? []

  function update(id: number, patch: ProductOverride) {
    setOverrides((prev) => ({ ...prev, [String(id)]: { ...(prev[String(id)] ?? {}), ...patch } }))
    setSavedMessage('Alteração pendente — clique em “Salvar alterações”.')
  }
  function updateSettings(patch: CatalogSettings) { setSettings((prev) => ({ ...prev, ...patch })); setSavedMessage('Configuração pendente — clique em “Salvar alterações”.') }
  function deleteImage(id: number, index: number) { const p = allProducts.find((x) => x.id === id); if (!p) return; const o = overrides[String(id)] ?? {}; const images = [...(o.images ?? p.images ?? [])]; images.splice(index, 1); update(id, { images, image: images[0] ?? '' }) }

  function addProduct() {
    const id = -Date.now()
    const newProduct: Product = { id, stock: 1, name: 'Novo produto', category: 'Outros', image: '', images: [], description: '', shortDescription: '', price: 0 }
    setAdditions((prev) => ({ ...prev, [String(id)]: newProduct }))
    setSelected(id); setTab('ativos'); setQuery(''); setSavedMessage('Novo produto criado localmente — preencha os dados e clique em Salvar alterações.')
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

  const nav: [AdminTab, string][] = [['inicio', '📊 Início'], ['estatisticas', '📈 Estatísticas'], ['novo', '➕ Novo produto'], ['ativos', '💎 Ativos'], ['ocultos', '👁 Ocultos'], ['excluidos', '🗑 Excluídos'], ['configuracoes', '⚙️ Configurações']]

  return <div className="min-h-screen bg-[#fffdfc] p-4 md:p-8"><div className="max-w-7xl mx-auto">
    <header className="sticky top-0 z-30 bg-[#fffdfc]/95 backdrop-blur py-3 mb-5 border-b"><div className="flex flex-wrap items-center justify-between gap-3"><div><Link to="/" className="text-sm underline">← Ver catálogo</Link><h1 className="font-display text-3xl md:text-4xl mt-2">Painel Trivelle</h1><p className="text-sm opacity-65">Gerencie produtos, imagens, estoque, contatos e estatísticas.</p></div><div className="flex items-center gap-2"><button onClick={refreshFromServer} className="rounded-full px-4 py-2 border text-sm">↻ Recarregar</button><button onClick={saveChanges} className="rounded-full px-5 py-2.5 bg-[color:var(--color-brand-dark)] text-white font-medium">💾 Salvar alterações</button></div></div>{savedMessage && <div className="mt-3 rounded-xl bg-[color:var(--color-brand-light)] px-4 py-2 text-sm text-[color:var(--color-brand-dark)]">{savedMessage}</div>}</header>

    <nav className="flex gap-2 overflow-x-auto pb-2 mb-6">{nav.map(([value, label]) => <button key={value} onClick={() => { setTab(value); setSelected(null); if (value === 'estatisticas') loadStats() }} className={`whitespace-nowrap rounded-full px-4 py-2.5 border text-sm font-medium ${tab === value ? 'bg-[color:var(--color-brand-dark)] text-white border-[color:var(--color-brand-dark)]' : 'bg-white border-gray-200 hover:bg-[color:var(--color-brand-light)]'}`}>{label}</button>)}</nav>

    {tab === 'inicio' && <div className="space-y-6"><div className="grid grid-cols-2 lg:grid-cols-5 gap-4">{[['Produtos', counts.total, '📦'], ['Ativos', counts.ativos, '💎'], ['Ocultos', counts.ocultos, '👁'], ['Excluídos', counts.excluidos, '🗑'], ['Estoque zero', counts.estoqueZero, '📦']].map(([label, value, icon]) => <div key={String(label)} className="bg-white rounded-2xl border p-5"><div className="text-2xl">{icon}</div><div className="text-2xl font-semibold mt-3">{value}</div><div className="text-sm opacity-60">{label}</div></div>)}</div><div className="grid lg:grid-cols-3 gap-4"><button onClick={addProduct} className="bg-white rounded-2xl border p-6 text-left hover:shadow-md"><div className="text-3xl">➕</div><h2 className="font-display text-2xl mt-3">Adicionar produto</h2><p className="text-sm opacity-60 mt-1">Cadastre uma peça nova sem mexer no código.</p></button><button onClick={() => setTab('ativos')} className="bg-white rounded-2xl border p-6 text-left hover:shadow-md"><div className="text-3xl">💎</div><h2 className="font-display text-2xl mt-3">Editar produtos</h2><p className="text-sm opacity-60 mt-1">Fotos, título, preço, estoque e descrições.</p></button><button onClick={() => setTab('configuracoes')} className="bg-white rounded-2xl border p-6 text-left hover:shadow-md"><div className="text-3xl">📲</div><h2 className="font-display text-2xl mt-3">Redes e contato</h2><p className="text-sm opacity-60 mt-1">Instagram e WhatsApp do catálogo.</p></button></div></div>}

    {tab === 'estatisticas' && <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-3xl">Estatísticas</h2><p className="text-sm opacity-65 mt-1">Dados anônimos de uso do catálogo.</p></div><button onClick={loadStats} className="rounded-full px-4 py-2 border text-sm">↻ Atualizar estatísticas</button></div>{statsLoading && <div className="rounded-2xl border bg-white p-6">Carregando…</div>}{statsError && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{statsError}</div>}{stats && !statsLoading && <><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[[stats.visits, 'Visitas'], [stats.productViews, 'Visualizações'], [stats.whatsappClicks, 'WhatsApp'], [stats.instagramClicks, 'Instagram']].map(([value, label]) => <div key={String(label)} className="bg-white rounded-2xl border p-5"><div className="text-2xl font-semibold">{value}</div><div className="text-sm opacity-60 mt-1">{label}</div></div>)}</div><div className="grid lg:grid-cols-2 gap-6"><div className="bg-white rounded-2xl border p-6"><h3 className="font-display text-2xl">Produtos mais vistos</h3><div className="mt-4 space-y-3">{Object.entries(stats.products).sort((a,b) => b[1].views-a[1].views).slice(0,10).map(([id,item]) => <div key={id} className="flex items-center justify-between gap-4 border-b last:border-0 pb-3"><div className="min-w-0"><div className="font-medium truncate">{item.name}</div><div className="text-xs opacity-50">ID {id}</div></div><div className="text-sm whitespace-nowrap">{item.views} visualizações · {item.whatsappClicks} WhatsApp</div></div>)}</div></div><div className="bg-white rounded-2xl border p-6"><h3 className="font-display text-2xl">Últimos 14 dias</h3><div className="mt-4 space-y-2">{Object.entries(stats.days).sort((a,b) => b[0].localeCompare(a[0])).slice(0,14).map(([day,d]) => <div key={day} className="grid grid-cols-4 gap-2 text-sm border-b last:border-0 py-2"><span>{day}</span><span>{d.visits}</span><span>{d.productViews}</span><span>{d.whatsappClicks}</span></div>)}</div></div></div></>}</div>}

    {tab === 'novo' && <section className="bg-white rounded-2xl border p-6 md:p-8 max-w-4xl"><h2 className="font-display text-3xl">Novo produto</h2><p className="text-sm opacity-65 mt-1 mb-7">Clique em “Criar produto” para abrir o formulário de cadastro.</p><button onClick={addProduct} className="rounded-full px-6 py-3 bg-[color:var(--color-brand-dark)] text-white font-medium">➕ Criar produto</button></section>}

    {tab === 'configuracoes' && <section className="bg-white rounded-2xl border p-6 md:p-8 max-w-3xl"><h2 className="font-display text-3xl">Configurações</h2><p className="text-sm opacity-65 mt-1 mb-7">Esses contatos aparecem no catálogo público.</p><div className="space-y-5"><label className="block text-sm font-medium">Instagram<input className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={settings.instagramUrl ?? ''} onChange={(e) => updateSettings({ instagramUrl: e.target.value })} placeholder="https://www.instagram.com/seuusuario/" /></label><label className="block text-sm font-medium">WhatsApp<input className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={settings.whatsappNumber ?? ''} onChange={(e) => updateSettings({ whatsappNumber: e.target.value })} placeholder="5519999999999" /></label><label className="block text-sm font-medium">Mensagem padrão<textarea rows={3} className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={settings.whatsappMessage ?? ''} onChange={(e) => updateSettings({ whatsappMessage: e.target.value })} /></label><button onClick={saveChanges} className="rounded-full px-6 py-3 bg-[color:var(--color-brand-dark)] text-white font-medium">💾 Salvar configurações</button></div></section>}

    {(['ativos','ocultos','excluidos'] as AdminTab[]).includes(tab) && <div className="grid md:grid-cols-[330px_1fr] gap-6"><aside className="bg-white rounded-2xl border p-4 h-fit md:sticky md:top-28"><div className="flex items-center justify-between mb-3"><span className="text-xs opacity-60">{filteredProducts.length} anúncio(s)</span>{query && <button onClick={() => setQuery('')} className="text-xs underline">Limpar</button>}</div><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="🔎 Buscar nome ou ID" className="w-full rounded-xl border px-4 py-3 mb-4" /><div className="max-h-[70vh] overflow-auto space-y-2">{filteredProducts.map((p) => { const o=overrides[String(p.id)]??{}; const stock=o.stock??p.stock; return <button key={p.id} onClick={() => setSelected(p.id)} className={`w-full text-left rounded-xl p-3 border ${selected===p.id?'border-[color:var(--color-brand)] bg-[color:var(--color-brand-light)]':'border-gray-200'}`}><div className="flex gap-3 items-center"><img src={o.image||p.image||'/placeholder.png'} alt="" className="w-14 h-14 rounded-lg object-cover bg-gray-100 border"/><div className="min-w-0"><div className="text-sm font-medium line-clamp-2">{o.name??p.name}</div><div className="text-xs opacity-60 mt-1">{p.category} · estoque {stock}</div></div></div></button>})}{filteredProducts.length===0&&<p className="text-sm opacity-60 py-5 text-center">Nenhum anúncio nesta aba.</p>}</div></aside>
      <section className="bg-white rounded-2xl border p-5 md:p-7">{!current?<div className="py-20 text-center opacity-60"><div className="text-5xl mb-3">💎</div><p>Selecione um produto para editar.</p></div>:<><div className="flex flex-wrap items-start justify-between gap-4 mb-7"><div><div className="text-xs opacity-60">ID {current.id} · {current.category}</div><h2 className="font-display text-2xl mt-1">{currentOverride.name??current.name}</h2></div><div className="flex flex-wrap gap-2">{currentOverride.deleted?<button onClick={()=>update(current.id,{deleted:false})} className="rounded-full px-4 py-2 text-sm border">↩ Restaurar</button>:currentOverride.hidden?<button onClick={()=>update(current.id,{hidden:false})} className="rounded-full px-4 py-2 text-sm border">↩ Mostrar</button>:<><button onClick={()=>update(current.id,{hidden:true})} className="rounded-full px-4 py-2 text-sm border">👁 Ocultar</button><button onClick={()=>update(current.id,{deleted:true,hidden:false})} className="rounded-full px-4 py-2 text-sm border border-red-200 text-red-700">🗑 Excluir</button></>}</div></div>
        <div className="grid lg:grid-cols-[1fr_300px] gap-7"><div className="space-y-5"><label className="block text-sm font-medium">Título<input className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={currentOverride.name??current.name} onChange={(e)=>update(current.id,{name:e.target.value})}/></label><div className="grid sm:grid-cols-2 gap-4"><label className="block text-sm font-medium">Preço (R$)<input type="number" min="0" step="0.01" className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={currentOverride.price??current.price} onChange={(e)=>update(current.id,{price:Math.max(0,Number(e.target.value))})}/></label><label className="block text-sm font-medium">Estoque<input type="number" min="0" step="1" className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={currentOverride.stock??current.stock} onChange={(e)=>update(current.id,{stock:Math.max(0,Math.floor(Number(e.target.value)))})}/></label></div><label className="block text-sm font-medium">Categoria<select className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={currentOverride.category??current.category} onChange={(e)=>{const value=e.target.value as ProductCategory; if (String(current.id) in additions) setAdditions(prev=>({...prev,[String(current.id)]:{...prev[String(current.id)],category:value}})); else setOverrides(prev=>({...prev,[String(current.id)]:{...(prev[String(current.id)]??{}),category:value} as ProductOverride}))}}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label className="block text-sm font-medium">Descrição<textarea rows={8} className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={currentOverride.description??current.description} onChange={(e)=>update(current.id,{description:e.target.value})}/></label><label className="block text-sm font-medium">Descrição curta<textarea rows={3} className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={currentOverride.shortDescription??current.shortDescription} onChange={(e)=>update(current.id,{shortDescription:e.target.value})}/></label></div>
          <div><div className="text-sm font-medium mb-2">Fotos do produto</div><div className="space-y-4">{currentImages.map((img,i)=><div key={`${img}-${i}`} className="rounded-2xl border p-3 bg-[#fffdfc]"><div className="aspect-square rounded-xl overflow-hidden bg-gray-100">{img?<img src={img} alt={`Foto ${i+1}`} className="w-full h-full object-contain"/>:<div className="h-full flex items-center justify-center text-xs opacity-50">Sem imagem</div>}</div><div className="flex gap-2 mt-2"><button type="button" onClick={()=>deleteImage(current.id,i)} className="rounded-full px-3 py-1.5 border text-xs text-red-700">🗑 Remover foto</button>{i===0&&<span className="text-xs opacity-50 self-center">Principal</span>}</div></div>)}</div><button onClick={()=>update(current.id,{images:[...currentImages,'']})} className="w-full mt-3 rounded-xl border px-4 py-2 text-sm">+ Adicionar foto</button><p className="text-xs opacity-50 mt-2">Cole a URL da imagem no campo que aparecer.</p>{currentImages.map((img,i)=><input key={`url-${i}`} value={img} onChange={e=>{const images=[...currentImages]; images[i]=e.target.value; update(current.id,{images,image:images[0]??''})}} placeholder={`URL da foto ${i+1}`} className="mt-2 w-full rounded-xl border px-3 py-2 text-xs"/>)}</div></div><div className="mt-8 pt-5 border-t flex flex-wrap gap-3 items-center"><button onClick={saveChanges} className="rounded-full px-6 py-3 bg-[color:var(--color-brand-dark)] text-white font-medium">💾 Salvar alterações</button><span className="text-xs opacity-60">Salva no servidor para todas as clientes.</span></div></>}</section></div>}
  </div></div>
}
