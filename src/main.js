import { createMotoboyRowElement, calculateTotals, calculateCashTotal } from './modules/calculations.js';
import { openPreviewModal } from './modules/preview.js';

const tbody = document.getElementById('motoboy-body');
const totalMotoboysEl = document.getElementById('totalMotoboys');
const totalCaixaEl = document.getElementById('totalCaixa');

const dinheiroEl = document.getElementById('dinheiro');
const cartaoEl = document.getElementById('cartao');
const onlineEl = document.getElementById('online');

function refreshTotals() {
  calculateTotals(tbody, totalMotoboysEl);
  calculateCashTotal(dinheiroEl, cartaoEl, onlineEl, totalCaixaEl);
}

document.getElementById('addMotoboy').addEventListener('click', () => {
  const tr = createMotoboyRowElement();
  tbody.appendChild(tr);
});

document.addEventListener('input', (e) => {
  if (e.target.closest('#motoboys-section') || e.target.closest('#caixa-section')) refreshTotals();
});

document.getElementById('exportImageBtn').addEventListener('click', () => {
  openPreviewModal(() => {
    let html = `<h2 style="text-align:center;margin-bottom:1rem;color:#77A2E8;font-family:Poppins,sans-serif;">Cash Register Summary</h2>`;
    const rows = [];
    tbody.querySelectorAll('tr').forEach(row => {
      const name = row.children[0].querySelector('input').value || '';
      const deliveries = row.children[1].querySelector('input').value || '';
      const value = row.children[2].querySelector('input').value || '';
      const ajuste = row.children[3].querySelector('input.ajuste-input')?.value || '';
      const sign = row.children[3].querySelector('select.ajuste-sign')?.value || '+';
      const total = row.querySelector('.total').innerText;
      rows.push({ name, deliveries, value, ajuste, sign, total });
    });

    html += `<div style="margin-bottom:0.8rem;"><strong>Delivery riders</strong><table style="width:100%;margin-top:0.5rem;border-collapse:collapse;font-size:0.95rem;">`;
    html += `<tr style="background:#f3f7ff;"><th style="padding:6px 8px;text-align:left;">Name</th><th style="text-align:right;padding:6px 8px;">Deliveries</th><th style="text-align:right;padding:6px 8px;">Value</th><th style="text-align:right;padding:6px 8px;">Adjust</th><th style="text-align:right;padding:6px 8px;">Total</th></tr>`;
    rows.forEach(r => {
      html += `<tr><td style="padding:6px 8px;">${r.name}</td><td style="text-align:right;padding:6px 8px;">${r.deliveries}</td><td style="text-align:right;padding:6px 8px;">${parseFloat(r.value||0).toFixed(2).replace('.',',')}</td><td style="text-align:right;padding:6px 8px;">${r.sign}${parseFloat(r.ajuste||0).toFixed(2).replace('.',',')}</td><td style="text-align:right;padding:6px 8px;"><strong>${r.total}</strong></td></tr>`;
    });
    html += `</table></div>`;

    html += `<div style="margin-bottom:0.6rem;font-family:'IBM Plex Mono',monospace;"><strong>Total Riders:</strong> R$ ${totalMotoboysEl.innerText}</div>`;

    html += `<div style="margin-bottom:0.6rem;"><strong>Cash Breakdown</strong><table style="width:100%;margin-top:0.3rem;font-size:0.95rem;border-collapse:collapse;">` +
      `<tr><td style="padding:6px 8px;">Cash:</td><td style="text-align:right;padding:6px 8px;">R$ ${parseFloat(dinheiroEl.value||0).toFixed(2).replace('.',',')}</td></tr>` +
      `<tr><td style="padding:6px 8px;">Card:</td><td style="text-align:right;padding:6px 8px;">R$ ${parseFloat(cartaoEl.value||0).toFixed(2).replace('.',',')}</td></tr>` +
      `<tr><td style="padding:6px 8px;">Online:</td><td style="text-align:right;padding:6px 8px;">R$ ${parseFloat(onlineEl.value||0).toFixed(2).replace('.',',')}</td></tr>` +
      `</table></div>`;

    html += `<div style="font-family:'IBM Plex Mono',monospace;"><strong>Total Cash:</strong> R$ ${totalCaixaEl.innerText}</div>`;

    html += `<div style="margin-top:1rem;text-align:center;font-size:0.85rem;color:#888;">© 2025 — LordCarvel</div>`;
    return html;
  });
});
