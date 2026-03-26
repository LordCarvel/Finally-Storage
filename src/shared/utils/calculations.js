export const DEFAULT_RATE_CONFIGS = [
  { id: 'taxa-normal', name: 'Taxa normal', value: 0 },
  { id: 'picarras-1', name: 'Picarras 1', value: 0 },
  { id: 'picarras-2', name: 'Picarras 2', value: 0 },
  { id: 'picarras-3', name: 'Picarras 3', value: 0 }
];

export const DEFAULT_HUB_CONFIG = {
  enabled: false,
  baseUrl: 'http://127.0.0.1:8080',
  projectId: '',
  appId: 'finally-storage',
  pollIntervalSeconds: 20,
  defaultRateId: DEFAULT_RATE_CONFIGS[0].id
};

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

export const createId = (prefix = 'id') =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

export const normalizeRateConfigs = (rateConfigs = []) => {
  const source = Array.isArray(rateConfigs) && rateConfigs.length
    ? rateConfigs
    : DEFAULT_RATE_CONFIGS;

  return source.map((rate, index) => ({
    id: String(rate?.id || createId('rate')),
    name: String(rate?.name || `Taxa ${index + 1}`).trim(),
    value: parseNumber(rate?.value)
  }));
};

export const createEmptyCourier = (rateConfigs = DEFAULT_RATE_CONFIGS, courier = {}) => {
  const rates = normalizeRateConfigs(rateConfigs);
  const countsByRate = {};

  rates.forEach((rate) => {
    countsByRate[rate.id] = String(courier?.countsByRate?.[rate.id] ?? '').trim();
  });

  return {
    id: String(courier?.id || createId('courier')),
    hubCourierId: String(courier?.hubCourierId || '').trim(),
    name: String(courier?.name || '').trim(),
    countsByRate,
    adjustmentSign: courier?.adjustmentSign === '-' ? '-' : '+',
    adjustmentValue: String(courier?.adjustmentValue ?? '').trim()
  };
};

export const normalizeCouriers = (couriers = [], rateConfigs = DEFAULT_RATE_CONFIGS) => {
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

export const normalizeHubConfig = (hubConfig = {}, rateConfigs = DEFAULT_RATE_CONFIGS) => {
  const rates = normalizeRateConfigs(rateConfigs);
  const defaultRateId = rates.some((rate) => rate.id === hubConfig?.defaultRateId)
    ? hubConfig.defaultRateId
    : rates[0]?.id || DEFAULT_HUB_CONFIG.defaultRateId;

  return {
    enabled: Boolean(hubConfig?.enabled),
    baseUrl: String(hubConfig?.baseUrl || DEFAULT_HUB_CONFIG.baseUrl).trim().replace(/\/+$/, ''),
    projectId: String(hubConfig?.projectId ?? '').trim(),
    appId: DEFAULT_HUB_CONFIG.appId,
    pollIntervalSeconds: Math.max(
      5,
      Math.round(parseNumber(hubConfig?.pollIntervalSeconds) || DEFAULT_HUB_CONFIG.pollIntervalSeconds)
    ),
    defaultRateId
  };
};

export const normalizeAppState = (state = {}) => {
  const rateConfigs = normalizeRateConfigs(state.rateConfigs);

  return {
    rateConfigs,
    couriers: normalizeCouriers(state.couriers, rateConfigs),
    cash: {
      dinheiro: String(state?.cash?.dinheiro ?? '').trim(),
      cartao: String(state?.cash?.cartao ?? '').trim(),
      online: String(state?.cash?.online ?? '').trim()
    },
    incomingOrders: normalizeIncomingOrders(state.incomingOrders),
    hubConfig: normalizeHubConfig(state.hubConfig, rateConfigs),
    processedCommandIds: Array.isArray(state.processedCommandIds)
      ? state.processedCommandIds.map((value) => String(value)).filter(Boolean).slice(-300)
      : [],
    hubSync: {
      lastSyncAt: String(state?.hubSync?.lastSyncAt || ''),
      lastError: String(state?.hubSync?.lastError || ''),
      lastAppliedCommands: Array.isArray(state?.hubSync?.lastAppliedCommands)
        ? state.hubSync.lastAppliedCommands.slice(-8)
        : []
    }
  };
};

export const calculateCourierBaseTotal = (courier, rateConfigs = DEFAULT_RATE_CONFIGS) =>
  normalizeRateConfigs(rateConfigs).reduce((accumulator, rate) => {
    const deliveries = parseNumber(courier?.countsByRate?.[rate.id]);
    return accumulator + deliveries * rate.value;
  }, 0);

export const calculateCourierTotal = (courier, rateConfigs = DEFAULT_RATE_CONFIGS) => {
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

export const calculateCashTotal = (cash = {}, incomingOrders = []) =>
  parseNumber(cash.dinheiro)
  + parseNumber(cash.cartao)
  + parseNumber(cash.online)
  + calculateIncomingOrdersTotal(incomingOrders);

export const calculateTotals = (state) => {
  const normalizedState = normalizeAppState(state);
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
