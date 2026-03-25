import {
  createEmptyCourier,
  createMotoboyRowElement,
  DEFAULT_HUB_CONFIG,
  formatCurrency,
  calculateCourierTotal,
  calculateTotals,
  getOperationalDate,
  normalizeState,
  parseNumber
} from './modules/calculations.js';
import { syncHubCommands } from './modules/hub.js';
import { openPreviewModal } from './modules/preview.js';
import { createDebouncedSaver, loadLocalStorage, saveLocalStorage } from './modules/storage.js';

const pageSections = document.querySelectorAll('[data-page]');
const pageTriggers = document.querySelectorAll('[data-page-trigger]');

const motoboyTableHead = document.getElementById('motoboy-head');
const motoboyTableBody = document.getElementById('motoboy-body');
const ratesTableBody = document.getElementById('rates-body');
const incomingOrdersBody = document.getElementById('incoming-orders-body');
const hubLogsList = document.getElementById('hubLogs');

const totalMotoboysEl = document.getElementById('totalMotoboys');
const totalCaixaEl = document.getElementById('totalCaixa');
const hubIncomingTotalEl = document.getElementById('hubIncomingTotal');
const hubIncomingReadonlyEl = document.getElementById('hubIncomingReadonly');
const autosaveStatusEl = document.getElementById('autosaveStatus');
const savedPreviewStatusEl = document.getElementById('savedPreviewStatus');
const syncStatusEl = document.getElementById('hubSyncStatus');

const dinheiroEl = document.getElementById('dinheiro');
const cartaoEl = document.getElementById('cartao');
const onlineEl = document.getElementById('online');

const hubEnabledEl = document.getElementById('hubEnabled');
const hubBaseUrlEl = document.getElementById('hubBaseUrl');
const hubProjectIdEl = document.getElementById('hubProjectId');
const hubAppIdEl = document.getElementById('hubAppId');
const hubPollIntervalEl = document.getElementById('hubPollInterval');
const hubDefaultRateEl = document.getElementById('hubDefaultRate');

let state = normalizeState(loadLocalStorage() || {});
let hubPollTimer = null;
let hubSyncInFlight = false;

const debouncedSave = createDebouncedSaver((snapshot) => {
  saveLocalStorage(snapshot);
  autosaveStatusEl.textContent = `Autosave local ativo. Ultima gravacao: ${new Date().toLocaleTimeString('pt-BR')}`;
}, 300);

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const createRateRowElement = (rate) => {
  const row = document.createElement('tr');
  row.dataset.rateId = rate.id;
  row.innerHTML = `
    <td data-label="Nome da taxa">
      <input type="text" data-role="rate-name" value="${escapeHtml(rate.name)}" placeholder="Nome da taxa">
    </td>
    <td data-label="Valor unitario (R$)">
      <input type="number" data-role="rate-value" value="${rate.value}" step="0.01" placeholder="0">
    </td>
    <td data-label="Acoes" class="row-actions">
      <button type="button" class="btn btn-row-remove" data-action="remove-rate">Remover</button>
    </td>
  `;
  return row;
};

const readRateConfigsFromDom = () =>
  Array.from(ratesTableBody.querySelectorAll('tr')).map((row, index) => ({
    id: row.dataset.rateId || `rate-${index + 1}`,
    name: row.querySelector('[data-role="rate-name"]')?.value || `Taxa ${index + 1}`,
    value: row.querySelector('[data-role="rate-value"]')?.value || ''
  }));

const readCouriersFromDom = () =>
  Array.from(motoboyTableBody.querySelectorAll('tr')).map((row) => {
    const countsByRate = {};

    state.rateConfigs.forEach((rate) => {
      countsByRate[rate.id] = row.querySelector(`[data-rate-id="${rate.id}"]`)?.value || '';
    });

    return {
      id: row.dataset.courierId || undefined,
      hubCourierId: row.dataset.hubCourierId || '',
      name: row.querySelector('[data-role="courier-name"]')?.value || '',
      countsByRate,
      adjustmentSign: row.querySelector('[data-role="adjustment-sign"]')?.value || '+',
      adjustmentValue: row.querySelector('[data-role="adjustment-value"]')?.value || ''
    };
  });

const readHubConfigFromDom = () => ({
  enabled: hubEnabledEl.checked,
  baseUrl: hubBaseUrlEl.value,
  projectId: hubProjectIdEl.value,
  appId: DEFAULT_HUB_CONFIG.appId,
  pollIntervalSeconds: hubPollIntervalEl.value,
  defaultRateId: hubDefaultRateEl.value
});

const updateState = (updater, options = {}) => {
  const nextState = typeof updater === 'function' ? updater(state) : updater;
  state = normalizeState(nextState);

  if (!options.skipPersist) {
    debouncedSave(state);
  }

  if (!options.skipPollingRefresh) {
    scheduleHubPolling();
  }
};

const renderPageVisibility = () => {
  pageSections.forEach((section) => {
    const isActive = section.dataset.page === state.activePage;
    section.hidden = !isActive;
  });

  pageTriggers.forEach((trigger) => {
    const isActive = trigger.dataset.pageTrigger === state.activePage;
    trigger.classList.toggle('active', isActive);
  });
};

const renderRatesTable = () => {
  ratesTableBody.innerHTML = '';
  state.rateConfigs.forEach((rate) => {
    ratesTableBody.appendChild(createRateRowElement(rate));
  });
};

const renderMotoboyTable = () => {
  const rateHeaders = state.rateConfigs
    .map((rate) => `<th>${escapeHtml(rate.name)}<small>R$ ${formatCurrency(rate.value)}</small></th>`)
    .join('');

  motoboyTableHead.innerHTML = `
    <tr>
      <th>Nome</th>
      ${rateHeaders}
      <th>Ajuste (R$)</th>
      <th>Total (R$)</th>
      <th>Acoes</th>
    </tr>
  `;

  motoboyTableBody.innerHTML = '';
  state.couriers.forEach((courier) => {
    const row = createMotoboyRowElement(courier, state.rateConfigs);
    row.dataset.hubCourierId = courier.hubCourierId || '';
    motoboyTableBody.appendChild(row);
  });
};

const renderCashInputs = () => {
  dinheiroEl.value = state.cash.dinheiro;
  cartaoEl.value = state.cash.cartao;
  onlineEl.value = state.cash.online;
};

const renderIncomingOrders = () => {
  incomingOrdersBody.innerHTML = '';

  if (!state.incomingOrders.length) {
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="5" class="empty-state-cell">Nenhum pedido vindo do Hub ainda.</td>`;
    incomingOrdersBody.appendChild(row);
    return;
  }

  state.incomingOrders.forEach((order) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td data-label="Data">${escapeHtml(order.operationalDate || getOperationalDate())}</td>
      <td data-label="Filial">${escapeHtml(order.sourceBranchName || '-')}</td>
      <td data-label="Pedido">${escapeHtml(order.hubOrderId || '-')}</td>
      <td data-label="Valor">R$ ${formatCurrency(order.totalAmount)}</td>
      <td data-label="Recebido">${escapeHtml(order.receivedAt ? new Date(order.receivedAt).toLocaleTimeString('pt-BR') : '-')}</td>
    `;
    incomingOrdersBody.appendChild(row);
  });
};

const renderHubConfig = () => {
  hubEnabledEl.checked = state.hubConfig.enabled;
  hubBaseUrlEl.value = state.hubConfig.baseUrl;
  hubProjectIdEl.value = state.hubConfig.projectId;
  hubAppIdEl.value = state.hubConfig.appId;
  hubPollIntervalEl.value = String(state.hubConfig.pollIntervalSeconds);

  hubDefaultRateEl.innerHTML = '';
  state.rateConfigs.forEach((rate) => {
    const option = document.createElement('option');
    option.value = rate.id;
    option.textContent = `${rate.name} (R$ ${formatCurrency(rate.value)})`;
    option.selected = rate.id === state.hubConfig.defaultRateId;
    hubDefaultRateEl.appendChild(option);
  });
};

const renderHubLogs = () => {
  hubLogsList.innerHTML = '';

  if (!state.hubSync.lastAppliedCommands.length) {
    const item = document.createElement('li');
    item.textContent = 'Nenhuma sincronizacao aplicada ainda.';
    hubLogsList.appendChild(item);
  } else {
    state.hubSync.lastAppliedCommands
      .slice()
      .reverse()
      .forEach((entry) => {
        const item = document.createElement('li');
        item.innerHTML = `<strong>${new Date(entry.createdAt).toLocaleTimeString('pt-BR')}</strong> ${escapeHtml(entry.message)}`;
        hubLogsList.appendChild(item);
      });
  }

  const statusParts = [];

  if (state.hubSync.lastSyncAt) {
    statusParts.push(`Ultima sincronizacao: ${new Date(state.hubSync.lastSyncAt).toLocaleString('pt-BR')}`);
  }

  if (state.hubSync.lastError) {
    statusParts.push(`Erro: ${state.hubSync.lastError}`);
  }

  if (!statusParts.length) {
    syncStatusEl.textContent = 'Hub pronto para sincronizar.';
  } else {
    syncStatusEl.textContent = statusParts.join(' | ');
  }
};

const renderPreviewStatus = () => {
  if (!state.lastPreviewGeneratedAt) {
    savedPreviewStatusEl.textContent = 'Nenhuma imagem salva localmente ainda.';
    return;
  }

  savedPreviewStatusEl.textContent = `Ultima imagem salva localmente em ${new Date(
    state.lastPreviewGeneratedAt
  ).toLocaleString('pt-BR')}.`;
};

const paintTotals = () => {
  const totals = calculateTotals(state);

  Array.from(motoboyTableBody.querySelectorAll('tr')).forEach((row, index) => {
    const courier = state.couriers[index];
    if (!courier) return;
    const totalCell = row.querySelector('.total');
    if (totalCell) {
      totalCell.textContent = formatCurrency(calculateCourierTotal(courier, state.rateConfigs));
    }
  });

  totalMotoboysEl.textContent = formatCurrency(totals.couriersTotal);
  hubIncomingTotalEl.textContent = formatCurrency(totals.incomingOrdersTotal);
  hubIncomingReadonlyEl.value = formatCurrency(totals.incomingOrdersTotal);
  totalCaixaEl.textContent = formatCurrency(totals.cashTotal);
};

const renderAll = () => {
  renderPageVisibility();
  renderRatesTable();
  renderMotoboyTable();
  renderCashInputs();
  renderIncomingOrders();
  renderHubConfig();
  renderHubLogs();
  renderPreviewStatus();
  paintTotals();
};

const refreshCourierStateFromDom = () => {
  updateState((currentState) => ({
    ...currentState,
    couriers: readCouriersFromDom()
  }), { skipPollingRefresh: true });
  paintTotals();
};

const refreshCashStateFromDom = () => {
  updateState((currentState) => ({
    ...currentState,
    cash: {
      dinheiro: dinheiroEl.value,
      cartao: cartaoEl.value,
      online: onlineEl.value
    }
  }), { skipPollingRefresh: true });
  paintTotals();
};

const refreshRatesStateFromDom = () => {
  const previousCouriers = motoboyTableBody.children.length ? readCouriersFromDom() : state.couriers;

  updateState((currentState) => ({
    ...currentState,
    rateConfigs: readRateConfigsFromDom(),
    couriers: previousCouriers
  }), { skipPollingRefresh: true });

  renderMotoboyTable();
  renderHubConfig();
  paintTotals();
};

const refreshHubConfigFromDom = () => {
  updateState((currentState) => ({
    ...currentState,
    hubConfig: readHubConfigFromDom()
  }));
  renderHubLogs();
};

const addCourierRow = () => {
  updateState((currentState) => ({
    ...currentState,
    couriers: [...currentState.couriers, createEmptyCourier(currentState.rateConfigs)]
  }), { skipPollingRefresh: true });
  renderMotoboyTable();
  paintTotals();
};

const removeCourierRow = (courierId) => {
  updateState((currentState) => ({
    ...currentState,
    couriers: currentState.couriers.filter((courier) => courier.id !== courierId)
  }), { skipPollingRefresh: true });

  if (!state.couriers.length) {
    state = normalizeState({
      ...state,
      couriers: [createEmptyCourier(state.rateConfigs)]
    });
  }

  renderMotoboyTable();
  paintTotals();
};

const addRateConfig = () => {
  updateState((currentState) => ({
    ...currentState,
    rateConfigs: [
      ...currentState.rateConfigs,
      {
        id: `taxa-${Date.now().toString(36)}`,
        name: `Nova taxa ${currentState.rateConfigs.length + 1}`,
        value: 0
      }
    ]
  }), { skipPollingRefresh: true });

  renderRatesTable();
  renderMotoboyTable();
  renderHubConfig();
  paintTotals();
};

const removeRateConfig = (rateId) => {
  if (state.rateConfigs.length === 1) {
    alert('Voce precisa manter pelo menos uma taxa configurada.');
    return;
  }

  updateState((currentState) => ({
    ...currentState,
    rateConfigs: currentState.rateConfigs.filter((rate) => rate.id !== rateId)
  }));

  renderRatesTable();
  renderMotoboyTable();
  renderHubConfig();
  paintTotals();
};

const buildSummaryHtml = () => {
  const totals = calculateTotals(state);
  const rateHeaders = state.rateConfigs
    .map((rate) => `<th style="padding:5px 6px;text-align:right;">${escapeHtml(rate.name)}</th>`)
    .join('');

  const courierRows = state.couriers
    .map((courier) => {
      const rateValues = state.rateConfigs
        .map((rate) => `<td style="padding:5px 6px;text-align:right;">${escapeHtml(courier.countsByRate[rate.id] || '0')}</td>`)
        .join('');

      const adjustment = `${courier.adjustmentSign}${formatCurrency(courier.adjustmentValue || 0)}`;

      return `
        <tr>
          <td style="padding:5px 6px;">${escapeHtml(courier.name || '-')}</td>
          ${rateValues}
          <td style="padding:5px 6px;text-align:right;">${adjustment}</td>
          <td style="padding:5px 6px;text-align:right;"><strong>${formatCurrency(
            calculateCourierTotal(courier, state.rateConfigs)
          )}</strong></td>
        </tr>
      `;
    })
    .join('');

  const hubRows = state.incomingOrders.length
    ? state.incomingOrders
      .map((order) => `
        <tr>
          <td style="padding:5px 6px;">${escapeHtml(order.operationalDate || getOperationalDate())}</td>
          <td style="padding:5px 6px;">${escapeHtml(order.sourceBranchName || '-')}</td>
          <td style="padding:5px 6px;">${escapeHtml(order.hubOrderId || '-')}</td>
          <td style="padding:5px 6px;text-align:right;">${formatCurrency(order.totalAmount)}</td>
        </tr>
      `)
      .join('')
    : `<tr><td colspan="4" style="padding:5px 6px;text-align:center;color:#666;">Nenhuma entrada do hub</td></tr>`;

  return `
    <div style="background:#fff;color:#111;font-family:Inter,Arial,sans-serif;padding:12px;max-width:760px;">
      <h2 style="margin:0 0 10px;text-align:center;color:#2b6cb0;font-size:1.05rem;">Finally Storage - Fechamento de Caixa</h2>
      <p style="margin:0 0 12px;text-align:center;font-size:0.7rem;color:#555;">Escala da imagem: 75%</p>

      <div style="margin-bottom:12px;">
        <strong style="display:block;margin-bottom:6px;font-size:0.78rem;">Motoboys</strong>
        <table style="width:100%;border-collapse:collapse;font-size:0.72rem;">
          <thead>
            <tr style="background:#eef4ff;">
              <th style="padding:5px 6px;text-align:left;">Nome</th>
              ${rateHeaders}
              <th style="padding:5px 6px;text-align:right;">Ajuste</th>
              <th style="padding:5px 6px;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>${courierRows}</tbody>
        </table>
        <div style="margin-top:8px;font-size:0.74rem;"><strong>Total Motoboys:</strong> R$ ${formatCurrency(totals.couriersTotal)}</div>
      </div>

      <div style="margin-bottom:12px;">
        <strong style="display:block;margin-bottom:6px;font-size:0.78rem;">Entradas do Hub</strong>
        <table style="width:100%;border-collapse:collapse;font-size:0.72rem;">
          <thead>
            <tr style="background:#eefaf1;">
              <th style="padding:5px 6px;text-align:left;">Data</th>
              <th style="padding:5px 6px;text-align:left;">Filial</th>
              <th style="padding:5px 6px;text-align:left;">Pedido</th>
              <th style="padding:5px 6px;text-align:right;">Valor</th>
            </tr>
          </thead>
          <tbody>${hubRows}</tbody>
        </table>
        <div style="margin-top:8px;font-size:0.74rem;"><strong>Total Hub:</strong> R$ ${formatCurrency(totals.incomingOrdersTotal)}</div>
      </div>

      <div style="margin-bottom:12px;">
        <strong style="display:block;margin-bottom:6px;font-size:0.78rem;">Caixa Manual</strong>
        <table style="width:100%;border-collapse:collapse;font-size:0.72rem;">
          <tbody>
            <tr><td style="padding:5px 6px;">Dinheiro</td><td style="padding:5px 6px;text-align:right;">R$ ${formatCurrency(state.cash.dinheiro)}</td></tr>
            <tr><td style="padding:5px 6px;">Cartao</td><td style="padding:5px 6px;text-align:right;">R$ ${formatCurrency(state.cash.cartao)}</td></tr>
            <tr><td style="padding:5px 6px;">Online</td><td style="padding:5px 6px;text-align:right;">R$ ${formatCurrency(state.cash.online)}</td></tr>
          </tbody>
        </table>
      </div>

      <div style="font-size:0.78rem;"><strong>Total Caixa:</strong> R$ ${formatCurrency(totals.cashTotal)}</div>
      <div style="margin-top:10px;text-align:center;font-size:0.66rem;color:#666;">Gerado em ${new Date().toLocaleString('pt-BR')}</div>
    </div>
  `;
};

const exportImage = () => {
  openPreviewModal(buildSummaryHtml, {
    initialDataUrl: state.lastPreviewImageDataUrl,
    previewZoom: 0.75,
    onPreviewGenerated: ({ dataUrl, generatedAt }) => {
      state = normalizeState({
        ...state,
        lastPreviewImageDataUrl: dataUrl,
        lastPreviewGeneratedAt: generatedAt
      });
      saveLocalStorage(state);
      renderPreviewStatus();
    }
  });
};

const scheduleHubPolling = () => {
  window.clearInterval(hubPollTimer);

  if (!state.hubConfig.enabled || !state.hubConfig.projectId) return;

  hubPollTimer = window.setInterval(() => {
    void synchronizeHub(true);
  }, state.hubConfig.pollIntervalSeconds * 1000);
};

const synchronizeHub = async (silent = false) => {
  if (hubSyncInFlight) return;
  hubSyncInFlight = true;

  if (!silent) {
    syncStatusEl.textContent = 'Sincronizando com o Delivery Hub...';
  }

  const nextState = await syncHubCommands(state);
  state = normalizeState(nextState);
  saveLocalStorage(state);
  renderMotoboyTable();
  renderIncomingOrders();
  renderHubConfig();
  renderHubLogs();
  renderPreviewStatus();
  paintTotals();
  scheduleHubPolling();

  hubSyncInFlight = false;
};

document.addEventListener('click', (event) => {
  const pageTrigger = event.target.closest('[data-page-trigger]');
  if (pageTrigger) {
    updateState((currentState) => ({
      ...currentState,
      activePage: pageTrigger.dataset.pageTrigger
    }), { skipPollingRefresh: true });
    renderPageVisibility();
    return;
  }

  if (event.target.closest('#addMotoboy')) {
    addCourierRow();
    return;
  }

  if (event.target.closest('#addRateBtn')) {
    addRateConfig();
    return;
  }

  if (event.target.closest('#exportImageBtn')) {
    exportImage();
    return;
  }

  if (event.target.closest('#syncHubBtn')) {
    void synchronizeHub();
    return;
  }

  if (event.target.closest('#clearIncomingOrdersBtn')) {
    updateState((currentState) => ({
      ...currentState,
      incomingOrders: []
    }), { skipPollingRefresh: true });
    renderIncomingOrders();
    paintTotals();
    return;
  }

  const removeCourierBtn = event.target.closest('[data-action="remove-courier"]');
  if (removeCourierBtn) {
    const row = removeCourierBtn.closest('tr');
    if (row?.dataset.courierId) {
      removeCourierRow(row.dataset.courierId);
    }
    return;
  }

  const removeRateBtn = event.target.closest('[data-action="remove-rate"]');
  if (removeRateBtn) {
    const row = removeRateBtn.closest('tr');
    if (row?.dataset.rateId) {
      removeRateConfig(row.dataset.rateId);
    }
  }
});

document.addEventListener('input', (event) => {
  if (event.target.closest('#motoboys-section')) {
    refreshCourierStateFromDom();
    return;
  }

  if (event.target.closest('#caixa-section')) {
    refreshCashStateFromDom();
    return;
  }

  if (event.target.closest('#rates-page')) {
    refreshRatesStateFromDom();
    return;
  }

  if (event.target.closest('#hub-page')) {
    refreshHubConfigFromDom();
  }
});

document.addEventListener('change', (event) => {
  if (event.target.closest('#motoboys-section')) {
    refreshCourierStateFromDom();
    return;
  }

  if (event.target.closest('#rates-page')) {
    refreshRatesStateFromDom();
    return;
  }

  if (event.target.closest('#hub-page')) {
    refreshHubConfigFromDom();
  }
});

window.addEventListener('online', () => {
  void synchronizeHub(true);
});

renderAll();
autosaveStatusEl.textContent = 'Autosave local ativo.';
if (state.hubConfig.enabled && state.hubConfig.projectId) {
  void synchronizeHub(true);
}
