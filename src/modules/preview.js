// Preview modal: shows non-editable summary, generates preview image via html2canvas
// Usage: openPreviewModal(makeHtmlFn)
// makeHtmlFn should return an HTML string with the summary content.

export function openPreviewModal(makeHtmlFn) {
  // Prevent multiple modals
  if (document.getElementById('preview-overlay')) return null;

  const overlay = document.createElement('div');
  overlay.id = 'preview-overlay';
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.background = 'rgba(0,0,0,0.35)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '99999';

  const panel = document.createElement('div');
  panel.id = 'resumo-panel';
  panel.style.background = '#fff';
  panel.style.border = '2px solid #77A2E8';
  panel.style.borderRadius = '12px';
  panel.style.boxShadow = '0 8px 40px rgba(0,0,0,0.12)';
  panel.style.width = 'min(720px, 95vw)';
  panel.style.maxHeight = 'calc(100vh - 40px)';
  panel.style.overflow = 'auto';
  panel.style.position = 'relative';
  panel.style.padding = '1.2rem';
  panel.style.fontFamily = 'Inter, Arial, sans-serif';
  panel.style.color = '#222';

  const content = document.createElement('div');
  content.id = 'preview-content';
  // ensure some right padding so right-aligned numbers aren't clipped when rendered
  content.style.padding = '0.4rem 0.6rem 0.8rem 0.2rem';
  content.style.boxSizing = 'border-box';
  content.innerHTML = makeHtmlFn();

  const controls = document.createElement('div');
  controls.style.position = 'sticky';
  controls.style.bottom = '0';
  controls.style.display = 'flex';
  controls.style.justifyContent = 'flex-end';
  controls.style.gap = '0.6rem';
  controls.style.padding = '0.6rem 0';
  controls.style.background = 'linear-gradient(transparent, rgba(255,255,255,0.95))';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.padding = '0.5rem 0.8rem';
  closeBtn.style.borderRadius = '8px';
  closeBtn.style.border = 'none';
  closeBtn.style.background = '#eee';
  closeBtn.style.cursor = 'pointer';

  const generateBtn = document.createElement('button');
  generateBtn.textContent = 'Generate preview';
  generateBtn.style.padding = '0.5rem 0.9rem';
  generateBtn.style.borderRadius = '8px';
  generateBtn.style.border = 'none';
  generateBtn.style.background = '#77A2E8';
  generateBtn.style.color = '#fff';
  generateBtn.style.cursor = 'pointer';

  const downloadBtn = document.createElement('button');
  downloadBtn.textContent = 'Download image';
  downloadBtn.style.padding = '0.5rem 0.9rem';
  downloadBtn.style.borderRadius = '8px';
  downloadBtn.style.border = 'none';
  downloadBtn.style.background = '#2b6cb0';
  downloadBtn.style.color = '#fff';
  downloadBtn.style.cursor = 'pointer';
  downloadBtn.disabled = true;

  controls.appendChild(closeBtn);
  controls.appendChild(generateBtn);
  controls.appendChild(downloadBtn);

  panel.appendChild(content);
  panel.appendChild(controls);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  let lastDataUrl = null;
  let previewNode = null;
  let genCounter = 0;

  function closeModal() {
    document.removeEventListener('keydown', escHandler);
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    lastDataUrl = null;
    previewNode = null;
  }

  function escHandler(e) { if (e.key === 'Escape') closeModal(); }
  document.addEventListener('keydown', escHandler);

  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  closeBtn.addEventListener('click', closeModal);

  generateBtn.addEventListener('click', () => {
    const thisGen = ++genCounter;
    generateBtn.disabled = true;
    // refresh content (in case underlying inputs changed)
    content.innerHTML = makeHtmlFn();
    // remove old preview
    if (previewNode) { previewNode.remove(); previewNode = null; }
    // generate image
    html2canvas(content, { scale: 2, useCORS: true }).then(canvas => {
      if (thisGen !== genCounter) return; // stale
      lastDataUrl = canvas.toDataURL('image/png');
      const img = document.createElement('img');
      img.src = lastDataUrl;
      img.style.maxWidth = '100%';
      img.style.borderRadius = '8px';
      img.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
      previewNode = document.createElement('div');
      previewNode.style.margin = '0.6rem 0 1rem 0';
      previewNode.style.display = 'flex';
      previewNode.style.justifyContent = 'center';
      previewNode.appendChild(img);
      panel.insertBefore(previewNode, controls);
      downloadBtn.disabled = false;
      previewNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }).catch(err => {
      console.error(err);
      alert('Error generating preview. See console.');
    }).finally(() => {
      if (thisGen === genCounter) generateBtn.disabled = false;
    });
  });

  downloadBtn.addEventListener('click', () => {
    if (!lastDataUrl) return alert('Generate preview first');
    const a = document.createElement('a');
    a.download = `summary-${new Date().toISOString().slice(0,10)}.png`;
    a.href = lastDataUrl;
    a.click();
  });

  return { close: closeModal };
}
