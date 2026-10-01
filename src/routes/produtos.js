const express = require('express');
const pool = require('../db');
const { exigirLogin } = require('../middleware/auth');

const router = express.Router();
router.use(exigirLogin);

// Lista produtos com seus ingredientes e o custo total calculado
router.get('/', async (req, res) => {
  const produtos = await pool.query(
    `SELECT id, nome, preco_venda_sugerido FROM produtos ORDER BY nome ASC`
  );

  const itens = await pool.query(
    `SELECT pi.produto_id, pi.ingrediente_id, pi.quantidade,
            i.nome AS ingrediente_nome, i.unidade,
            ROUND(i.preco_pago / i.quantidade_comprada, 4) AS preco_unitario
     FROM produto_ingredientes pi
     JOIN ingredientes i ON i.id = pi.ingrediente_id`
  );

  const porProduto = {};
  itens.rows.forEach((item) => {
    if (!porProduto[item.produto_id]) porProduto[item.produto_id] = [];
    porProduto[item.produto_id].push(item);
  });

  const lista = produtos.rows.map((produto) => {
    const ingredientesDoProduto = porProduto[produto.id] || [];
    const custo = ingredientesDoProduto.reduce(
      (soma, item) => soma + Number(item.quantidade) * Number(item.preco_unitario),
      0
    );
    return {
      ...produto,
      custo_calculado: Math.round(custo * 100) / 100,
      ingredientes: ingredientesDoProduto,
    };
  });

  res.json(lista);
});

// Cria um produto novo com a lista de ingredientes usados
router.post('/', async (req, res) => {
  const { nome, preco_venda_sugerido, itens } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({ erro: 'Nome do produto é obrigatório' });
  }
  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ erro: 'Adicione pelo menos um ingrediente' });
  }

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const produto = await cliente.query(
      `INSERT INTO produtos (nome, preco_venda_sugerido) VALUES ($1, $2) RETURNING *`,
      [nome.trim(), preco_venda_sugerido ? Number(preco_venda_sugerido) : null]
    );

    for (const item of itens) {
      const quantidade = Number(item.quantidade);
      if (!item.ingrediente_id || !quantidade || quantidade <= 0) {
        throw new Error('Item de ingrediente inválido');
      }
      await cliente.query(
        `INSERT INTO produto_ingredientes (produto_id, ingrediente_id, quantidade)
         VALUES ($1, $2, $3)`,
        [produto.rows[0].id, item.ingrediente_id, quantidade]
      );
    }

    await cliente.query('COMMIT');
    res.status(201).json(produto.rows[0]);
  } catch (err) {
    await cliente.query('ROLLBACK');
    res.status(400).json({ erro: 'Não foi possível salvar o produto' });
  } finally {
    cliente.release();
  }
});

// Remove um produto (e seus ingredientes associados)
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM produtos WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
