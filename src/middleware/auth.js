const jwt = require('jsonwebtoken');

function exigirLogin(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ erro: 'Não autenticado' });
  }
  try {
    const dados = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = dados;
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Sessão inválida ou expirada' });
  }
}

module.exports = { exigirLogin };
