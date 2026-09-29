# Configuração do Trivelle no Cloudflare

Este projeto é configurado diretamente para Cloudflare Workers.

## 1. Instale

```bash
npm install
```

## 2. Crie o KV

No Cloudflare:

**Workers & Pages → KV → Create namespace**

Pode usar um nome como `trivelle-catalog`.

## 3. Ligue o KV ao Worker

No Worker `trivellejoias`:

**Settings → Bindings → Add → KV namespace**

Use exatamente:

- Variable name: `CATALOG_KV`
- KV namespace: o namespace criado no passo anterior

Depois faça um novo deploy.

## 4. Crie a senha do painel

Em:

**Settings → Variables and Secrets → Add → Secret**

Nome:

`ADMIN_PASSWORD`

Valor: escolha sua senha.

O arquivo `wrangler.jsonc` declara essa secret como obrigatória, então o deploy avisa se ela estiver faltando.

## 5. Faça o deploy

```bash
npm run deploy
```

Depois abra:

`/admin`

## 6. Teste o salvamento

Entre no painel, altere o preço de um produto e clique em **Salvar alterações**.

Depois recarregue a página. Se o preço continuar alterado, o KV está funcionando.

### Observação sobre fotos

As fotos escolhidas no painel são convertidas para WebP e guardadas junto dos dados do produto. Para catálogos muito grandes, o ideal é migrar as imagens para Cloudflare R2; para o catálogo atual, o painel já faz redução das imagens antes de salvá-las.


## 7. Importante: publicação

Este projeto é um aplicativo full-stack TanStack Start e deve ser publicado como **Cloudflare Worker**. O comando `npm run deploy` usa o Wrangler e publica o Worker. Não é necessário configurar outra hospedagem.

## 8. Se o Admin mostrar erro de armazenamento

Isso significa que o Worker não encontrou o binding `CATALOG_KV`. A senha `ADMIN_PASSWORD` e o KV são configurações do ambiente do Cloudflare e não devem ser gravados dentro do ZIP. Depois de criar/vincular o KV e fazer novo deploy, use **Verificar novamente** no painel.
