import { useEffect, useState } from 'react'
import { createCheckoutSession, getStripeEnabled } from '@/lib/stripe'

export function BuyButton({
  productId,
  className = '',
}: {
  productId: number
  className?: string
}) {
  const [loading, setLoading] = useState(false)
  const [stripeEnabled, setStripeEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    getStripeEnabled().then(setStripeEnabled)
  }, [])

  const handleClick = async () => {
    setLoading(true)
    try {
      const url = await createCheckoutSession({ data: productId })
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setLoading(false)
    }
  }

  if (stripeEnabled === false) {
    return (
      <button
        disabled
        className={`px-6 py-2 rounded-full border text-sm font-medium ${className}`}
        title="Compra indisponível"
      >
        Indisponível
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading || stripeEnabled === null}
      className={`px-6 py-2 rounded-full border text-sm font-medium transition-colors disabled:cursor-wait disabled:opacity-70 ${className}`}
    >
      {loading ? 'Processando...' : 'Comprar'}
    </button>
  )
}
