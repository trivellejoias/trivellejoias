# Trivelle — Catálogo de Joias

Catálogo online da Trivelle, marca de joias em aço inoxidável que não escurecem. O site apresenta anéis, brincos, colares e pulseiras organizados por categoria, com página de detalhe por produto e checkout via Stripe.

## Tecnologias

- [TanStack Start](https://tanstack.com/start) (React 19 + TanStack Router)
- Vite 7
- Tailwind CSS 4
- Stripe Checkout (opcional, via `STRIPE_SECRET_KEY`)
- Deploy na Netlify

## Rodando localmente

```bash
npm install
npm run dev
```

O site fica disponível em `http://localhost:3000`.

Para habilitar o checkout com Stripe, defina a variável de ambiente `STRIPE_SECRET_KEY`. Sem essa variável, o botão de compra aparece desabilitado.

## Estrutura

- `src/data/products.ts` — catálogo de produtos (nome, categoria, preço, descrição, imagem)
- `src/routes/index.tsx` — página inicial com filtro por categoria
- `src/routes/products/$productId.tsx` — página de detalhe do produto
- `public/products/` — imagens ilustrativas das peças
- `public/images/trivelle-logo.png` — identidade visual da marca
