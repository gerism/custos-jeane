const express = require('express');
const pool = require('../db');
const { exigirLogin } = require('../middleware/auth');

const router = express.Router();
router.use(exigirLogin);

// Registra uma venda; se for de um produto cadastrado, calcula e "congela" o custo
router.post('/', async (req, res) => {
  const { produto_id, descricao, quantidade, valor_recebido } = req.body;

  const qtd = Number(quantidade) || 1;
  const valor = Number(valor_recebido);
  if (!valor || valor <= 0) {
    return res.status(400).json({ erro: 'Valor recebido inválido' });
  }

  let descricaoFinal = descricao && descricao.trim();
  let custoCalculado = 0;

  if (produto_id) {
    const itens = await pool.query(
      `SELECT pi.quantidade, i.preco_pago, i.quantidade_comprada, p.nome AS produto_nome
       FROM produto_ingredientes pi
       JOIN ingredientes i ON i.id = pi.ingrediente_id
       JOIN produtos p ON p.id = pi.produto_id
       WHERE pi.produto_id = $1`,
      [produto_id]
    );

    if (itens.rows.length === 0) {
      return res.status(400).json({ erro: 'Produto não encontrado ou sem ingredientes' });
    }

    const custoUnitario = itens.rows.reduce(
      (soma, item) =>
        soma + Number(item.quantidade) * (Number(item.preco_pago) / Number(item.quantidade_comprada)),
      0
    );
    custoCalculado = custoUnitario * qtd;
    if (!descricaoFinal) descricaoFinal = itens.rows[0].produto_nome;
  }

  if (!descricaoFinal) {
    return res.status(400).json({ erro: 'Descrição é obrigatória para vendas avulsas' });
  }

  const resultado = await pool.query(
    `INSERT INTO vendas (produto_id, descricao, quantidade, valor_recebido, custo_calculado)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [produto_id || null, descricaoFinal, qtd, valor, Math.round(custoCalculado * 100) / 100]
  );

  res.status(201).json(resultado.rows[0]);
});

// Lista vendas de um dia
router.get('/', async (req, res) => {
  const data = req.query.data || new Date().toISOString().slice(0, 10);
  const resultado = await pool.query(
    `SELECT id, descricao, quantidade, valor_recebido, custo_calculado, criado_em
     FROM vendas WHERE criado_em::date = $1::date ORDER BY criado_em DESC`,
    [data]
  );
  res.json(resultado.rows);
});

// Registra uma despesa que não é ingrediente (gás, embalagem, entrega...)
router.post('/despesas', async (req, res) => {
  const { descricao, categoria, valor } = req.body;
  const valorNumero = Number(valor);

  if (!descricao || !descricao.trim()) {
    return res.status(400).json({ erro: 'Descrição é obrigatória' });
  }
  if (!valorNumero || valorNumero <= 0) {
    return res.status(400).json({ erro: 'Valor inválido' });
  }

  const resultado = await pool.query(
    `INSERT INTO despesas_extra (descricao, categoria, valor) VALUES ($1, $2, $3) RETURNING *`,
    [descricao.trim(), categoria || 'Outros', valorNumero]
  );
  res.status(201).json(resultado.rows[0]);
});

// Lista despesas extras de um dia
router.get('/despesas/lista', async (req, res) => {
  const data = req.query.data || new Date().toISOString().slice(0, 10);
  const resultado = await pool.query(
    `SELECT id, descricao, categoria, valor, criado_em
     FROM despesas_extra WHERE criado_em::date = $1::date ORDER BY criado_em DESC`,
    [data]
  );
  res.json(resultado.rows);
});

// Resumo do dia: receita, custo (ingredientes das vendas + despesas extras) e lucro
router.get('/resumo/dia', async (req, res) => {
  const data = req.query.data || new Date().toISOString().slice(0, 10);

  const vendas = await pool.query(
    `SELECT COALESCE(SUM(valor_recebido), 0) AS receita, COALESCE(SUM(custo_calculado), 0) AS custo_ingredientes
     FROM vendas WHERE criado_em::date = $1::date`,
    [data]
  );
  const despesas = await pool.query(
    `SELECT COALESCE(SUM(valor), 0) AS total FROM despesas_extra WHERE criado_em::date = $1::date`,
    [data]
  );

  const receita = Number(vendas.rows[0].receita);
  const custoIngredientes = Number(vendas.rows[0].custo_ingredientes);
  const despesaExtra = Number(despesas.rows[0].total);
  const custoTotal = custoIngredientes + despesaExtra;

  res.json({
    data,
    receita,
    custo_ingredientes: custoIngredientes,
    despesa_extra: despesaExtra,
    custo_total: custoTotal,
    lucro: receita - custoTotal,
  });
});

// Resumo do mês
router.get('/resumo/mes', async (req, res) => {
  const hoje = new Date();
  const ano = Number(req.query.ano) || hoje.getFullYear();
  const mes = Number(req.query.mes) || hoje.getMonth() + 1;

  const vendas = await pool.query(
    `SELECT COALESCE(SUM(valor_recebido), 0) AS receita, COALESCE(SUM(custo_calculado), 0) AS custo_ingredientes
     FROM vendas
     WHERE EXTRACT(YEAR FROM criado_em) = $1 AND EXTRACT(MONTH FROM criado_em) = $2`,
    [ano, mes]
  );
  const despesas = await pool.query(
    `SELECT COALESCE(SUM(valor), 0) AS total FROM despesas_extra
     WHERE EXTRACT(YEAR FROM criado_em) = $1 AND EXTRACT(MONTH FROM criado_em) = $2`,
    [ano, mes]
  );

  const receita = Number(vendas.rows[0].receita);
  const custoIngredientes = Number(vendas.rows[0].custo_ingredientes);
  const despesaExtra = Number(despesas.rows[0].total);
  const custoTotal = custoIngredientes + despesaExtra;

  res.json({
    ano,
    mes,
    receita,
    custo_ingredientes: custoIngredientes,
    despesa_extra: despesaExtra,
    custo_total: custoTotal,
    lucro: receita - custoTotal,
  });
});

module.exports = router;
