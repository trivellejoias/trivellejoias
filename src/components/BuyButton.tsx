import products from '@/data/products'

const WHATSAPP_NUMBER = '5519982124939'

export function BuyButton({
  productId,
  className = '',
}: {
  productId: number
  className?: string
}) {
  const product = products.find((item) => item.id === productId)

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
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center px-6 py-2 rounded-full border text-sm font-medium transition-colors ${className}`}
      aria-label={`Comprar ${product.name} pelo WhatsApp`}
    >
      Comprar pelo WhatsApp
    </a>
  )
}
