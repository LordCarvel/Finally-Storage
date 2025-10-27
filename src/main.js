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
  // Modal de pré-visualização (comportamento igual ao /docs)
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
  resumoPanel.style.padding = '1.6rem 1rem 3.6rem 1rem';
  resumoPanel.style.maxWidth = '95vw';
  resumoPanel.style.width = '720px';
  resumoPanel.style.fontFamily = 'Inter, Arial, sans-serif';
  resumoPanel.style.color = '#222';
  resumoPanel.style.overflowY = 'auto';

  const contentDiv = document.createElement('div');
  contentDiv.style.paddingBottom = '0.6rem';

  const makeResumoHtml = () => {
    let html = `<h2 style="text-align:center;margin-bottom:1.2rem;color:#77A2E8;font-family:Poppins,sans-serif;font-size:1.3rem;">Fechamento de Caixa</h2>`;
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
    motoboysHtml += `<tr style="background:#f3f7ff;"><th style="padding:6px 8px;text-align:left;">Nome</th><th style="text-align:right;padding:6px 8px;">Entregas</th><th style="text-align:right;padding:6px 8px;">Valor</th><th style="text-align:right;padding:6px 8px;">Ajuste</th><th style="text-align:right;padding:6px 8px;">Total</th></tr>`;
    motoboys.forEach(m => {
      motoboysHtml += `<tr><td style="padding:6px 8px;">${m.nome}</td><td style="text-align:right;padding:6px 8px;">${m.entregas}</td><td style="text-align:right;padding:6px 8px;">${parseFloat(m.valor||0).toFixed(2).replace('.',',')}</td><td style="text-align:right;padding:6px 8px;">${m.ajusteSign}${parseFloat(m.ajuste||0).toFixed(2).replace('.',',')}</td><td style="text-align:right;padding:6px 8px;"><strong>${m.total}</strong></td></tr>`;
    });
    motoboysHtml += `</table></div>`;

    html += motoboysHtml;
    html += `<div style="margin-bottom:1.2rem;font-family:'IBM Plex Mono',monospace;font-size:1.05rem;"><strong>Total Motoboys:</strong> R$ <span>${totalMotoboys.innerText}</span></div>`;

    html += `<div style="margin-bottom:1.2rem;"><strong>Caixa Final</strong><table style="width:100%;margin-top:0.5rem;border-collapse:collapse;font-size:0.98rem;">` +
      `<tr><td style="padding:6px 8px;">Dinheiro:</td><td style="text-align:right;padding:6px 8px;">R$ ${parseFloat(dinheiro.value||0).toFixed(2).replace('.',',')}</td></tr>` +
      `<tr><td style="padding:6px 8px;">Cartão:</td><td style="text-align:right;padding:6px 8px;">R$ ${parseFloat(cartao.value||0).toFixed(2).replace('.',',')}</td></tr>` +
      `<tr><td style="padding:6px 8px;">Online:</td><td style="text-align:right;padding:6px 8px;">R$ ${parseFloat(online.value||0).toFixed(2).replace('.',',')}</td></tr>` +
      `</table></div>`;

    html += `<div style="font-family:'IBM Plex Mono',monospace;font-size:1.05rem;"><strong>Total Caixa:</strong> R$ <span>${totalCaixa.innerText}</span></div>`;
    html += `<div style="margin-top:1.5rem;text-align:center;font-size:0.92rem;color:#888;">© 2025 — <a href="https://github.com/LordCarvel" target="_blank" style="color:#77A2E8;text-decoration:none;">LordCarvel</a></div>`;
    return html;
  };

  contentDiv.innerHTML = makeResumoHtml();
  resumoPanel.appendChild(contentDiv);

  const btnsDiv = document.createElement('div');
  btnsDiv.style.position = 'absolute';
  btnsDiv.style.left = '0';
  btnsDiv.style.bottom = '0';
  btnsDiv.style.width = '100%';
  btnsDiv.style.display = 'flex';
  btnsDiv.style.justifyContent = 'flex-end';
  btnsDiv.style.gap = '0.6rem';
  btnsDiv.style.padding = '0.9rem';
  btnsDiv.style.background = 'rgba(255,255,255,0.95)';
  btnsDiv.style.borderBottomLeftRadius = '14px';
  btnsDiv.style.borderBottomRightRadius = '14px';

  const btnCancel = document.createElement('button');
  btnCancel.textContent = 'Cancelar';
  btnCancel.style.background = '#eee';
  btnCancel.style.color = '#333';
  btnCancel.style.border = 'none';
  btnCancel.style.borderRadius = '8px';
  btnCancel.style.padding = '0.55rem 0.9rem';
  btnCancel.style.fontWeight = '600';
  btnCancel.style.cursor = 'pointer';
  btnCancel.onclick = () => document.body.removeChild(overlay);

  const btnGenerate = document.createElement('button');
  btnGenerate.textContent = 'Gerar pré-visualização';
  btnGenerate.style.background = '#77A2E8';
  btnGenerate.style.color = '#fff';
  btnGenerate.style.border = 'none';
  btnGenerate.style.borderRadius = '8px';
  btnGenerate.style.padding = '0.55rem 0.9rem';
  btnGenerate.style.fontWeight = '600';
  btnGenerate.style.cursor = 'pointer';

  const btnDownload = document.createElement('button');
  btnDownload.textContent = 'Baixar imagem';
  btnDownload.style.background = '#2b6cb0';
  btnDownload.style.color = '#fff';
  btnDownload.style.border = 'none';
  btnDownload.style.borderRadius = '8px';
  btnDownload.style.padding = '0.55rem 0.9rem';
  btnDownload.style.fontWeight = '600';
  btnDownload.style.cursor = 'pointer';
  btnDownload.disabled = true;

  let lastPreviewData = null;
  let previewWrapper = null;

  btnGenerate.onclick = () => {
    btnGenerate.disabled = true;
    contentDiv.innerHTML = makeResumoHtml();
    if (previewWrapper) { previewWrapper.remove(); previewWrapper = null; }
    html2canvas(contentDiv, { scale: 2, useCORS: true }).then(canvas => {
      lastPreviewData = canvas.toDataURL('image/png');
      const img = document.createElement('img');
      img.src = lastPreviewData;
      img.style.maxWidth = '100%';
      img.style.borderRadius = '10px';
      img.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';

      previewWrapper = document.createElement('div');
      previewWrapper.style.margin = '0.6rem 0 3rem 0';
      previewWrapper.appendChild(img);

      resumoPanel.insertBefore(previewWrapper, btnsDiv);
      btnDownload.disabled = false;
    }).catch(err => {
      console.error(err);
      alert('Erro ao gerar pré-visualização. Veja o console para detalhes.');
    }).finally(() => {
      btnGenerate.disabled = false;
    });
  };

  btnDownload.onclick = () => {
    if (!lastPreviewData) return alert('Gere a pré-visualização antes de baixar.');
    const link = document.createElement('a');
    link.download = `fechamento-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = lastPreviewData;
    link.click();
  };

  btnsDiv.appendChild(btnCancel);
  btnsDiv.appendChild(btnGenerate);
  btnsDiv.appendChild(btnDownload);
  resumoPanel.appendChild(btnsDiv);
  overlay.appendChild(resumoPanel);
  document.body.appendChild(overlay);
});
