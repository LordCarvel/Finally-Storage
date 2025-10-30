export function createMotoboyRowElement() {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" placeholder="Name"></td>
    <td><input type="number" placeholder="0"></td>
    <td><input type="number" placeholder="0" step="0.01"></td>
    <td class="ajuste-cell"><select class="ajuste-sign" aria-label="adjust sign"><option value="+">+</option><option value="-">-</option></select><input type="number" placeholder="0" step="0.01" class="ajuste-input"></td>
    <td class="total">0.00</td>
  `;
  return tr;
}

export function calculateTotals(tbody, totalMotoboysEl) {
  let totalAll = 0;
  tbody.querySelectorAll('tr').forEach(row => {
    const value = parseFloat(row.children[2].querySelector('input').value) || 0;
    const ajusteInput = row.children[3].querySelector('input.ajuste-input');
    const ajuste = parseFloat(ajusteInput?.value) || 0;
    const signSelect = row.children[3].querySelector('select.ajuste-sign');
    const signedAjuste = signSelect && signSelect.value === '-' ? -ajuste : ajuste;
    const total = value + signedAjuste;
    row.querySelector('.total').innerText = total.toFixed(2).replace('.', ',');
    totalAll += total;
  });
  totalMotoboysEl.innerText = totalAll.toFixed(2).replace('.', ',');
}

export function calculateCashTotal(dinheiroEl, cartaoEl, onlineEl, totalCaixaEl) {
  const total = (parseFloat(dinheiroEl.value) || 0) + (parseFloat(cartaoEl.value) || 0) + (parseFloat(onlineEl.value) || 0);
  totalCaixaEl.innerText = total.toFixed(2).replace('.', ',');
}
