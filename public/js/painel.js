function formatarReal(numero) {
  return Number(numero).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

async function checarLogin() {
  const resposta = await fetch('/api/auth/me');
  if (!resposta.ok) window.location.href = '/login.html';
}

// ---------- Abas ----------
const botoesAba = document.querySelectorAll('.aba-botao');
botoesAba.forEach((botao) => {
  botao.addEventListener('click', () => {
    document.querySelectorAll('.aba-botao').forEach((b) => b.classList.remove('ativa'));
    document.querySelectorAll('.aba').forEach((a) => a.classList.remove('ativa'));
    botao.classList.add('ativa');
    document.getElementById('aba-' + botao.dataset.aba).classList.add('ativa');
  });
});

// ---------- Estado em memória ----------
let ingredientesCache = [];
let produtosCache = [];

// ---------- Ingredientes ----------
async function carregarIngredientes() {
  const resposta = await fetch('/api/ingredientes');
  ingredientesCache = await resposta.json();

  const lista = document.getElementById('lista-ingredientes');
  lista.innerHTML = '';
  if (ingredientesCache.length === 0) {
    lista.innerHTML = '<div style="color:#9C7F68;font-size:14px;">Nenhum ingrediente cadastrado ainda.</div>';
  } else {
    ingredientesCache.forEach((ing) => {
      const linha = document.createElement('div');
      linha.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #F3E8DC;font-size:14px;';
      linha.innerHTML = `
        <span style="flex:1;">${ing.nome}</span>
        <span style="color:#9C7F68;margin-right:10px;">${formatarReal(ing.preco_unitario)} / ${ing.unidade}</span>
        <button data-id="${ing.id}" class="btn-remover-ingrediente" style="border:none;background:transparent;color:#B4432E;font-size:13px;">remover</button>
      `;
      lista.appendChild(linha);
    });
    document.querySelectorAll('.btn-remover-ingrediente').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const resposta = await fetch('/api/ingredientes/' + btn.dataset.id, { method: 'DELETE' });
        if (resposta.ok) {
          await carregarIngredientes();
        } else {
          const dados = await resposta.json().catch(() => ({}));
          alert(dados.erro || 'Não foi possível remover');
        }
      });
    });
  }

  atualizarSelectIngredientesProduto();
  atualizarSelectProdutoVenda();
}

document.getElementById('form-ingrediente').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const mensagem = document.getElementById('mensagem-ingrediente');
  mensagem.textContent = '';

  const corpo = {
    nome: document.getElementById('ing-nome').value,
    unidade: document.getElementById('ing-unidade').value,
    quantidade_comprada: document.getElementById('ing-quantidade').value,
    preco_pago: document.getElementById('ing-preco').value,
  };

  const resposta = await fetch('/api/ingredientes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  });

  if (resposta.ok) {
    document.getElementById('form-ingrediente').reset();
    await carregarIngredientes();
  } else {
    const dados = await resposta.json().catch(() => ({}));
    mensagem.textContent = dados.erro || 'Não foi possível salvar';
  }
});

// ---------- Produtos ----------
function linhaIngredienteProdutoHtml() {
  const opcoes = ingredientesCache
    .map((ing) => `<option value="${ing.id}">${ing.nome} (${ing.unidade})</option>`)
    .join('');
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:center;';
  div.innerHTML = `
    <select class="select-ingrediente-produto" style="flex:2;border:1px solid #E3D2C1;border-radius:10px;padding:10px;">${opcoes}</select>
    <input type="number" step="0.001" min="0.001" placeholder="Qtd" class="input-quantidade-produto" style="flex:1;border:1px solid #E3D2C1;border-radius:10px;padding:10px;">
    <button type="button" class="btn-remover-linha" style="border:none;background:transparent;color:#B4432E;">✕</button>
  `;
  div.querySelector('.btn-remover-linha').addEventListener('click', () => div.remove());
  return div;
}

function atualizarSelectIngredientesProduto() {
  document.querySelectorAll('.select-ingrediente-produto').forEach((select) => {
    const valorAtual = select.value;
    select.innerHTML = ingredientesCache
      .map((ing) => `<option value="${ing.id}">${ing.nome} (${ing.unidade})</option>`)
      .join('');
    if (valorAtual) select.value = valorAtual;
  });
}

document.getElementById('btn-add-ingrediente-produto').addEventListener('click', () => {
  if (ingredientesCache.length === 0) {
    alert('Cadastre um ingrediente primeiro, na aba Ingredientes.');
    return;
  }
  document.getElementById('linhas-ingredientes-produto').appendChild(linhaIngredienteProdutoHtml());
});

async function carregarProdutos() {
  const resposta = await fetch('/api/produtos');
  produtosCache = await resposta.json();

  const lista = document.getElementById('lista-produtos');
  lista.innerHTML = '';
  if (produtosCache.length === 0) {
    lista.innerHTML = '<div style="color:#9C7F68;font-size:14px;">Nenhum produto cadastrado ainda.</div>';
  } else {
    produtosCache.forEach((produto) => {
      const detalheIngredientes = produto.ingredientes
        .map((i) => `${i.quantidade}${i.unidade} de ${i.ingrediente_nome}`)
        .join(', ');
      const linha = document.createElement('div');
      linha.style.cssText = 'padding:10px 0;border-bottom:1px solid #F3E8DC;font-size:14px;';
      linha.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:600;">${produto.nome}</span>
          <div>
            <span style="color:#B4432E;margin-right:10px;">custo ${formatarReal(produto.custo_calculado)}</span>
            <button data-id="${produto.id}" class="btn-remover-produto" style="border:none;background:transparent;color:#B4432E;font-size:13px;">remover</button>
          </div>
        </div>
        <div style="color:#9C7F68;font-size:12px;margin-top:4px;">${detalheIngredientes}</div>
      `;
      lista.appendChild(linha);
    });
    document.querySelectorAll('.btn-remover-produto').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await fetch('/api/produtos/' + btn.dataset.id, { method: 'DELETE' });
        await carregarProdutos();
      });
    });
  }

  atualizarSelectProdutoVenda();
}

document.getElementById('form-produto').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const mensagem = document.getElementById('mensagem-produto');
  mensagem.textContent = '';

  const linhas = document.querySelectorAll('#linhas-ingredientes-produto > div');
  const itens = Array.from(linhas).map((linha) => ({
    ingrediente_id: Number(linha.querySelector('.select-ingrediente-produto').value),
    quantidade: linha.querySelector('.input-quantidade-produto').value,
  }));

  if (itens.length === 0) {
    mensagem.textContent = 'Adicione pelo menos um ingrediente';
    return;
  }

  const corpo = {
    nome: document.getElementById('prod-nome').value,
    preco_venda_sugerido: document.getElementById('prod-preco').value || null,
    itens,
  };

  const resposta = await fetch('/api/produtos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  });

  if (resposta.ok) {
    document.getElementById('form-produto').reset();
    document.getElementById('linhas-ingredientes-produto').innerHTML = '';
    await carregarProdutos();
  } else {
    const dados = await resposta.json().catch(() => ({}));
    mensagem.textContent = dados.erro || 'Não foi possível salvar';
  }
});

// ---------- Vendas ----------
function atualizarSelectProdutoVenda() {
  const select = document.getElementById('venda-produto');
  const valorAtual = select.value;
  select.innerHTML =
    '<option value="">Venda avulsa (sem produto cadastrado)</option>' +
    produtosCache.map((p) => `<option value="${p.id}">${p.nome}</option>`).join('');
  select.value = valorAtual;
}

document.getElementById('venda-produto').addEventListener('change', (evento) => {
  const campoDescricao = document.getElementById('campo-venda-descricao');
  campoDescricao.style.display = evento.target.value ? 'none' : 'flex';
});

async function carregarVendas() {
  const resposta = await fetch('/api/vendas');
  const itens = await resposta.json();

  const montarLinha = (item) => {
    const hora = new Date(item.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const lucroItem = Number(item.valor_recebido) - Number(item.custo_calculado);
    return `
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #F3E8DC;font-size:14px;">
        <span style="color:#9C7F68;width:50px;">${hora}</span>
        <span style="flex:1;">${item.descricao} <span style="color:#9C7F68;">× ${item.quantidade}</span></span>
        <span class="${lucroItem >= 0 ? 'ganho' : 'perda'}" style="font-weight:600;">${formatarReal(item.valor_recebido)}</span>
      </div>`;
  };

  const html = itens.length
    ? itens.map(montarLinha).join('')
    : '<div style="color:#9C7F68;font-size:14px;">Nenhuma venda hoje ainda.</div>';

  document.getElementById('lista-vendas').innerHTML = html;
  document.getElementById('lista-vendas-resumo').innerHTML = html;
}

document.getElementById('form-venda').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const mensagem = document.getElementById('mensagem-venda');
  mensagem.textContent = '';

  const corpo = {
    produto_id: document.getElementById('venda-produto').value || null,
    descricao: document.getElementById('venda-descricao').value,
    quantidade: document.getElementById('venda-quantidade').value || 1,
    valor_recebido: document.getElementById('venda-valor').value,
  };

  const resposta = await fetch('/api/vendas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  });

  if (resposta.ok) {
    document.getElementById('form-venda').reset();
    document.getElementById('venda-quantidade').value = 1;
    await atualizarTudo();
  } else {
    const dados = await resposta.json().catch(() => ({}));
    mensagem.textContent = dados.erro || 'Não foi possível salvar';
  }
});

// ---------- Despesas ----------
async function carregarDespesas() {
  const resposta = await fetch('/api/vendas/despesas/lista');
  const itens = await resposta.json();

  const montarLinha = (item) => {
    const hora = new Date(item.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #F3E8DC;font-size:14px;">
        <span style="color:#9C7F68;width:50px;">${hora}</span>
        <span style="flex:1;">${item.descricao} <span style="color:#9C7F68;">· ${item.categoria}</span></span>
        <span class="perda" style="font-weight:600;">${formatarReal(item.valor)}</span>
      </div>`;
  };

  const html = itens.length
    ? itens.map(montarLinha).join('')
    : '<div style="color:#9C7F68;font-size:14px;">Nenhuma despesa hoje ainda.</div>';

  document.getElementById('lista-despesas').innerHTML = html;
  document.getElementById('lista-despesas-resumo').innerHTML = html;
}

document.getElementById('form-despesa').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const mensagem = document.getElementById('mensagem-despesa');
  mensagem.textContent = '';

  const corpo = {
    descricao: document.getElementById('despesa-descricao').value,
    categoria: document.getElementById('despesa-categoria').value,
    valor: document.getElementById('despesa-valor').value,
  };

  const resposta = await fetch('/api/vendas/despesas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  });

  if (resposta.ok) {
    document.getElementById('form-despesa').reset();
    await atualizarTudo();
  } else {
    const dados = await resposta.json().catch(() => ({}));
    mensagem.textContent = dados.erro || 'Não foi possível salvar';
  }
});

// ---------- Resumos ----------
async function carregarResumoDia() {
  const resposta = await fetch('/api/vendas/resumo/dia');
  const dados = await resposta.json();
  document.getElementById('dia-receita').textContent = formatarReal(dados.receita);
  document.getElementById('dia-custo').textContent = formatarReal(dados.custo_total);
  document.getElementById('dia-lucro').textContent = formatarReal(dados.lucro);
}

async function carregarResumoMes() {
  const resposta = await fetch('/api/vendas/resumo/mes');
  const dados = await resposta.json();
  document.getElementById('mes-receita').textContent = formatarReal(dados.receita);
  document.getElementById('mes-custo').textContent = formatarReal(dados.custo_total);
  document.getElementById('mes-lucro').textContent = formatarReal(dados.lucro);
}

async function atualizarTudo() {
  await Promise.all([carregarResumoDia(), carregarResumoMes(), carregarVendas(), carregarDespesas()]);
}

// ---------- Sair ----------
document.getElementById('btn-sair').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login.html';
});

// ---------- Início ----------
checarLogin().then(async () => {
  await carregarIngredientes();
  await carregarProdutos();
  await atualizarTudo();
});
