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
    const ajuste = parseFloat(row.children[3].querySelector("input").value) || 0;
    const total = valor + ajuste;
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
    <td><input type="number" placeholder="0" step="0.01"></td>
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
  content.classList.add("compact-mode");

  html2canvas(content, { scale: 2 }).then(canvas => {
    const link = document.createElement("a");
    link.download = `fechamento-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    content.classList.remove("compact-mode");
  });
});
