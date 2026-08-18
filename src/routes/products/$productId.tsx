import { Link, createFileRoute } from '@tanstack/react-router'
import products from '../../data/products'
import { BuyButton } from '@/components/BuyButton'

export const Route = createFileRoute('/products/$productId')({
  component: RouteComponent,
  loader: async ({ params }) => {
    const product = products.find(
      (product) => product.id === +params.productId,
    )
    if (!product) {
      throw new Error('Product not found')
    }
    return product
  },
})

function RouteComponent() {
  const product = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-[#fffdfc]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 px-6 py-14">
        <div className="w-full md:w-1/2">
          <div className="aspect-square rounded-2xl overflow-hidden border border-[color:var(--color-brand-light)]">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
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
              R$ {product.price.toLocaleString('pt-BR')}
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
    </div>
  )
}
