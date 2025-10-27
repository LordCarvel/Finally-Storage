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
  const content = document.querySelector("main");

  const clone = content.cloneNode(true);
  clone.style.position = 'fixed';
  clone.style.left = '0';
  clone.style.top = '0';
  clone.style.zIndex = '99999';
  clone.style.background = window.getComputedStyle(content).backgroundColor || '#fff';
  clone.style.width = content.scrollWidth + 'px';
  clone.style.height = 'auto';
  clone.style.overflow = 'visible';
  clone.id = 'export-clone';
  document.body.appendChild(clone);

  clone.querySelectorAll('input, select, textarea').forEach((el, i) => {
    try {
      const original = content.querySelectorAll(el.tagName.toLowerCase())[i];
      if (original) {
        if (el.tagName.toLowerCase() === 'input' || el.tagName.toLowerCase() === 'textarea') el.value = original.value;
        if (el.tagName.toLowerCase() === 'select') el.value = original.value;
      }
    } catch (e) { /* ignore */ }
  });

  setTimeout(() => {
    html2canvas(clone, { scale: 2, useCORS: true }).then(canvas => {
      const link = document.createElement("a");
      link.download = `fechamento-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      document.body.removeChild(clone);
    }).catch(err => {
      document.body.removeChild(clone);
      console.error(err);
      alert('Erro ao gerar imagem. Veja o console para detalhes.');
    });
  }, 150);
});
