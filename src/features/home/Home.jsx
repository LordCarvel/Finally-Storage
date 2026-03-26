import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '../../shared/context/AppStateContext';
import { Icon } from '../../shared/ui/Icon';
import { PreviewModal } from '../../shared/ui/PreviewModal';
import {
  calculateCourierTotal,
  calculateTotals,
  formatCurrency
} from '../../shared/utils/calculations';
import './Home.css';

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDateTime = (value) => {
  if (!value) return 'Ainda nao salvo';

  try {
    return new Date(value).toLocaleString('pt-BR');
  } catch (error) {
    return value;
  }
};

const buildSummaryHtml = (appState) => {
  const totals = calculateTotals(appState);
  const incomingPaymentTotals = totals.incomingPaymentTotals;
  const reportConfig = appState.reportConfig;
  const hasCashPanel = reportConfig.showManualCashDetails || reportConfig.showEasyPrintBreakdown;

  const rateHeaders = appState.rateConfigs
    .map(
      (rate) => `
        <th style="padding:10px 12px;text-align:right;border-bottom:1px solid #d9d9d9;color:#5d89d3;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;line-height:1.5;">
          ${escapeHtml(rate.name)}
        </th>
      `
    )
    .join('');

  const courierRows = appState.couriers
    .map((courier) => {
      const counts = appState.rateConfigs
        .map(
          (rate) => `
            <td style="padding:10px 12px;text-align:right;border-bottom:1px solid #ececec;font-size:12px;line-height:1.6;">
              ${escapeHtml(courier.countsByRate[rate.id] || '0')}
            </td>
          `
        )
        .join('');

      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #ececec;font-size:12px;line-height:1.6;">
            ${escapeHtml(courier.name || '-')}
          </td>
          ${counts}
          <td style="padding:10px 12px;text-align:right;border-bottom:1px solid #ececec;font-size:12px;line-height:1.6;">
            ${escapeHtml(courier.adjustmentSign)}${formatCurrency(courier.adjustmentValue || 0)}
          </td>
          <td style="padding:10px 12px;text-align:right;border-bottom:1px solid #ececec;font-size:12px;color:#5d89d3;font-weight:700;line-height:1.6;">
            ${formatCurrency(calculateCourierTotal(courier, appState.rateConfigs))}
          </td>
        </tr>
      `;
    })
    .join('');

  const incomingRows = appState.incomingOrders.length
    ? appState.incomingOrders
      .map(
        (order) => `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #ececec;font-size:12px;line-height:1.6;">${escapeHtml(order.operationalDate || '-')}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #ececec;font-size:12px;line-height:1.6;">${escapeHtml(order.sourceBranchName || '-')}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #ececec;font-size:12px;line-height:1.6;">${escapeHtml(order.hubOrderId || '-')}</td>
            <td style="padding:10px 12px;text-align:right;border-bottom:1px solid #ececec;font-size:12px;line-height:1.6;">${formatCurrency(order.cashAmount)}</td>
            <td style="padding:10px 12px;text-align:right;border-bottom:1px solid #ececec;font-size:12px;line-height:1.6;">${formatCurrency(order.cardAmount)}</td>
            <td style="padding:10px 12px;text-align:right;border-bottom:1px solid #ececec;font-size:12px;line-height:1.6;">${formatCurrency(order.onlineAmount)}</td>
            <td style="padding:10px 12px;text-align:right;border-bottom:1px solid #ececec;font-size:12px;color:#5d89d3;font-weight:700;line-height:1.6;">${formatCurrency(order.totalAmount)}</td>
          </tr>
        `
      )
      .join('')
    : `
      <tr>
        <td colspan="7" style="padding:16px 12px;text-align:center;font-size:12px;color:#777777;line-height:1.7;">
          Nenhum pedido do EasyPrint no fechamento.
        </td>
      </tr>
    `;

  const reportSections = [];

  if (reportConfig.showSummaryCards) {
    reportSections.push(`
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:22px;">
        <div style="padding:14px 16px;background:#fcfafa;border:1px solid #d9d9d9;border-radius:14px;">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#888888;font-weight:700;line-height:1.5;">Total Motoboys</div>
          <div style="margin-top:6px;font-size:20px;font-weight:800;color:#5d89d3;">R$ ${formatCurrency(totals.couriersTotal)}</div>
        </div>
        <div style="padding:14px 16px;background:#fcfafa;border:1px solid #d9d9d9;border-radius:14px;">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#888888;font-weight:700;line-height:1.5;">Pedidos do EasyPrint</div>
          <div style="margin-top:6px;font-size:20px;font-weight:800;color:#5d89d3;">R$ ${formatCurrency(totals.incomingOrdersTotal)}</div>
        </div>
        <div style="padding:14px 16px;background:#fcfafa;border:1px solid #d9d9d9;border-radius:14px;">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#888888;font-weight:700;line-height:1.5;">Taxas Ativas</div>
          <div style="margin-top:6px;font-size:20px;font-weight:800;color:#5d89d3;">${appState.rateConfigs.length}</div>
        </div>
      </div>
    `);
  }

  if (reportConfig.showCourierTable || hasCashPanel) {
    reportSections.push(`
      <div style="display:grid;grid-template-columns:${reportConfig.showCourierTable && hasCashPanel ? 'minmax(0,1.2fr) minmax(280px,0.8fr)' : '1fr'};gap:18px;margin-bottom:${reportConfig.showIncomingOrdersTable ? '22px' : '0'};">
        ${reportConfig.showCourierTable ? `
        <div style="padding:16px;border:1px solid #d9d9d9;border-radius:16px;background:#ffffff;">
          <h3 style="margin:0 0 12px;color:#5d89d3;font-size:16px;line-height:1.5;">Motoboys e fechamento</h3>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr>
                <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #d9d9d9;color:#5d89d3;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;line-height:1.5;">Nome</th>
                ${rateHeaders}
                <th style="padding:10px 12px;text-align:right;border-bottom:1px solid #d9d9d9;color:#5d89d3;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;line-height:1.5;">Ajuste</th>
                <th style="padding:10px 12px;text-align:right;border-bottom:1px solid #d9d9d9;color:#5d89d3;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;line-height:1.5;">Total</th>
              </tr>
            </thead>
            <tbody>${courierRows}</tbody>
          </table>
        </div>
        ` : ''}
        ${hasCashPanel ? `
        <div style="padding:16px;border:1px solid #d9d9d9;border-radius:16px;background:#fcfafa;">
          <h3 style="margin:0 0 12px;color:#5d89d3;font-size:16px;line-height:1.5;">Caixa final</h3>
          <div style="display:grid;gap:10px;font-size:12px;line-height:1.7;">
            ${reportConfig.showManualCashDetails ? `
              <div style="display:flex;justify-content:space-between;gap:18px;"><span>Dinheiro manual</span><strong>R$ ${formatCurrency(appState.cash.dinheiro)}</strong></div>
              <div style="display:flex;justify-content:space-between;gap:18px;"><span>Cartao manual</span><strong>R$ ${formatCurrency(appState.cash.cartao)}</strong></div>
              <div style="display:flex;justify-content:space-between;gap:18px;"><span>Online manual</span><strong>R$ ${formatCurrency(appState.cash.online)}</strong></div>
            ` : ''}
            ${reportConfig.showEasyPrintBreakdown ? `
              <div style="display:flex;justify-content:space-between;gap:18px;"><span>EasyPrint dinheiro</span><strong>R$ ${formatCurrency(incomingPaymentTotals.dinheiro)}</strong></div>
              <div style="display:flex;justify-content:space-between;gap:18px;"><span>EasyPrint cartao</span><strong>R$ ${formatCurrency(incomingPaymentTotals.cartao)}</strong></div>
              <div style="display:flex;justify-content:space-between;gap:18px;"><span>EasyPrint online</span><strong>R$ ${formatCurrency(incomingPaymentTotals.online)}</strong></div>
              ${incomingPaymentTotals.unmapped
                ? `<div style="display:flex;justify-content:space-between;gap:18px;"><span>Nao classificado</span><strong>R$ ${formatCurrency(incomingPaymentTotals.unmapped)}</strong></div>`
                : ''}
            ` : ''}
            <div style="margin-top:4px;padding-top:10px;border-top:1px solid #d9d9d9;display:flex;justify-content:space-between;gap:18px;font-size:14px;">
              <span style="font-weight:700;">Total geral</span>
              <strong style="color:#5d89d3;font-size:18px;">R$ ${formatCurrency(totals.cashTotal)}</strong>
            </div>
          </div>
        </div>
        ` : ''}
      </div>
    `);
  }

  if (reportConfig.showIncomingOrdersTable) {
    reportSections.push(`
      <div style="padding:16px;border:1px solid #d9d9d9;border-radius:16px;background:#ffffff;">
        <h3 style="margin:0 0 12px;color:#5d89d3;font-size:16px;line-height:1.5;">Pedidos do EasyPrint</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #d9d9d9;color:#5d89d3;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;line-height:1.5;">Data</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #d9d9d9;color:#5d89d3;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;line-height:1.5;">Filial</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #d9d9d9;color:#5d89d3;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;line-height:1.5;">Pedido</th>
              <th style="padding:10px 12px;text-align:right;border-bottom:1px solid #d9d9d9;color:#5d89d3;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;line-height:1.5;">Dinheiro</th>
              <th style="padding:10px 12px;text-align:right;border-bottom:1px solid #d9d9d9;color:#5d89d3;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;line-height:1.5;">Cartao</th>
              <th style="padding:10px 12px;text-align:right;border-bottom:1px solid #d9d9d9;color:#5d89d3;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;line-height:1.5;">Online</th>
              <th style="padding:10px 12px;text-align:right;border-bottom:1px solid #d9d9d9;color:#5d89d3;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;line-height:1.5;">Total</th>
            </tr>
          </thead>
          <tbody>${incomingRows}</tbody>
        </table>
      </div>
    `);
  }

  if (!reportSections.length) {
    reportSections.push(`
      <div style="padding:20px;border:1px solid #d9d9d9;border-radius:16px;background:#fcfafa;text-align:center;font-size:13px;color:#666666;line-height:1.8;">
        Nenhuma secao detalhada selecionada. O relatorio vai sair apenas com o cabecalho e o total geral.
      </div>
    `);
  }

  return `
    <div style="width:980px;max-width:980px;background:#ffffff;color:#000000;font-family:Inter,Arial,sans-serif;padding:22px;border:1px solid #d9d9d9;border-radius:20px;">
      <div style="display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:22px;">
        <div>
          <div style="color:#77a2e8;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;line-height:1.6;">Finally Storage</div>
          <h2 style="margin:10px 0 0;font-size:24px;color:#5d89d3;line-height:1.4;">Fechamento de Caixa</h2>
          <p style="margin:10px 0 0;font-size:12px;color:#666666;line-height:1.8;">Relatorio otimizado para leitura rapida.</p>
        </div>
        <div style="padding:16px 18px;background:#eef5ff;border-radius:16px;min-width:250px;">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#5c6e90;font-weight:700;line-height:1.5;">Total do Caixa</div>
          <div style="margin-top:8px;font-size:26px;font-weight:800;color:#5d89d3;line-height:1.4;">R$ ${formatCurrency(totals.cashTotal)}</div>
        </div>
      </div>
      ${reportSections.join('')}
    </div>
  `;
};

export function Home() {
  const { appState, previewImage, lastSavedAt, actions } = useAppState();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const totals = useMemo(() => calculateTotals(appState), [appState]);
  const summaryHtml = useMemo(() => buildSummaryHtml(appState), [appState]);
  const incomingPaymentTotals = totals.incomingPaymentTotals;
  const reportConfig = appState.reportConfig;

  const autosaveText = lastSavedAt
    ? `Autosave local ativo. Ultima gravacao: ${formatDateTime(lastSavedAt)}`
    : 'Autosave local ativo.';

  const hubStatusText = appState.hubSync.lastError
    ? appState.hubSync.lastError
    : appState.hubSync.lastSyncAt
      ? `Ultima sincronizacao: ${formatDateTime(appState.hubSync.lastSyncAt)}`
      : 'Configure o hub para receber comandos automaticos no fechamento.';

  const savedPreviewText = previewImage?.generatedAt
    ? `Ultima imagem salva localmente em ${formatDateTime(previewImage.generatedAt)}`
    : 'Nenhuma imagem salva localmente ainda.';

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div>
          <p className="page-eyebrow">Funcoes do Projeto</p>
          <h2 className="page-title">Operacao diaria separada das configuracoes</h2>
          <p className="page-description">
            Esta pagina fica so com as funcoes operacionais do app: fechamento, motoboys, entradas do hub,
            caixa final e exportacao da imagem. Taxas e Hub ficam nas paginas separadas de configuracao.
          </p>
        </div>

        <div className="page-hero-meta">
          <div className="status-note">{autosaveText}</div>
          <div className={`status-note ${appState.hubSync.lastError ? 'status-note-error' : ''}`}>
            {hubStatusText}
          </div>

          <div className="page-link-row">
            <Link to="/taxas" className="page-link-chip">
              Configurar taxas
            </Link>
            <Link to="/integracao-hub" className="page-link-chip">
              Configurar hub
            </Link>
          </div>
        </div>
      </section>

      <section className="home-summary-grid">
        <article className="summary-card">
          <span className="summary-label">Total Motoboys</span>
          <strong className="summary-value">R$ {formatCurrency(totals.couriersTotal)}</strong>
          <span className="summary-footnote">Somatorio automatico por taxa e ajuste</span>
        </article>

        <article className="summary-card">
          <span className="summary-label">Pedidos do EasyPrint</span>
          <strong className="summary-value">R$ {formatCurrency(totals.incomingOrdersTotal)}</strong>
          <span className="summary-footnote">{appState.incomingOrders.length} pedido(s) recebidos via hub</span>
        </article>

        <article className="summary-card">
          <span className="summary-label">Total Caixa</span>
          <strong className="summary-value">R$ {formatCurrency(totals.cashTotal)}</strong>
          <span className="summary-footnote">Manual + EasyPrint separado por forma de pagamento</span>
        </article>
      </section>

      <section className="card">
        <div className="section-header">
          <div className="section-heading">
            <h3 className="section-title">Motoboys</h3>
            <p className="section-description">
              Cada taxa vira uma coluna automaticamente. O total por motoboy e calculado sem depender de valor fixo manual.
            </p>
          </div>

          <div className="section-actions">
            <button type="button" className="btn btn-primary" onClick={actions.addCourier}>
              + Adicionar motoboy
            </button>
          </div>
        </div>

        <div className="table-shell">
          <table className="data-table responsive-table courier-table">
            <thead>
              <tr>
                <th>Nome</th>
                {appState.rateConfigs.map((rate) => (
                  <th key={rate.id}>
                    {rate.name}
                    <small>R$ {formatCurrency(rate.value)}</small>
                  </th>
                ))}
                <th>Ajuste</th>
                <th>Total</th>
                <th>Acoes</th>
              </tr>
            </thead>

            <tbody>
              {appState.couriers.map((courier) => (
                <tr key={courier.id}>
                  <td data-label="Nome">
                    <input
                      type="text"
                      className="input"
                      value={courier.name}
                      placeholder="Nome do motoboy"
                      onChange={(event) => actions.updateCourier(courier.id, { name: event.target.value })}
                    />
                  </td>

                  {appState.rateConfigs.map((rate) => (
                    <td key={rate.id} data-label={rate.name}>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="input home-compact-input"
                        value={courier.countsByRate[rate.id]}
                        placeholder="0"
                        onChange={(event) =>
                          actions.updateCourier(courier.id, {
                            countsByRate: {
                              [rate.id]: event.target.value
                            }
                          })
                        }
                      />
                    </td>
                  ))}

                  <td data-label="Ajuste">
                    <div className="adjustment-field">
                      <select
                        className="select"
                        value={courier.adjustmentSign}
                        onChange={(event) =>
                          actions.updateCourier(courier.id, {
                            adjustmentSign: event.target.value
                          })
                        }
                      >
                        <option value="+">+</option>
                        <option value="-">-</option>
                      </select>

                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        value={courier.adjustmentValue}
                        placeholder="0,00"
                        onChange={(event) =>
                          actions.updateCourier(courier.id, {
                            adjustmentValue: event.target.value
                          })
                        }
                      />
                    </div>
                  </td>

                  <td data-label="Total">
                    <strong>R$ {formatCurrency(calculateCourierTotal(courier, appState.rateConfigs))}</strong>
                  </td>

                  <td data-label="Acoes">
                    <button
                      type="button"
                      className="btn btn-danger btn-icon"
                      onClick={() => actions.removeCourier(courier.id)}
                    >
                      <Icon name="trash" size={15} />
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="home-lower-grid">
        <article className="card">
          <div className="section-header">
            <div className="section-heading">
              <h3 className="section-title">Pedidos do EasyPrint</h3>
              <p className="section-description">
                Pedidos do EasyPrint recebidos via hub entram separados em dinheiro, cartao e online.
              </p>
            </div>

            <div className="section-actions">
              <button type="button" className="btn btn-secondary" onClick={actions.clearIncomingOrders}>
                Limpar entradas
              </button>
            </div>
          </div>

          <div className="table-shell">
            <table className="data-table responsive-table orders-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Filial</th>
                  <th>Pedido</th>
                  <th>Dinheiro</th>
                  <th>Cartao</th>
                  <th>Online</th>
                  <th>Total</th>
                  <th>Recebido</th>
                </tr>
              </thead>

              <tbody>
                {appState.incomingOrders.length ? (
                  appState.incomingOrders.map((order) => (
                    <tr key={order.hubOrderId || `${order.sourceBranchId}-${order.receivedAt}`}>
                      <td data-label="Data">{order.operationalDate || '-'}</td>
                      <td data-label="Filial">{order.sourceBranchName || '-'}</td>
                      <td data-label="Pedido">{order.hubOrderId || '-'}</td>
                      <td data-label="Dinheiro">R$ {formatCurrency(order.cashAmount)}</td>
                      <td data-label="Cartao">R$ {formatCurrency(order.cardAmount)}</td>
                      <td data-label="Online">R$ {formatCurrency(order.onlineAmount)}</td>
                      <td data-label="Total">R$ {formatCurrency(order.totalAmount)}</td>
                      <td data-label="Recebido">{formatDateTime(order.receivedAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="empty-state">
                      Nenhum pedido do EasyPrint recebido ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <div className="home-side-column">
          <article className="card">
            <div className="section-header">
              <div className="section-heading">
                <h3 className="section-title">Configuracao do Relatorio</h3>
                <p className="section-description">
                  Escolha o que entra na imagem final para evitar um fechamento muito carregado.
                </p>
              </div>

              <div className="section-actions">
                <button type="button" className="btn btn-secondary" onClick={actions.resetReportConfig}>
                  Restaurar padrao
                </button>
              </div>
            </div>

            <div className="report-config-grid">
              <label className="field field-checkbox">
                <input
                  type="checkbox"
                  checked={reportConfig.showSummaryCards}
                  onChange={(event) => actions.setReportConfigField('showSummaryCards', event.target.checked)}
                />
                <div>
                  <div className="field-label">Mostrar resumo superior</div>
                  <div className="field-helper">Exibe os cards de totais no topo do relatorio.</div>
                </div>
              </label>

              <label className="field field-checkbox">
                <input
                  type="checkbox"
                  checked={reportConfig.showCourierTable}
                  onChange={(event) => actions.setReportConfigField('showCourierTable', event.target.checked)}
                />
                <div>
                  <div className="field-label">Mostrar tabela de motoboys</div>
                  <div className="field-helper">Mantem o detalhamento por taxa de cada motoboy.</div>
                </div>
              </label>

              <label className="field field-checkbox">
                <input
                  type="checkbox"
                  checked={reportConfig.showIncomingOrdersTable}
                  onChange={(event) => actions.setReportConfigField('showIncomingOrdersTable', event.target.checked)}
                />
                <div>
                  <div className="field-label">Mostrar pedidos do EasyPrint</div>
                  <div className="field-helper">Oculta a tabela dos pedidos recebidos quando quiser um layout mais limpo.</div>
                </div>
              </label>

              <label className="field field-checkbox">
                <input
                  type="checkbox"
                  checked={reportConfig.showManualCashDetails}
                  onChange={(event) => actions.setReportConfigField('showManualCashDetails', event.target.checked)}
                />
                <div>
                  <div className="field-label">Mostrar caixa manual</div>
                  <div className="field-helper">Exibe dinheiro, cartao e online preenchidos manualmente.</div>
                </div>
              </label>

              <label className="field field-checkbox">
                <input
                  type="checkbox"
                  checked={reportConfig.showEasyPrintBreakdown}
                  onChange={(event) => actions.setReportConfigField('showEasyPrintBreakdown', event.target.checked)}
                />
                <div>
                  <div className="field-label">Mostrar rateio do EasyPrint</div>
                  <div className="field-helper">Exibe o detalhamento por dinheiro, cartao e online vindo do EasyPrint.</div>
                </div>
              </label>
            </div>
          </article>

          <article className="card">
            <div className="section-heading">
              <h3 className="section-title">Caixa Final</h3>
              <p className="section-description">
                Os valores manuais continuam editaveis e o EasyPrint entra separado por forma de pagamento.
              </p>
            </div>

            <div className="cash-grid">
              <label className="field">
                <span className="field-label">Dinheiro manual (R$)</span>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={appState.cash.dinheiro}
                  placeholder="0"
                  onChange={(event) => actions.setCashField('dinheiro', event.target.value)}
                />
              </label>

              <label className="field">
                <span className="field-label">Cartao manual (R$)</span>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={appState.cash.cartao}
                  placeholder="0"
                  onChange={(event) => actions.setCashField('cartao', event.target.value)}
                />
              </label>

              <label className="field">
                <span className="field-label">Online manual (R$)</span>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={appState.cash.online}
                  placeholder="0"
                  onChange={(event) => actions.setCashField('online', event.target.value)}
                />
              </label>

              <label className="field">
                <span className="field-label">EasyPrint dinheiro (R$)</span>
                <input
                  type="text"
                  className="input"
                  value={formatCurrency(incomingPaymentTotals.dinheiro)}
                  readOnly
                />
              </label>

              <label className="field">
                <span className="field-label">EasyPrint cartao (R$)</span>
                <input
                  type="text"
                  className="input"
                  value={formatCurrency(incomingPaymentTotals.cartao)}
                  readOnly
                />
              </label>

              <label className="field">
                <span className="field-label">EasyPrint online (R$)</span>
                <input
                  type="text"
                  className="input"
                  value={formatCurrency(incomingPaymentTotals.online)}
                  readOnly
                />
              </label>

              <label className="field">
                <span className="field-label">EasyPrint nao classificado (R$)</span>
                <input
                  type="text"
                  className="input"
                  value={formatCurrency(incomingPaymentTotals.unmapped)}
                  readOnly
                />
              </label>
            </div>

            <div className="totals-strip">
              <div className="total-chip">
                <div className="total-chip-label">Total Caixa</div>
                <div className="total-chip-value">R$ {formatCurrency(totals.cashTotal)}</div>
              </div>
            </div>
          </article>

          <article className="card">
            <div className="section-header">
              <div className="section-heading">
                <h3 className="section-title">Imagem do Fechamento</h3>
                <p className="section-description">
                  A pre-visualizacao agora abre em escala reduzida e a ultima imagem fica salva no localStorage.
                </p>
              </div>

              <div className="section-actions">
                <button type="button" className="btn btn-primary" onClick={() => setIsPreviewOpen(true)}>
                  <Icon name="report" size={16} />
                  Exportar imagem
                </button>
              </div>
            </div>

            <div className="status-note">{savedPreviewText}</div>
            <p className="hint-text">Escala aplicada na imagem: 75%.</p>
          </article>
        </div>
      </section>

      {isPreviewOpen ? (
        <PreviewModal
          html={summaryHtml}
          initialImage={previewImage?.dataUrl || ''}
          onClose={() => setIsPreviewOpen(false)}
          onGenerated={({ dataUrl, generatedAt }) => actions.setPreviewImage({ dataUrl, generatedAt })}
        />
      ) : null}
    </div>
  );
}
