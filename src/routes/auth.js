const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { exigirLogin } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { usuario, senha } = req.body;
  if (!usuario || !senha) {
    return res.status(400).json({ erro: 'Informe usuário e senha' });
  }

  const resultado = await pool.query(
    'SELECT id, usuario, senha_hash FROM usuarios WHERE usuario = $1',
    [usuario]
  );
  const linha = resultado.rows[0];

  if (!linha || !(await bcrypt.compare(senha, linha.senha_hash))) {
    return res.status(401).json({ erro: 'Usuário ou senha incorretos' });
  }

  const token = jwt.sign(
    { id: linha.id, usuario: linha.usuario },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.json({ ok: true, usuario: linha.usuario });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', exigirLogin, (req, res) => {
  res.json({ usuario: req.usuario.usuario });
});

router.post('/trocar-senha', exigirLogin, async (req, res) => {
  const { senhaAtual, novaSenha } = req.body;

  if (!senhaAtual || !novaSenha) {
    return res.status(400).json({ erro: 'Informe a senha atual e a nova senha' });
  }
  if (novaSenha.length < 4) {
    return res.status(400).json({ erro: 'A nova senha deve ter pelo menos 4 caracteres' });
  }

  const resultado = await pool.query('SELECT senha_hash FROM usuarios WHERE id = $1', [req.usuario.id]);
  const linha = resultado.rows[0];

  if (!linha || !(await bcrypt.compare(senhaAtual, linha.senha_hash))) {
    return res.status(401).json({ erro: 'Senha atual incorreta' });
  }

  const novoHash = await bcrypt.hash(novaSenha, 10);
  await pool.query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [novoHash, req.usuario.id]);

  res.json({ ok: true });
});

module.exports = router;
