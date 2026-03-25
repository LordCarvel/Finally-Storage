const DEFAULT_RATE_BLUEPRINTS = [
  { id: 'taxa-normal', name: 'Taxa normal', value: 0 },
  { id: 'picarras-1', name: 'Picarras 1', value: 0 },
  { id: 'picarras-2', name: 'Picarras 2', value: 0 },
  { id: 'picarras-3', name: 'Picarras 3', value: 0 }
];

const DEFAULT_CASH = {
  dinheiro: '',
  cartao: '',
  online: ''
};

export const DEFAULT_HUB_CONFIG = {
  enabled: false,
  baseUrl: 'http://127.0.0.1:8080',
  projectId: '',
  appId: 'finally-storage',
  pollIntervalSeconds: 20,
  defaultRateId: DEFAULT_RATE_BLUEPRINTS[0].id
};

const createSafeId = (prefix = 'id') =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

export const parseNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  const normalized = String(value ?? '')
    .replace(/\s+/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatCurrency = (value) =>
  parseNumber(value).toFixed(2).replace('.', ',');

export const getOperationalDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const normalizeRateConfigs = (rateConfigs = []) => {
  const source = Array.isArray(rateConfigs) && rateConfigs.length
    ? rateConfigs
    : DEFAULT_RATE_BLUEPRINTS;

  return source.map((rate, index) => ({
    id: String(rate?.id || createSafeId('rate')),
    name: String(rate?.name || `Taxa ${index + 1}`).trim(),
    value: parseNumber(rate?.value)
  }));
};

export const createEmptyCourier = (rateConfigs = DEFAULT_RATE_BLUEPRINTS, courier = {}) => {
  const rates = normalizeRateConfigs(rateConfigs);
  const countsByRate = {};

  rates.forEach((rate) => {
    countsByRate[rate.id] = String(courier?.countsByRate?.[rate.id] ?? '').trim();
  });

  return {
    id: String(courier?.id || createSafeId('courier')),
    hubCourierId: String(courier?.hubCourierId || '').trim(),
    name: String(courier?.name || '').trim(),
    countsByRate,
    adjustmentSign: courier?.adjustmentSign === '-' ? '-' : '+',
    adjustmentValue: String(courier?.adjustmentValue ?? '').trim()
  };
};

export const normalizeCouriers = (couriers = [], rateConfigs = DEFAULT_RATE_BLUEPRINTS) => {
  const source = Array.isArray(couriers) && couriers.length
    ? couriers
    : [createEmptyCourier(rateConfigs)];

  return source.map((courier) => createEmptyCourier(rateConfigs, courier));
};

export const normalizeIncomingOrders = (incomingOrders = []) =>
  (Array.isArray(incomingOrders) ? incomingOrders : [])
    .filter(Boolean)
    .map((order) => ({
      hubOrderId: String(order?.hubOrderId || '').trim(),
      sourceBranchId: String(order?.sourceBranchId || '').trim(),
      sourceBranchName: String(order?.sourceBranchName || '').trim(),
      totalAmount: parseNumber(order?.totalAmount),
      operationalDate: String(order?.operationalDate || '').trim(),
      receivedAt: String(order?.receivedAt || '').trim()
    }));

export const normalizeHubConfig = (hubConfig = {}, rateConfigs = DEFAULT_RATE_BLUEPRINTS) => {
  const rates = normalizeRateConfigs(rateConfigs);
  const defaultRateId = rates.some((rate) => rate.id === hubConfig?.defaultRateId)
    ? hubConfig.defaultRateId
    : rates[0]?.id || DEFAULT_HUB_CONFIG.defaultRateId;

  return {
    enabled: Boolean(hubConfig?.enabled),
    baseUrl: String(hubConfig?.baseUrl || DEFAULT_HUB_CONFIG.baseUrl).trim().replace(/\/+$/, ''),
    projectId: String(hubConfig?.projectId ?? '').trim(),
    appId: DEFAULT_HUB_CONFIG.appId,
    pollIntervalSeconds: Math.max(5, Math.round(parseNumber(hubConfig?.pollIntervalSeconds) || DEFAULT_HUB_CONFIG.pollIntervalSeconds)),
    defaultRateId
  };
};

export const normalizeState = (state = {}) => {
  const rateConfigs = normalizeRateConfigs(state.rateConfigs);

  return {
    activePage: ['cash', 'rates', 'hub'].includes(state.activePage) ? state.activePage : 'cash',
    rateConfigs,
    couriers: normalizeCouriers(state.couriers, rateConfigs),
    cash: {
      dinheiro: String(state?.cash?.dinheiro ?? DEFAULT_CASH.dinheiro).trim(),
      cartao: String(state?.cash?.cartao ?? DEFAULT_CASH.cartao).trim(),
      online: String(state?.cash?.online ?? DEFAULT_CASH.online).trim()
    },
    incomingOrders: normalizeIncomingOrders(state.incomingOrders),
    hubConfig: normalizeHubConfig(state.hubConfig, rateConfigs),
    processedCommandIds: Array.isArray(state.processedCommandIds)
      ? state.processedCommandIds.map((value) => String(value)).filter(Boolean).slice(-300)
      : [],
    lastPreviewImageDataUrl: String(state.lastPreviewImageDataUrl || ''),
    lastPreviewGeneratedAt: String(state.lastPreviewGeneratedAt || ''),
    hubSync: {
      lastSyncAt: String(state?.hubSync?.lastSyncAt || ''),
      lastError: String(state?.hubSync?.lastError || ''),
      lastAppliedCommands: Array.isArray(state?.hubSync?.lastAppliedCommands)
        ? state.hubSync.lastAppliedCommands.slice(-8)
        : []
    }
  };
};

export const calculateCourierBaseTotal = (courier, rateConfigs = DEFAULT_RATE_BLUEPRINTS) =>
  normalizeRateConfigs(rateConfigs).reduce((accumulator, rate) => {
    const deliveries = parseNumber(courier?.countsByRate?.[rate.id]);
    return accumulator + deliveries * rate.value;
  }, 0);

export const calculateCourierTotal = (courier, rateConfigs = DEFAULT_RATE_BLUEPRINTS) => {
  const baseTotal = calculateCourierBaseTotal(courier, rateConfigs);
  const adjustmentValue = parseNumber(courier?.adjustmentValue);
  const signedAdjustment = courier?.adjustmentSign === '-' ? -adjustmentValue : adjustmentValue;
  return baseTotal + signedAdjustment;
};

export const calculateIncomingOrdersTotal = (incomingOrders = []) =>
  normalizeIncomingOrders(incomingOrders).reduce(
    (accumulator, order) => accumulator + parseNumber(order.totalAmount),
    0
  );

export const calculateCashTotal = (cash = DEFAULT_CASH, incomingOrders = []) =>
  parseNumber(cash.dinheiro)
  + parseNumber(cash.cartao)
  + parseNumber(cash.online)
  + calculateIncomingOrdersTotal(incomingOrders);

export const calculateTotals = (state) => {
  const normalizedState = normalizeState(state);

  const couriersTotal = normalizedState.couriers.reduce(
    (accumulator, courier) => accumulator + calculateCourierTotal(courier, normalizedState.rateConfigs),
    0
  );

  return {
    couriersTotal,
    incomingOrdersTotal: calculateIncomingOrdersTotal(normalizedState.incomingOrders),
    cashTotal: calculateCashTotal(normalizedState.cash, normalizedState.incomingOrders)
  };
};

export const createMotoboyRowElement = (courier, rateConfigs = DEFAULT_RATE_BLUEPRINTS) => {
  const row = document.createElement('tr');
  row.dataset.courierId = courier.id;

  const rateCells = normalizeRateConfigs(rateConfigs)
    .map((rate) => {
      const quantity = courier.countsByRate?.[rate.id] || '';
      return `
        <td data-label="${rate.name}">
          <input
            type="number"
            min="0"
            step="1"
            inputmode="numeric"
            data-role="rate-count"
            data-rate-id="${rate.id}"
            value="${quantity}"
            placeholder="0"
          >
        </td>
      `;
    })
    .join('');

  row.innerHTML = `
    <td data-label="Nome">
      <input type="text" data-role="courier-name" value="${courier.name}" placeholder="Nome do motoboy">
    </td>
    ${rateCells}
    <td data-label="Ajuste (R$)" class="ajuste-cell">
      <select class="ajuste-sign" data-role="adjustment-sign" aria-label="sinal ajuste">
        <option value="+" ${courier.adjustmentSign === '+' ? 'selected' : ''}>+</option>
        <option value="-" ${courier.adjustmentSign === '-' ? 'selected' : ''}>-</option>
      </select>
      <input
        type="number"
        step="0.01"
        inputmode="decimal"
        class="ajuste-input"
        data-role="adjustment-value"
        value="${courier.adjustmentValue}"
        placeholder="0"
      >
    </td>
    <td data-label="Total (R$)" class="total">${formatCurrency(
      calculateCourierTotal(courier, rateConfigs)
    )}</td>
    <td data-label="Ações" class="row-actions">
      <button type="button" class="btn btn-row-remove" data-action="remove-courier">Remover</button>
    </td>
  `;

  return row;
};
