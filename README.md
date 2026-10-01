# Custos da Confeitaria

App web pra sua irmã controlar os custos dos ingredientes, montar as receitas dos
produtos, registrar as vendas e ver o lucro por dia e por mês. Acessa pelo navegador,
no computador ou no celular.

## Como funciona

1. **Ingredientes**: cadastra o que ela compra, com o preço pago por aquela quantidade
   (ex: "Farinha de trigo, 1kg, R$ 5,50"). O sistema calcula sozinho o preço por grama.
2. **Produtos**: monta a receita de cada produto escolhendo os ingredientes e quanto de
   cada um entra (na mesma unidade que foi cadastrada o ingrediente). O custo do produto
   é calculado automaticamente.
3. **Vendas**: quando ela vende um produto, escolhe ele na lista, informa a quantidade e
   quanto recebeu. O sistema já sabe o custo (da receita) e calcula o lucro daquela
   venda. Também dá pra lançar uma venda avulsa (sem produto cadastrado).
4. **Despesas**: pra gastos que não são ingrediente (gás, embalagem, entrega).
5. **Resumo**: mostra receita, custo total (ingredientes das vendas + despesas) e lucro,
   por dia e por mês.

## Rodando local (pra testar antes de subir)

1. `npm install`
2. Copie `.env.example` pra `.env` e preencha `DATABASE_URL`.
3. `npm run migrate` — cria as tabelas.
4. `node src/create-user.js jeane suasenha123` — cria o usuário de login.
5. `npm start` — sobe em `http://localhost:3000`.

## Deploy no Railway

1. Crie um projeto novo no Railway, conectado ao repositório do GitHub.
2. Adicione um banco **PostgreSQL** no mesmo projeto.
3. Em **Variables** do serviço do app, adicione `JWT_SECRET` com um texto aleatório.
4. Rode a migração uma vez: `railway link` e depois `railway run npm run migrate`
   (ou, se der erro de rede local, habilite o acesso público do Postgres temporariamente
   e rode `npm run migrate` direto, como fizemos no Controle Caixa Pedro).
5. Crie o usuário: `railway run node src/create-user.js jeane suasenha123`.
6. Gere o domínio público em Settings → Networking → Generate Domain, e abre no
   navegador do computador e do celular.

## Estrutura

```
src/
  index.js                servidor Express
  db.js                   conexão com o PostgreSQL
  migrate.js              roda o migrations/001_init.sql
  create-user.js          cria usuário de login
  middleware/auth.js      confere login
  routes/auth.js          login, logout, trocar senha
  routes/ingredientes.js  cadastro de ingredientes e preço unitário
  routes/produtos.js      receitas (produto + ingredientes) e custo calculado
  routes/vendas.js        vendas, despesas extras e resumos (dia/mês)
public/
  login.html / painel.html   telas
  css/style.css               visual
  js/login.js / painel.js     lógica de cada tela (painel com abas)
migrations/001_init.sql       cria as tabelas
```
