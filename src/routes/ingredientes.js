const express = require('express');
const pool = require('../db');
const { exigirLogin } = require('../middleware/auth');

const router = express.Router();
router.use(exigirLogin);

// Lista todos os ingredientes, já com o preço por unidade calculado
router.get('/', async (req, res) => {
  const resultado = await pool.query(
    `SELECT id, nome, unidade, quantidade_comprada, preco_pago,
            ROUND(preco_pago / quantidade_comprada, 4) AS preco_unitario
     FROM ingredientes
     ORDER BY nome ASC`
  );
  res.json(resultado.rows);
});

// Cadastra um ingrediente novo
router.post('/', async (req, res) => {
  const { nome, unidade, quantidade_comprada, preco_pago } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({ erro: 'Nome é obrigatório' });
  }
  if (!['g', 'kg', 'ml', 'l', 'un'].includes(unidade)) {
    return res.status(400).json({ erro: 'Unidade inválida' });
  }
  const qtd = Number(quantidade_comprada);
  const preco = Number(preco_pago);
  if (!qtd || qtd <= 0) {
    return res.status(400).json({ erro: 'Quantidade comprada inválida' });
  }
  if (preco === undefined || preco < 0 || Number.isNaN(preco)) {
    return res.status(400).json({ erro: 'Preço pago inválido' });
  }

  const resultado = await pool.query(
    `INSERT INTO ingredientes (nome, unidade, quantidade_comprada, preco_pago)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [nome.trim(), unidade, qtd, preco]
  );

  res.status(201).json(resultado.rows[0]);
});

// Remove um ingrediente (só funciona se não estiver em nenhum produto)
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM ingredientes WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ erro: 'Esse ingrediente está sendo usado em algum produto, remova do produto primeiro' });
  }
});

module.exports = router;
