import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import products from '../../data/products'
import { BuyButton } from '@/components/BuyButton'
import { applyOverride, loadCatalogAdditions, loadCatalogOverrides, loadCatalogSettings, type CatalogSettings, whatsappHref } from '@/lib/catalog'
import { trackEvent, trackVisitOnce } from '@/lib/analytics'
import { InstagramIcon, WhatsAppIcon } from '@/components/SocialIcons'

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

function RouteComponent() {
  const product = Route.useLoaderData()
  const [selectedImage, setSelectedImage] = useState(0)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [showLogoEffect, setShowLogoEffect] = useState(true)
  const [settings, setSettings] = useState<CatalogSettings>({ instagramUrl: 'https://www.instagram.com/trivellejoias/', whatsappNumber: '5519982124939', whatsappMessage: 'Olá! Vim pelo catálogo da Trivelle e gostaria de saber mais sobre as peças.' })
  useEffect(() => {
    const timer = window.setTimeout(() => setShowLogoEffect(false), 850)
    return () => window.clearTimeout(timer)
  }, [])
  useEffect(() => { trackVisitOnce(); trackEvent({ type: 'product_view', productId: product.id, productName: product.name, category: product.category, path: window.location.pathname }); loadCatalogSettings().then((s) => setSettings((prev) => ({ ...prev, ...s }))) }, [product.id, product.name, product.category])

  return (
    <div className="min-h-screen bg-[#fffdfc]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 px-6 py-14">
        <div className="w-full md:w-1/2">
          <button
            type="button"
            onClick={() => setIsGalleryOpen(true)}
            className="relative block w-full aspect-square rounded-2xl overflow-hidden border border-[color:var(--color-brand-light)] bg-white shadow-sm cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
            aria-label="Ampliar fotos do produto"
          >
            <img
              src={product.images[selectedImage] || product.image}
              alt={`${product.name} — foto ${selectedImage + 1}`}
              className="w-full h-full object-contain transition-opacity duration-300"
            />
            {showLogoEffect && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center animate-[logoReveal_850ms_ease-out_forwards]">
                <img src="/images/trivelle-logo-mark.png" alt="" className="w-40 md:w-52 opacity-[0.10] blur-[0.2px]" />
              </div>
            )}
            {product.images.length > 1 && (
              <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
                Clique para ampliar · {selectedImage + 1}/{product.images.length}
              </span>
            )}
          </button>

          {product.images.length > 1 && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs opacity-55">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
              Toque na foto para ver as demais em tamanho grande
            </div>
          )}

          {isGalleryOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 md:p-8 backdrop-blur-[2px]"
              role="dialog"
              aria-modal="true"
              aria-label={`Galeria de fotos de ${product.name}`}
              onClick={() => setIsGalleryOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsGalleryOpen(false)}
                className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-4 py-2 text-lg shadow-lg hover:bg-white"
                aria-label="Fechar galeria"
              >
                ×
              </button>

              {product.images.length > 1 && (
                <button
                  type="button"
                  onClick={(event) => { event.stopPropagation(); setSelectedImage((selectedImage - 1 + product.images.length) % product.images.length) }}
                  className="absolute left-3 md:left-6 z-10 rounded-full bg-white/90 w-11 h-11 text-2xl shadow-lg hover:bg-white"
                  aria-label="Foto anterior"
                >
                  ‹
                </button>
              )}

              <div className="relative max-w-6xl max-h-[92vh] w-full h-full flex items-center justify-center" onClick={(event) => event.stopPropagation()}>
                <img
                  src={product.images[selectedImage] || product.image}
                  alt={`${product.name} — foto ${selectedImage + 1}`}
                  className="max-w-full max-h-full object-contain rounded-xl select-none"
                />
                {product.images.length > 1 && (
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/55 text-white px-3 py-1 text-xs">
                    {selectedImage + 1} / {product.images.length}
                  </span>
                )}
              </div>

              {product.images.length > 1 && (
                <button
                  type="button"
                  onClick={(event) => { event.stopPropagation(); setSelectedImage((selectedImage + 1) % product.images.length) }}
                  className="absolute right-3 md:right-6 z-10 rounded-full bg-white/90 w-11 h-11 text-2xl shadow-lg hover:bg-white"
                  aria-label="Próxima foto"
                >
                  ›
                </button>
              )}
            </div>
          )}

        <div className="w-full md:w-1/2">
          <Link
            to="/"
            className="inline-block mb-6 text-sm text-[color:var(--color-brand-dark)] hover:underline"
          >
            &larr; Voltar ao catálogo
          </Link>
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-brand-dark)]/70 mb-2">
            {product.category}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-4">
            {product.name}
          </h1>
          <p className="mb-8 leading-relaxed text-[color:var(--color-ink)]/80">
            {product.description}
          </p>
          <div className="flex items-center justify-between border-t border-[color:var(--color-brand-light)] pt-6">
            <div className="font-display text-2xl font-semibold text-[color:var(--color-brand-dark)]">
              {product.priceFrom ? 'A partir de ' : ''}R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <BuyButton
              productId={product.id}
              className="bg-[color:var(--color-brand)] text-white border-transparent hover:bg-[color:var(--color-brand-dark)] px-8 py-3"
            />
          </div>
          <p className="mt-6 text-xs text-[color:var(--color-ink)]/50">
            Aço inoxidável hipoalergênico · não escurece · resistente à água
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-14">
        <div className="rounded-3xl bg-[color:var(--color-brand-light)] p-6 flex items-center justify-center">
          <div className="flex flex-wrap justify-center gap-3">
            {settings.instagramUrl && <a onClick={() => trackEvent({ type: 'instagram_click', path: window.location.pathname })} href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-white border text-sm font-medium hover:shadow-sm transition-shadow"><InstagramIcon /> Instagram</a>}
            {settings.whatsappNumber && <a onClick={() => trackEvent({ type: 'whatsapp_click', productId: product.id, productName: product.name, path: window.location.pathname })} href={whatsappHref(settings.whatsappNumber, settings.whatsappMessage)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-[color:var(--color-brand-dark)] text-white text-sm font-medium hover:opacity-95"><WhatsAppIcon /> WhatsApp</a>}
          </div>
        </div>
      </div>
    </div>
  )
}
