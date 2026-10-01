import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import products from '@/data/products'
import { BuyButton } from '@/components/BuyButton'
import { applyOverride, loadCatalogOverrides, loadCatalogSettings, type CatalogSettings, whatsappHref } from '@/lib/catalog'

export const Route = createFileRoute('/products/$productId')({
  component: RouteComponent,
  loader: async ({ params }) => {
    const product = products.find((product) => product.id === +params.productId)
    if (!product) throw new Error('Product not found')
    const overrides = await loadCatalogOverrides()
    const merged = applyOverride(product, overrides)
    if (merged.hidden || merged.deleted || (merged.stock ?? 0) <= 0) throw new Error('Product not found')
    return merged
  },
})

function RouteComponent() {
  const product = Route.useLoaderData()
  const [settings, setSettings] = useState<CatalogSettings>({ instagramUrl: 'https://www.instagram.com/trivellejoias/', whatsappNumber: '5519982124939', whatsappMessage: 'Olá! Vim pelo catálogo da Trivelle e gostaria de saber mais sobre as peças.' })
  useEffect(() => { loadCatalogSettings().then((s) => setSettings((prev) => ({ ...prev, ...s }))) }, [])

  return (
    <div className="min-h-screen bg-[#fffdfc]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 px-6 py-14">
        <div className="w-full md:w-1/2">
          <div className="aspect-square rounded-2xl overflow-hidden border border-[color:var(--color-brand-light)] bg-white">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3 mt-3">
              {product.images.slice(0, 4).map((image, index) => (
                <div
                  key={image}
                  className="aspect-square rounded-xl overflow-hidden border border-[color:var(--color-brand-light)] bg-white"
                >
                  <img
                    src={image}
                    alt={`${product.name} — foto ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

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
        <div className="rounded-3xl bg-[color:var(--color-brand-light)] p-6 flex flex-wrap items-center justify-between gap-4">
          <div><p className="font-display text-xl">Gostou da peça?</p><p className="text-sm opacity-70">Fale com a Trivelle ou acompanhe nosso Instagram.</p></div>
          <div className="flex gap-3">
            {settings.instagramUrl && <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="rounded-full px-5 py-2.5 bg-white border text-sm font-medium">◎ Instagram</a>}
            {settings.whatsappNumber && <a href={whatsappHref(settings.whatsappNumber, settings.whatsappMessage)} target="_blank" rel="noopener noreferrer" className="rounded-full px-5 py-2.5 bg-[color:var(--color-brand-dark)] text-white text-sm font-medium">☏ WhatsApp</a>}
          </div>
        </div>
      </div>
    </div>
  )
}
