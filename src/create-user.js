// Uso: node src/create-user.js nomedeusuario senha123
const bcrypt = require('bcryptjs');
const pool = require('./db');

async function main() {
  const [, , usuario, senha] = process.argv;
  if (!usuario || !senha) {
    console.log('Uso: node src/create-user.js <usuario> <senha>');
    process.exit(1);
  }

  const senha_hash = await bcrypt.hash(senha, 10);
  await pool.query(
    'INSERT INTO usuarios (usuario, senha_hash) VALUES ($1, $2) ON CONFLICT (usuario) DO UPDATE SET senha_hash = $2',
    [usuario, senha_hash]
  );

  console.log(`Usuário "${usuario}" criado/atualizado com sucesso.`);
  await pool.end();
}

main().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
