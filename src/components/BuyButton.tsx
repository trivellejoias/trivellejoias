import products from '@/data/products'
import { useEffect, useState } from 'react'
import { applyOverride, loadCatalogAdditions, loadCatalogOverrides, loadCatalogSettings, type CatalogSettings, type ProductOverride } from '@/lib/catalog'
import { trackEvent } from '@/lib/analytics'

const WHATSAPP_NUMBER = '5519982124939'

export function BuyButton({
  productId,
  className = '',
}: {
  productId: number
  className?: string
}) {
  const baseProduct = products.find((item) => item.id === productId)
  const [override, setOverride] = useState<ProductOverride>({})
  const [addition, setAddition] = useState<typeof products[number] | null>(null)
  const [settings, setSettings] = useState<CatalogSettings>({ whatsappNumber: WHATSAPP_NUMBER })
  useEffect(() => {
    Promise.all([loadCatalogOverrides(), loadCatalogAdditions(), loadCatalogSettings()]).then(([all, additions, remoteSettings]) => {
      setOverride(all[String(productId)] ?? {})
      setAddition(additions[String(productId)] ?? null)
      setSettings((prev) => ({ ...prev, ...remoteSettings }))
    })
  }, [productId])
  const sourceProduct = baseProduct ?? addition
  const product = sourceProduct ? applyOverride(sourceProduct, { [String(productId)]: override }) : null

  if (!product) return null

  const priceLabel = `${product.priceFrom ? 'a partir de ' : ''}R$ ${product.price.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
  })}`

  const message = [
    'Olá! 💎',
    '',
    `Tenho interesse na peça: ${product.name}`,
    `Valor: ${priceLabel}`,
    '',
    'Gostaria de saber como posso comprar.',
  ].join('\n')

  const whatsappNumber = settings.whatsappNumber || WHATSAPP_NUMBER
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`

  return (
    <a
      href={whatsappUrl}
      onClick={() => trackEvent({ type: 'whatsapp_click', productId, productName: product.name })}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 px-6 py-2 rounded-full border text-sm font-medium transition-colors ${className}`}
      aria-label={`Comprar ${product.name} pelo WhatsApp`}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M20.52 3.48A11.8 11.8 0 0 0 12.04 0C5.52 0 .22 5.3.22 11.82c0 2.08.54 4.1 1.56 5.88L.1 24l6.45-1.65a11.78 11.78 0 0 0 5.49 1.36h.01c6.51 0 11.81-5.3 11.81-11.82 0-3.16-1.23-6.13-3.34-8.41ZM12.05 21.7h-.01a9.85 9.85 0 0 1-5.02-1.37l-.36-.21-3.83.98 1.02-3.73-.23-.38a9.85 9.85 0 1 1 8.43 4.71Zm5.4-7.4c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.95 1.18-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.68-2.08-.18-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.64-.93-2.25-.25-.6-.5-.52-.68-.53h-.58c-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.52s1.08 2.92 1.23 3.12c.15.2 2.12 3.24 5.13 4.54.72.31 1.28.5 1.72.64.72.23 1.37.2 1.88.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.17-1.43-.07-.12-.27-.2-.57-.35Z"/></svg>Comprar pelo WhatsApp
    </a>
  )
}
