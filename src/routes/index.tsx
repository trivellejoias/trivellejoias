import { useEffect, useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Instagram } from 'lucide-react'
import products, { type Product } from '@/data/products'
import { BuyButton } from '@/components/BuyButton'
import { applyOverride, loadCatalogAdditions, loadCatalogOverrides, loadCatalogSettings, type CatalogAdditions, type CatalogOverrides, type CatalogSettings, whatsappHref } from '@/lib/catalog'
import { trackEvent, trackVisitOnce } from '@/lib/analytics'

export const Route = createFileRoute('/')({
  component: ProductsIndex,
})

const categories: Array<Product['category'] | 'Todos'> = [
  'Todos',
  'Anéis',
  'Brincos',
  'Colares',
  'Pulseiras',
  'Tornozeleiras',
  'Conjuntos',
  'Outros',
]

function ProductsIndex() {
  const [overrides, setOverrides] = useState<CatalogOverrides>({})
  const [additions, setAdditions] = useState<CatalogAdditions>({})
  const [settings, setSettings] = useState<CatalogSettings>({ instagramUrl: 'https://www.instagram.com/trivellejoias/', whatsappNumber: '5519982124939', whatsappMessage: 'Olá! Vim pelo catálogo da Trivelle e gostaria de saber mais sobre as peças.' })
  useEffect(() => { trackVisitOnce(); loadCatalogOverrides().then(setOverrides); loadCatalogAdditions().then(setAdditions); loadCatalogSettings().then((s) => setSettings((prev) => ({ ...prev, ...s }))) }, [])

  const [activeCategory, setActiveCategory] = useState<
    (typeof categories)[number]
  >('Todos')

  const filtered = useMemo(() => {
    const baseProducts = [...products, ...Object.values(additions)]
    const available = baseProducts
      .map((p) => applyOverride(p, overrides))
      .filter((p) => (p.stock ?? 0) > 0)
      .filter((p) => !p.hidden && !p.deleted)
    return activeCategory === 'Todos' ? available : available.filter((p) => p.category === activeCategory)
  }, [activeCategory, overrides, additions])

  return (
    <div className="min-h-screen bg-[#fffdfc]">
      <header className="bg-[color:var(--color-brand)]">
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-24 text-center">
          <img
            src="/images/trivelle-logo-mark.png"
            alt="Trivelle"
            className="h-32 md:h-52 w-auto mx-auto"
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-14">
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2 rounded-full text-sm tracking-wide border transition-colors ${
                activeCategory === category
                  ? 'bg-[color:var(--color-brand-dark)] text-white border-[color:var(--color-brand-dark)]'
                  : 'border-[color:var(--color-brand)]/40 text-[color:var(--color-brand-dark)] hover:bg-[color:var(--color-brand-light)]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="group rounded-2xl border border-[color:var(--color-brand-light)] overflow-hidden bg-white hover:shadow-xl transition-shadow"
            >
              <Link
                to="/products/$productId"
                params={{ productId: product.id.toString() }}
                className="block"
              >
                <div className="w-full aspect-square overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Link>
              <div className="p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-brand-dark)]/70 mb-1">
                  {product.category}
                </p>
                <Link
                  to="/products/$productId"
                  params={{ productId: product.id.toString() }}
                >
                  <h2 className="font-display text-xl mb-2">{product.name}</h2>
                </Link>
                <p className="text-sm text-[color:var(--color-ink)]/70 mb-4 leading-relaxed">
                  {product.shortDescription}
                </p>
                <div className="flex items-center justify-between">
                  <div className="font-display text-lg font-semibold text-[color:var(--color-brand-dark)]">
                    {product.priceFrom ? 'A partir de ' : ''}R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <BuyButton
                    productId={product.id}
                    className="bg-[color:var(--color-brand)] text-white border-transparent hover:bg-[color:var(--color-brand-dark)]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <section className="max-w-5xl mx-auto px-6 pb-10">
        <div className="rounded-3xl bg-[color:var(--color-brand-light)] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="text-center md:text-left"><p className="font-display text-2xl">Fale com a Trivelle 💎</p><p className="text-sm opacity-70 mt-1">Acompanhe novidades ou fale com a gente pelo WhatsApp.</p></div>
          <div className="flex flex-wrap justify-center gap-3">
            {settings.instagramUrl && <a onClick={() => trackEvent({ type: 'instagram_click', path: window.location.pathname })} href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-white border border-[color:var(--color-brand)] text-sm font-medium hover:shadow-sm transition-shadow"><Instagram size={18} strokeWidth={1.8} /> Instagram</a>}
            {settings.whatsappNumber && <a onClick={() => trackEvent({ type: 'whatsapp_click', path: window.location.pathname })} href={whatsappHref(settings.whatsappNumber, settings.whatsappMessage)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-[color:var(--color-brand-dark)] text-white text-sm font-medium hover:opacity-95"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M20.52 3.48A11.8 11.8 0 0 0 12.04 0C5.52 0 .22 5.3.22 11.82c0 2.08.54 4.1 1.56 5.88L.1 24l6.45-1.65a11.78 11.78 0 0 0 5.49 1.36h.01c6.51 0 11.81-5.3 11.81-11.82 0-3.16-1.23-6.13-3.34-8.41ZM12.05 21.7h-.01a9.85 9.85 0 0 1-5.02-1.37l-.36-.21-3.83.98 1.02-3.73-.23-.38a9.85 9.85 0 1 1 8.43 4.71Zm5.4-7.4c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.95 1.18-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.68-2.08-.18-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.64-.93-2.25-.25-.6-.5-.52-.68-.53h-.58c-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.52s1.08 2.92 1.23 3.12c.15.2 2.12 3.24 5.13 4.54.72.31 1.28.5 1.72.64.72.23 1.37.2 1.88.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.17-1.43-.07-.12-.27-.2-.57-.35Z"/></svg> WhatsApp</a>}
          </div>
        </div>
      </section>
      <footer className="border-t border-[color:var(--color-brand-light)] py-10 text-center text-sm text-[color:var(--color-ink)]/60">
        © {new Date().getFullYear()} Trivelle — joias em aço inox que não escurecem.
      </footer>
    </div>
  )
}
