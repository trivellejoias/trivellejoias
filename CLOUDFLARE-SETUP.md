# Configuração do Trivelle no Cloudflare

Esta versão corrige a compatibilidade das dependências TanStack/Cloudflare e deixa o erro do armazenamento explícito.

## 1. KV obrigatório

Crie ou use um namespace **Workers KV** no Cloudflare.

O Worker precisa de um binding com o nome exato:

- `CATALOG_KV`

O binding deve apontar para o namespace KV do catálogo.

> Importante: o binding é uma configuração do Worker e precisa existir na versão publicada. Se você o criou pelo painel do Cloudflare, clique em **Deploy** depois de salvar a configuração.

## 2. Senha

Em **Settings → Variables and Secrets**, mantenha:

- Nome: `ADMIN_PASSWORD`
- Tipo: **Secret**
- Valor: sua senha do painel

Depois de alterar a senha, publique uma nova versão.

## 3. Deploy

No Cloudflare:

- Build command: `pnpm run build`
- Deploy command: `npx wrangler deploy`

Ou, localmente:

```bash
npm install
npm run deploy
```

## 4. Teste

Abra:

`/admin`

Entre com a senha e altere um preço. Clique em **Salvar alterações** e depois em **Recarregar**.

Se o KV não estiver disponível, o painel mostrará claramente que o problema é o `CATALOG_KV`, em vez de apresentar apenas “verifique sua conexão”.
