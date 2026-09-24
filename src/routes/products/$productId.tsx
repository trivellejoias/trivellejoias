import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import products from '../../data/products'
import { BuyButton } from '@/components/BuyButton'
import { applyOverride, loadCatalogAdditions, loadCatalogOverrides, loadCatalogSettings, type CatalogSettings, whatsappHref } from '@/lib/catalog'
import { trackEvent, trackVisitOnce } from '@/lib/analytics'

export const Route = createFileRoute('/products/$productId')({
  component: RouteComponent,
  loader: async ({ params }) => {
    const additions = await loadCatalogAdditions()
    const baseProducts = [...products, ...Object.values(additions)]
    const product = baseProducts.find((product) => product.id === +params.productId)
    if (!product) throw new Error('Product not found')
    const overrides = await loadCatalogOverrides()
    const merged = applyOverride(product, overrides)
    if (merged.hidden || merged.deleted || (merged.stock ?? 0) <= 0) throw new Error('Product not found')
    return merged
  },
})

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M20.5 3.5A11.8 11.8 0 0 0 12.05 0C5.52 0 .22 5.3.22 11.82c0 2.08.54 4.1 1.56 5.88L.1 24l6.45-1.65a11.78 11.78 0 0 0 5.49 1.36h.01c6.51 0 11.81-5.3 11.81-11.82 0-3.16-1.23-6.13-3.36-8.39ZM12.05 21.7h-.01a9.85 9.85 0 0 1-5.02-1.37l-.36-.21-3.83.98 1.02-3.73-.23-.38a9.85 9.85 0 1 1 8.43 4.71Zm5.4-7.4c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.95 1.18-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.68-2.08-.18-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.64-.93-2.25-.25-.6-.5-.52-.68-.53h-.58c-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.52s1.08 2.92 1.23 3.12c.15.2 2.12 3.24 5.13 4.54.72.31 1.28.5 1.72.64.72.23 1.37.2 1.88.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.17-1.43-.07-.12-.27-.2-.57-.35Z" />
    </svg>
  )
}

function RouteComponent() {
  const product = Route.useLoaderData()
  const [selectedImage, setSelectedImage] = useState(0)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [showLogoEffect, setShowLogoEffect] = useState(true)
  const [settings, setSettings] = useState<CatalogSettings>({
    instagramUrl: 'https://www.instagram.com/trivellejoias/',
    whatsappNumber: '5519982124939',
    whatsappMessage: 'Olá! Vim pelo catálogo da Trivelle e gostaria de saber mais sobre as peças.',
  })

  useEffect(() => {
    const timer = window.setTimeout(() => setShowLogoEffect(false), 850)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    trackVisitOnce()
    trackEvent({ type: 'product_view', productId: product.id, productName: product.name, category: product.category, path: window.location.pathname })
    loadCatalogSettings().then((saved) => setSettings((prev) => ({ ...prev, ...saved })))
  }, [product.id, product.name, product.category])

  useEffect(() => {
    if (!galleryOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setGalleryOpen(false)
      if (event.key === 'ArrowLeft' && product.images.length > 1) setSelectedImage((value) => (value - 1 + product.images.length) % product.images.length)
      if (event.key === 'ArrowRight' && product.images.length > 1) setSelectedImage((value) => (value + 1) % product.images.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [galleryOpen, product.images.length])

  const openGallery = () => {
    setSelectedImage(0)
    setGalleryOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#fffdfc]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 px-6 py-14">
        <div className="w-full md:w-1/2">
          <button
            type="button"
            onClick={openGallery}
            className="relative block w-full aspect-square rounded-2xl overflow-hidden border border-[color:var(--color-brand-light)] bg-white shadow-sm cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
            aria-label="Ampliar fotos do produto"
          >
            <img src={product.images[selectedImage] || product.image} alt={product.name} className="w-full h-full object-contain transition-opacity duration-300" />
            {showLogoEffect && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center animate-[logoReveal_850ms_ease-out_forwards]">
                <img src="/images/trivelle-logo-mark.png" alt="" className="w-40 md:w-52 opacity-[0.10] blur-[0.2px]" />
              </div>
            )}
            {product.images.length > 1 && (
              <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
                Ampliar fotos · 1/{product.images.length}
              </span>
            )}
          </button>

          {galleryOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 md:p-8" role="dialog" aria-modal="true" aria-label={`Galeria de fotos de ${product.name}`} onClick={() => setGalleryOpen(false)}>
              <button type="button" onClick={() => setGalleryOpen(false)} className="absolute right-4 top-4 z-10 rounded-full bg-white/90 w-11 h-11 text-2xl shadow-lg hover:bg-white" aria-label="Fechar galeria">×</button>
              {product.images.length > 1 && <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedImage((value) => (value - 1 + product.images.length) % product.images.length) }} className="absolute left-3 md:left-6 z-10 rounded-full bg-white/90 w-11 h-11 text-2xl shadow-lg hover:bg-white" aria-label="Foto anterior">‹</button>}
              <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center" onClick={(event) => event.stopPropagation()}>
                <img src={product.images[selectedImage] || product.image} alt={`${product.name} — foto ${selectedImage + 1}`} className="max-w-full max-h-full object-contain rounded-xl" />
                {product.images.length > 1 && <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/55 text-white px-3 py-1 text-xs">{selectedImage + 1} / {product.images.length}</span>}
              </div>
              {product.images.length > 1 && <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedImage((value) => (value + 1) % product.images.length) }} className="absolute right-3 md:right-6 z-10 rounded-full bg-white/90 w-11 h-11 text-2xl shadow-lg hover:bg-white" aria-label="Próxima foto">›</button>}
            </div>
          )}
        </div>

        <div className="w-full md:w-1/2">
          <Link to="/" className="inline-block mb-6 text-sm text-[color:var(--color-brand-dark)] hover:underline">&larr; Voltar ao catálogo</Link>
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-brand-dark)]/70 mb-2">{product.category}</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-4">{product.name}</h1>
          <p className="mb-8 leading-relaxed text-[color:var(--color-ink)]/80">{product.description}</p>
          <div className="flex items-center justify-between border-t border-[color:var(--color-brand-light)] pt-6">
            <div className="font-display text-2xl font-semibold text-[color:var(--color-brand-dark)]">{product.priceFrom ? 'A partir de ' : ''}R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <BuyButton productId={product.id} className="bg-[color:var(--color-brand)] text-white border-transparent hover:bg-[color:var(--color-brand-dark)] px-8 py-3" />
          </div>
          <p className="mt-6 text-xs text-[color:var(--color-ink)]/50">Aço inoxidável hipoalergênico · não escurece · resistente à água</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-14">
        <div className="rounded-3xl bg-[color:var(--color-brand-light)] p-6 flex items-center justify-center">
          <div className="flex flex-wrap justify-center gap-3">
            {settings.instagramUrl && <a onClick={() => trackEvent({ type: 'instagram_click', path: window.location.pathname })} href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram da Trivelle" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-white border text-sm font-medium"><InstagramIcon /> Instagram</a>}
            {settings.whatsappNumber && <a onClick={() => trackEvent({ type: 'whatsapp_click', productId: product.id, productName: product.name, path: window.location.pathname })} href={whatsappHref(settings.whatsappNumber, settings.whatsappMessage)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp da Trivelle" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-[color:var(--color-brand-dark)] text-white text-sm font-medium"><WhatsAppIcon /> WhatsApp</a>}
          </div>
        </div>
      </div>
    </div>
  )
}
