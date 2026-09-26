# Trivelle Joias — Cloudflare

Esta versão está preparada para Cloudflare Workers + TanStack Start + D1.

## Configuração necessária no Cloudflare

O Worker precisa destas configurações:

- D1 binding: **DB** apontando para o banco D1 da Trivelle.
- Secret: **ADMIN_PASSWORD** com a senha usada no painel `/admin`.

O código cria automaticamente a tabela `catalog` na primeira chamada ao catálogo, se ela ainda não existir.

## O que foi corrigido nesta versão

- Login administrativo usando `ADMIN_PASSWORD` do ambiente Cloudflare.
- Rotas `/admin-auth`, `/catalog-data` e `/analytics` registradas no TanStack Router.
- Catálogo, painel administrativo e estatísticas sem endpoints Netlify.
- Salvamento de alterações, configurações e novos produtos no D1.
- Estatísticas armazenadas no mesmo D1, sem Netlify Blobs.
- Dependências específicas da Netlify removidas.
- Configuração Vite usando `@cloudflare/vite-plugin`.
- Compatibilidade com `wrangler.jsonc`.

## Uso

Depois de conectar o repositório ao Cloudflare Workers, faça o deploy.

Acesse:

`/admin`

e entre com a senha definida no secret `ADMIN_PASSWORD`.
