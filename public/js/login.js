const form = document.getElementById('form-login');
const mensagemErro = document.getElementById('mensagem-erro');

const campoSenha = document.getElementById('senha');
const btnVerSenha = document.getElementById('btn-ver-senha');
const iconeOlho = document.getElementById('icone-olho');

const olhoAberto = '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path><circle cx="12" cy="12" r="3"></circle>';
const olhoFechado = '<path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.6 18.6 0 0 1 4.22-5.06M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a18.6 18.6 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';

btnVerSenha.addEventListener('click', () => {
  const mostrando = campoSenha.type === 'text';
  campoSenha.type = mostrando ? 'password' : 'text';
  iconeOlho.innerHTML = mostrando ? olhoAberto : olhoFechado;
  btnVerSenha.setAttribute('aria-label', mostrando ? 'Mostrar senha' : 'Esconder senha');
  btnVerSenha.setAttribute('aria-pressed', String(!mostrando));
});

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  mensagemErro.textContent = '';

  const usuario = document.getElementById('usuario').value.trim();
  const senha = document.getElementById('senha').value.trim();

  const resposta = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, senha }),
  });

  if (resposta.ok) {
    window.location.href = '/painel.html';
  } else {
    const dados = await resposta.json().catch(() => ({}));
    mensagemErro.textContent = dados.erro || 'Não foi possível entrar';
  }
});
