import { useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import products, { type Product } from '@/data/products'
import { BuyButton } from '@/components/BuyButton'

export const Route = createFileRoute('/')({
  component: ProductsIndex,
})

const categories: Array<Product['category'] | 'Todos'> = [
  'Todos',
  'Anéis',
  'Brincos',
  'Colares',
  'Pulseiras',
]

function ProductsIndex() {
  const [activeCategory, setActiveCategory] = useState<
    (typeof categories)[number]
  >('Todos')

  const filtered = useMemo(
    () =>
      activeCategory === 'Todos'
        ? products
        : products.filter((p) => p.category === activeCategory),
    [activeCategory],
  )

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
                    R$ {product.price.toLocaleString('pt-BR')}
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

      <footer className="border-t border-[color:var(--color-brand-light)] py-10 text-center text-sm text-[color:var(--color-ink)]/60">
        © {new Date().getFullYear()} Trivelle — joias em aço inox que não escurecem.
      </footer>
    </div>
  )
}
