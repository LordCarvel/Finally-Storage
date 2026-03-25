export function openPreviewModal(makeHtmlFn, options = {}) {
  const {
    initialDataUrl = '',
    previewZoom = 0.75,
    onPreviewGenerated = () => {}
  } = options;

  if (document.getElementById('preview-overlay')) return null;

  const overlay = document.createElement('div');
  overlay.id = 'preview-overlay';
  overlay.className = 'preview-overlay';

  const panel = document.createElement('div');
  panel.className = 'preview-panel';

  const content = document.createElement('div');
  content.className = 'preview-content';
  content.innerHTML = makeHtmlFn();
  content.style.zoom = String(previewZoom);

  const controls = document.createElement('div');
  controls.className = 'preview-controls';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'btn btn-secondary';
  closeBtn.textContent = 'Fechar';

  const generateBtn = document.createElement('button');
  generateBtn.type = 'button';
  generateBtn.className = 'btn btn-primary';
  generateBtn.textContent = 'Gerar pre-visualizacao';

  const downloadBtn = document.createElement('button');
  downloadBtn.type = 'button';
  downloadBtn.className = 'btn btn-primary';
  downloadBtn.textContent = 'Baixar imagem';
  downloadBtn.disabled = !initialDataUrl;

  const imageSlot = document.createElement('div');
  imageSlot.className = 'preview-image-slot';

  controls.append(closeBtn, generateBtn, downloadBtn);
  panel.append(content, imageSlot, controls);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  document.body.classList.add('preview-open');

  let lastDataUrl = initialDataUrl || '';

  const renderPreviewImage = (dataUrl) => {
    imageSlot.innerHTML = '';

    if (!dataUrl) return;

    const image = document.createElement('img');
    image.src = dataUrl;
    image.alt = 'Previa do fechamento';
    image.className = 'preview-generated-image';
    imageSlot.appendChild(image);
  };

  renderPreviewImage(lastDataUrl);

  const closeModal = () => {
    document.removeEventListener('keydown', escapeHandler);
    document.body.classList.remove('preview-open');
    overlay.remove();
  };

  const escapeHandler = (event) => {
    if (event.key === 'Escape') closeModal();
  };

  const buildCanvas = async () => {
    content.innerHTML = makeHtmlFn();
    content.style.zoom = String(previewZoom);
    return html2canvas(content, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
  };

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeModal();
  });
  document.addEventListener('keydown', escapeHandler);

  generateBtn.addEventListener('click', async () => {
    generateBtn.disabled = true;

    try {
      const canvas = await buildCanvas();
      lastDataUrl = canvas.toDataURL('image/png');
      downloadBtn.disabled = false;
      renderPreviewImage(lastDataUrl);
      onPreviewGenerated({
        dataUrl: lastDataUrl,
        generatedAt: new Date().toISOString()
      });
      imageSlot.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
      console.error(error);
      alert('Nao foi possivel gerar a pre-visualizacao da imagem.');
    } finally {
      generateBtn.disabled = false;
    }
  });

  downloadBtn.addEventListener('click', () => {
    if (!lastDataUrl) {
      alert('Gere a pre-visualizacao antes de baixar.');
      return;
    }

    const anchor = document.createElement('a');
    anchor.download = `fechamento-${new Date().toISOString().slice(0, 10)}.png`;
    anchor.href = lastDataUrl;
    anchor.click();
  });

  return { close: closeModal };
}
