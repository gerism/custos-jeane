CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  usuario TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ingredientes: guarda o que foi pago por uma certa quantidade,
-- e o preço por unidade base é calculado (preco_pago / quantidade_comprada)
CREATE TABLE IF NOT EXISTS ingredientes (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  unidade TEXT NOT NULL CHECK (unidade IN ('g', 'kg', 'ml', 'l', 'un')),
  quantidade_comprada NUMERIC(12, 3) NOT NULL CHECK (quantidade_comprada > 0),
  preco_pago NUMERIC(12, 2) NOT NULL CHECK (preco_pago >= 0),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Produtos: as receitas (ex: "Bolo de chocolate P")
CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  preco_venda_sugerido NUMERIC(12, 2),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quais ingredientes e quanto de cada entram em um produto
CREATE TABLE IF NOT EXISTS produto_ingredientes (
  id SERIAL PRIMARY KEY,
  produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  ingrediente_id INTEGER NOT NULL REFERENCES ingredientes(id),
  quantidade NUMERIC(12, 3) NOT NULL CHECK (quantidade > 0)
);

-- Vendas: guarda o custo calculado no momento da venda (congelado),
-- assim se o preço do ingrediente mudar depois, vendas antigas não mudam
CREATE TABLE IF NOT EXISTS vendas (
  id SERIAL PRIMARY KEY,
  produto_id INTEGER REFERENCES produtos(id),
  descricao TEXT NOT NULL,
  quantidade NUMERIC(12, 3) NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  valor_recebido NUMERIC(12, 2) NOT NULL CHECK (valor_recebido >= 0),
  custo_calculado NUMERIC(12, 2) NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Despesas que não são ingrediente (gás, embalagem, entrega, etc)
CREATE TABLE IF NOT EXISTS despesas_extra (
  id SERIAL PRIMARY KEY,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Outros',
  valor NUMERIC(12, 2) NOT NULL CHECK (valor > 0),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendas_criado_em ON vendas (criado_em);
CREATE INDEX IF NOT EXISTS idx_despesas_criado_em ON despesas_extra (criado_em);
