# Trivelle Joias — Cloudflare

Esta versão está preparada para Cloudflare Workers + TanStack Start + Workers KV.

## Configuração necessária no Cloudflare

O Worker precisa destas configurações:

- Workers KV binding: **CATALOG_KV** apontando para o namespace KV do catálogo.
- Secret: **ADMIN_PASSWORD** com a senha usada no painel `/admin`.


## O que foi corrigido nesta versão

- Login administrativo usando `ADMIN_PASSWORD` do ambiente Cloudflare.
- Rotas `/admin-auth`, `/catalog-data` e `/analytics` registradas no TanStack Router.
- Catálogo, painel administrativo e estatísticas sem Netlify.
- Salvamento de alterações, configurações, novos produtos e estatísticas no Workers KV.
- Estatísticas armazenadas no mesmo KV, sem Netlify.
- Dependências específicas da Netlify removidas.
- Configuração Vite usando `@cloudflare/vite-plugin`.
- Compatibilidade com `wrangler.jsonc`.

## Uso

Depois de conectar o repositório ao Cloudflare Workers, faça o deploy.

Acesse:

`/admin`

e entre com a senha definida no secret `ADMIN_PASSWORD`.
