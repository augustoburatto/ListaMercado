# Carrinho — a lista da casa

Lista de compras compartilhada: uma única lista, qualquer pessoa com o link vê e edita.
Site estático, feito para rodar no GitHub Pages.

- Marcar itens como comprados, com barra de progresso
- Quantidade e preço unitário → total estimado e quanto já foi pro carrinho
- **Modo mercado**: alvos de toque maiores, comprados vão pro fim da lista
- Botão de compartilhar (usa o compartilhamento nativo no celular)
- Sincroniza sozinho a cada poucos segundos, sem precisar recarregar
- Dá pra instalar na tela inicial do celular

---

## Por que precisa de um banco de dados

O GitHub Pages só serve arquivos, não roda servidor nem guarda nada. Para todo mundo
enxergar a **mesma** lista, os dados moram no [Supabase](https://supabase.com) — plano
gratuito, sem cartão. A chave usada aqui (`anon key`) é pública por design: ela só
consegue fazer o que as políticas do banco permitirem.

Se você abrir o site sem configurar nada, ele funciona igual, mas salvando só no seu
próprio navegador. Serve para testar.

---

## Passo 1 — Criar o banco (uns 5 minutos)

1. Crie uma conta em **supabase.com** e clique em **New project**.
   Escolha uma senha para o banco (você não vai precisar dela depois) e a região
   `South America (São Paulo)`. Espere uns 2 minutos até o projeto ficar pronto.

2. No menu lateral, abra **SQL Editor** → **New query**.

3. Abra o arquivo `supabase-schema.sql` deste projeto, copie **todo** o conteúdo,
   cole no editor e clique em **Run**. Deve aparecer "Success".

4. Vá em **Project Settings** (engrenagem) → **API**. Anote dois valores:
   - **Project URL** — algo como `https://abcdefghijk.supabase.co`
   - **anon public** — uma chave longa começando com `eyJ...`

> Copie a chave marcada como **anon / public**. A `service_role` nunca vai para o
> front-end: ela ignora todas as permissões.

## Passo 2 — Colar as chaves

Abra `config.js` e preencha:

```js
window.CONFIG = {
  SUPABASE_URL: "https://abcdefghijk.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  INTERVALO_SYNC: 4,
};
```

Abra o `index.html` no navegador. A faixa amarela deve sumir e o rodapé passa a
dizer "lista compartilhada".

## Passo 3 — Publicar no GitHub Pages

1. Crie um repositório novo no GitHub (pode ser público).

2. Suba os arquivos. Pelo site: **Add file → Upload files**, arraste tudo
   (mantendo a pasta `assets`) e confirme. Ou pelo terminal:

   ```bash
   cd carrinho
   git init
   git add .
   git commit -m "Lista de compras"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
   git push -u origin main
   ```

3. No repositório: **Settings → Pages**. Em *Source*, escolha
   **Deploy from a branch**, branch `main`, pasta `/ (root)`. Salve.

4. Em um ou dois minutos o site aparece em:
   `https://SEU-USUARIO.github.io/SEU-REPO/`

Esse é o link para mandar pra casa toda. Quem abrir vê a mesma lista e pode editar.

---

## Como está organizado

```
index.html              estrutura da página
config.js               ← o único arquivo que você edita
assets/styles.css       visual
assets/app.js           lógica: estado, sincronização, telas
assets/icone.svg        ícone do app
manifest.webmanifest    permite instalar na tela inicial
supabase-schema.sql     tabelas e permissões do banco
.nojekyll               impede o GitHub de processar os arquivos
```

## Ajustes comuns

**Trocar o nome da lista** — clique no título dentro do app. Ele fica salvo pra todos.

**Trocar as cores** — no topo de `assets/styles.css`, no bloco `:root`.
`--verde` é a cor principal; troque também a `theme-color` no `index.html`.

**Sincronizar mais rápido** — baixe `INTERVALO_SYNC` no `config.js`. Com 2 segundos
ainda sobra folga no plano gratuito para uso doméstico.

**Fechar a lista para estranhos** — o link é secreto, mas quem tiver ele edita.
Para restringir de verdade, é preciso ativar autenticação no Supabase e trocar as
políticas em `supabase-schema.sql` de `to anon` para `to authenticated`.

## Se algo der errado

**Faixa vermelha "não deu para falar com o servidor"**
Confira se a URL em `config.js` não terminou com `/`, se a chave é a `anon` e se o
SQL rodou até o fim. A mensagem entre parênteses vem direto do Supabase e costuma
dizer o que faltou.

**A página abre sem estilo no GitHub Pages**
A pasta `assets` não subiu junto, ou o arquivo `.nojekyll` ficou de fora.

**Item some depois de adicionar**
Sinal de que a política de escrita não foi criada. Rode `supabase-schema.sql`
de novo — ele é seguro de repetir.
