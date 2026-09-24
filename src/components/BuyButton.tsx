import products from '@/data/products'
import { useEffect, useState } from 'react'
import { applyOverride, loadCatalogOverrides, type ProductOverride } from '@/lib/catalog'
import { trackEvent } from '@/lib/analytics'
import { WhatsAppIcon } from '@/components/SocialIcons'

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
  useEffect(() => { loadCatalogOverrides().then((all) => setOverride(all[String(productId)] ?? {})) }, [productId])
  const product = baseProduct ? applyOverride(baseProduct, { [String(productId)]: override }) : null

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

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`

  return (
    <a
      href={whatsappUrl}
      onClick={() => trackEvent({ type: 'whatsapp_click', productId, productName: product.name })}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 px-6 py-2 rounded-full border text-sm font-medium transition-colors ${className}`}
      aria-label={`Comprar ${product.name} pelo WhatsApp`}
    >
      <WhatsAppIcon className="h-5 w-5" />
      Comprar pelo WhatsApp
    </a>
  )
}
