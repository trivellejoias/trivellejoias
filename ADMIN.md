# Área administrativa da Trivelle

A área `/admin` é protegida por uma senha verificada por uma Netlify Function.

Antes do primeiro uso, na Netlify abra **Project configuration → Environment variables** e crie:
- Nome: `ADMIN_PASSWORD`
- Valor: uma senha forte escolhida por você.

Depois de salvar a variável, faça um novo deploy (o próximo commit já fará isso).

A opção de edição não aparece no catálogo público. Para entrar, acesse manualmente:
`https://trivellejoias.netlify.app/admin`
