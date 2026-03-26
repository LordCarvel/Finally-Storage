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

  const rateHeaders = appState.rateConfigs
    .map(
      (rate) => `
        <th style="padding:8px 10px;text-align:right;border-bottom:1px solid #d9d9d9;color:#5d89d3;font-size:11px;letter-spacing:0.05em;text-transform:uppercase;">
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
            <td style="padding:8px 10px;text-align:right;border-bottom:1px solid #ececec;font-size:12px;">
              ${escapeHtml(courier.countsByRate[rate.id] || '0')}
            </td>
          `
        )
        .join('');

      return `
        <tr>
          <td style="padding:8px 10px;border-bottom:1px solid #ececec;font-size:12px;">
            ${escapeHtml(courier.name || '-')}
          </td>
          ${counts}
          <td style="padding:8px 10px;text-align:right;border-bottom:1px solid #ececec;font-size:12px;">
            ${escapeHtml(courier.adjustmentSign)}${formatCurrency(courier.adjustmentValue || 0)}
          </td>
          <td style="padding:8px 10px;text-align:right;border-bottom:1px solid #ececec;font-size:12px;color:#5d89d3;font-weight:700;">
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
            <td style="padding:8px 10px;border-bottom:1px solid #ececec;font-size:12px;">${escapeHtml(order.operationalDate || '-')}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #ececec;font-size:12px;">${escapeHtml(order.sourceBranchName || '-')}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #ececec;font-size:12px;">${escapeHtml(order.hubOrderId || '-')}</td>
            <td style="padding:8px 10px;text-align:right;border-bottom:1px solid #ececec;font-size:12px;color:#5d89d3;font-weight:700;">${formatCurrency(order.totalAmount)}</td>
          </tr>
        `
      )
      .join('')
    : `
      <tr>
        <td colspan="4" style="padding:12px 10px;text-align:center;font-size:12px;color:#777777;">
          Nenhum pedido do hub no fechamento.
        </td>
      </tr>
    `;

  return `
    <div style="width:960px;max-width:960px;background:#ffffff;color:#000000;font-family:Inter,Arial,sans-serif;padding:18px;border:1px solid #d9d9d9;border-radius:18px;">
      <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:16px;">
        <div>
          <div style="color:#77a2e8;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Finally Storage</div>
          <h2 style="margin:8px 0 0;font-size:24px;color:#5d89d3;">Fechamento de Caixa</h2>
          <p style="margin:8px 0 0;font-size:12px;color:#555555;">Imagem gerada em escala reduzida para nao cortar no download.</p>
        </div>
        <div style="padding:12px 14px;background:#eef5ff;border-radius:14px;min-width:240px;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#5c6e90;font-weight:700;">Total do Caixa</div>
          <div style="margin-top:6px;font-size:26px;font-weight:800;color:#5d89d3;">R$ ${formatCurrency(totals.cashTotal)}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:18px;">
        <div style="padding:12px 14px;background:#fcfafa;border:1px solid #d9d9d9;border-radius:14px;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#888888;font-weight:700;">Total Motoboys</div>
          <div style="margin-top:6px;font-size:20px;font-weight:800;color:#5d89d3;">R$ ${formatCurrency(totals.couriersTotal)}</div>
        </div>
        <div style="padding:12px 14px;background:#fcfafa;border:1px solid #d9d9d9;border-radius:14px;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#888888;font-weight:700;">Pedidos do Hub</div>
          <div style="margin-top:6px;font-size:20px;font-weight:800;color:#5d89d3;">R$ ${formatCurrency(totals.incomingOrdersTotal)}</div>
        </div>
        <div style="padding:12px 14px;background:#fcfafa;border:1px solid #d9d9d9;border-radius:14px;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#888888;font-weight:700;">Taxas Ativas</div>
          <div style="margin-top:6px;font-size:20px;font-weight:800;color:#5d89d3;">${appState.rateConfigs.length}</div>
        </div>
      </div>

      <div style="margin-bottom:18px;">
        <h3 style="margin:0 0 10px;color:#5d89d3;font-size:16px;">Motoboys</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="padding:8px 10px;text-align:left;border-bottom:1px solid #d9d9d9;color:#5d89d3;font-size:11px;letter-spacing:0.05em;text-transform:uppercase;">Nome</th>
              ${rateHeaders}
              <th style="padding:8px 10px;text-align:right;border-bottom:1px solid #d9d9d9;color:#5d89d3;font-size:11px;letter-spacing:0.05em;text-transform:uppercase;">Ajuste</th>
              <th style="padding:8px 10px;text-align:right;border-bottom:1px solid #d9d9d9;color:#5d89d3;font-size:11px;letter-spacing:0.05em;text-transform:uppercase;">Total</th>
            </tr>
          </thead>
          <tbody>${courierRows}</tbody>
        </table>
      </div>

      <div style="display:grid;grid-template-columns:minmax(0,1.1fr) minmax(280px,0.9fr);gap:16px;">
        <div>
          <h3 style="margin:0 0 10px;color:#5d89d3;font-size:16px;">Pedidos do Hub</h3>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr>
                <th style="padding:8px 10px;text-align:left;border-bottom:1px solid #d9d9d9;color:#5d89d3;font-size:11px;letter-spacing:0.05em;text-transform:uppercase;">Data</th>
                <th style="padding:8px 10px;text-align:left;border-bottom:1px solid #d9d9d9;color:#5d89d3;font-size:11px;letter-spacing:0.05em;text-transform:uppercase;">Filial</th>
                <th style="padding:8px 10px;text-align:left;border-bottom:1px solid #d9d9d9;color:#5d89d3;font-size:11px;letter-spacing:0.05em;text-transform:uppercase;">Pedido</th>
                <th style="padding:8px 10px;text-align:right;border-bottom:1px solid #d9d9d9;color:#5d89d3;font-size:11px;letter-spacing:0.05em;text-transform:uppercase;">Valor</th>
              </tr>
            </thead>
            <tbody>${incomingRows}</tbody>
          </table>
        </div>

        <div style="padding:14px;border:1px solid #d9d9d9;border-radius:16px;background:#fcfafa;">
          <h3 style="margin:0 0 10px;color:#5d89d3;font-size:16px;">Caixa</h3>
          <div style="display:grid;gap:8px;font-size:12px;">
            <div style="display:flex;justify-content:space-between;gap:12px;"><span>Dinheiro</span><strong>R$ ${formatCurrency(appState.cash.dinheiro)}</strong></div>
            <div style="display:flex;justify-content:space-between;gap:12px;"><span>Cartao</span><strong>R$ ${formatCurrency(appState.cash.cartao)}</strong></div>
            <div style="display:flex;justify-content:space-between;gap:12px;"><span>Online</span><strong>R$ ${formatCurrency(appState.cash.online)}</strong></div>
            <div style="display:flex;justify-content:space-between;gap:12px;"><span>Hub</span><strong>R$ ${formatCurrency(totals.incomingOrdersTotal)}</strong></div>
          </div>
        </div>
      </div>
    </div>
  `;
};

export function Home() {
  const { appState, previewImage, lastSavedAt, actions } = useAppState();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const totals = useMemo(() => calculateTotals(appState), [appState]);
  const summaryHtml = useMemo(() => buildSummaryHtml(appState), [appState]);

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
          <p className="page-eyebrow">Finally Storage</p>
          <h2 className="page-title">Fechamento de caixa com taxas dinamicas</h2>
          <p className="page-description">
            O fechamento continua na tela principal. As configuracoes de taxas e do Delivery Hub ficam
            separadas, em paginas proprias, sem misturar o fluxo operacional do dia.
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
          <span className="summary-label">Pedidos do Hub</span>
          <strong className="summary-value">R$ {formatCurrency(totals.incomingOrdersTotal)}</strong>
          <span className="summary-footnote">{appState.incomingOrders.length} pedido(s) somados ao caixa</span>
        </article>

        <article className="summary-card">
          <span className="summary-label">Total Caixa</span>
          <strong className="summary-value">R$ {formatCurrency(totals.cashTotal)}</strong>
          <span className="summary-footnote">Dinheiro + cartao + online + pedidos recebidos</span>
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
              <h3 className="section-title">Entradas do Hub</h3>
              <p className="section-description">
                Pedidos vindos do Delivery Hub entram aqui e somam automaticamente no caixa final.
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
                  <th>Valor</th>
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
                      <td data-label="Valor">R$ {formatCurrency(order.totalAmount)}</td>
                      <td data-label="Recebido">{formatDateTime(order.receivedAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      Nenhum pedido recebido do hub ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <div className="home-side-column">
          <article className="card">
            <div className="section-heading">
              <h3 className="section-title">Caixa Final</h3>
              <p className="section-description">
                Os valores manuais continuam separados do total vindo do hub.
              </p>
            </div>

            <div className="cash-grid">
              <label className="field">
                <span className="field-label">Dinheiro (R$)</span>
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
                <span className="field-label">Cartao (R$)</span>
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
                <span className="field-label">Online (R$)</span>
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
                <span className="field-label">Pedidos do Hub (R$)</span>
                <input
                  type="text"
                  className="input"
                  value={formatCurrency(totals.incomingOrdersTotal)}
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
