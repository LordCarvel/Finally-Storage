const tbody = document.getElementById("motoboy-body");
const totalMotoboys = document.getElementById("totalMotoboys");
const totalCaixa = document.getElementById("totalCaixa");

const dinheiro = document.getElementById("dinheiro");
const cartao = document.getElementById("cartao");
const online = document.getElementById("online");

function calcularTotais() {
  let totalGeral = 0;
  tbody.querySelectorAll("tr").forEach(row => {
    const valor = parseFloat(row.children[2].querySelector("input").value) || 0;
    const ajusteInput = row.children[3].querySelector("input.ajuste-input");
    const ajuste = parseFloat(ajusteInput?.value) || 0;
    const signSelect = row.children[3].querySelector("select.ajuste-sign");
    const ajusteSigned = signSelect && signSelect.value === '-' ? -ajuste : ajuste;
    const total = valor + ajusteSigned;
    row.querySelector(".total").innerText = total.toFixed(2).replace(".", ",");
    totalGeral += total;
  });
  totalMotoboys.innerText = totalGeral.toFixed(2).replace(".", ",");
}

function calcularCaixa() {
  const total = 
    (parseFloat(dinheiro.value) || 0) + 
    (parseFloat(cartao.value) || 0) + 
    (parseFloat(online.value) || 0);
  totalCaixa.innerText = total.toFixed(2).replace(".", ",");
}

document.getElementById("addMotoboy").addEventListener("click", () => {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="text" placeholder="Nome"></td>
    <td><input type="number" placeholder="0"></td>
    <td><input type="number" placeholder="0" step="0.01"></td>
    <td class="ajuste-cell"><select class="ajuste-sign" aria-label="sinal ajuste"><option value="+">+</option><option value="-">-</option></select><input type="number" placeholder="0" step="0.01" class="ajuste-input"></td>
    <td class="total">0,00</td>
  `;
  tbody.appendChild(tr);
});

document.addEventListener("input", e => {
  if (e.target.closest("#motoboys-section")) calcularTotais();
  if (e.target.closest("#caixa-section")) calcularCaixa();
});

document.getElementById("exportImageBtn").addEventListener("click", () => {
  // (Removido: já declarado abaixo)
  resumoPanel.id = 'resumo-panel';
  resumoPanel.style.position = 'fixed';
  resumoPanel.style.left = '50%';
  resumoPanel.style.top = '50%';
  resumoPanel.style.transform = 'translate(-50%, -50%)';
  resumoPanel.style.zIndex = '99999';
  resumoPanel.style.background = '#fff';
  resumoPanel.style.border = '2px solid #77A2E8';
  resumoPanel.style.borderRadius = '16px';
  resumoPanel.style.boxShadow = '0 4px 24px rgba(0,0,0,0.12)';
  resumoPanel.style.padding = '2rem 1.2rem';
  resumoPanel.style.maxWidth = '95vw';
  resumoPanel.style.width = '420px';
  resumoPanel.style.fontFamily = 'Inter, Arial, sans-serif';
  resumoPanel.style.color = '#222';
  resumoPanel.style.overflowY = 'auto';

  resumoPanel.innerHTML = `<h2 style="text-align:center;margin-bottom:1.2rem;color:#77A2E8;font-family:Poppins,sans-serif;font-size:1.3rem;">Fechamento de Caixa</h2>`;

  const motoboys = [];
  tbody.querySelectorAll('tr').forEach(row => {
    const nome = row.children[0].querySelector('input').value || '';
    const entregas = row.children[1].querySelector('input').value || '';
    const valor = row.children[2].querySelector('input').value || '';
    const ajusteInput = row.children[3].querySelector('input.ajuste-input');
    const ajuste = ajusteInput?.value || '';
    const signSelect = row.children[3].querySelector('select.ajuste-sign');
    const ajusteSign = signSelect?.value || '+';
    const total = row.querySelector('.total').innerText;
    motoboys.push({ nome, entregas, valor, ajuste, ajusteSign, total });
  });
  let motoboysHtml = `<div style="margin-bottom:1.2rem;"><strong>Motoboys</strong><table style="width:100%;margin-top:0.5rem;border-collapse:collapse;font-size:0.98rem;">`;
  motoboysHtml += `<tr style="background:#f3f7ff;"><th style="padding:4px 6px;">Nome</th><th>Entregas</th><th>Valor</th><th>Ajuste</th><th>Total</th></tr>`;
  motoboys.forEach(m => {
    motoboysHtml += `<tr><td style="padding:4px 6px;">${m.nome}</td><td>${m.entregas}</td><td>${parseFloat(m.valor||0).toFixed(2).replace('.',',')}</td><td>${m.ajusteSign}${parseFloat(m.ajuste||0).toFixed(2).replace('.',',')}</td><td><strong>${m.total}</strong></td></tr>`;
  });
  motoboysHtml += `</table></div>`;
    const overlay = document.createElement('div');
    overlay.id = 'preview-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.35)';
    overlay.style.zIndex = '99998';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    const resumoPanel = document.createElement('div');
    resumoPanel.id = 'resumo-panel';
    resumoPanel.style.position = 'relative';
    resumoPanel.style.background = '#fff';
    resumoPanel.style.border = '2px solid #77A2E8';
    resumoPanel.style.borderRadius = '16px';
    resumoPanel.style.boxShadow = '0 4px 24px rgba(0,0,0,0.12)';
    resumoPanel.style.padding = '2rem 1.2rem 3.5rem 1.2rem';
    resumoPanel.style.maxWidth = '95vw';
    resumoPanel.style.width = '420px';
    resumoPanel.style.fontFamily = 'Inter, Arial, sans-serif';
    resumoPanel.style.color = '#222';
    resumoPanel.style.overflowY = 'auto';
  document.body.appendChild(resumoPanel);

  setTimeout(() => {
    html2canvas(resumoPanel, { scale: 2, useCORS: true }).then(canvas => {
      const link = document.createElement("a");
      link.download = `fechamento-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      document.body.removeChild(resumoPanel);
    }).catch(err => {
      document.body.removeChild(resumoPanel);
      console.error(err);
      alert('Erro ao gerar imagem. Veja o console para detalhes.');
    });
  }, 200);
});
