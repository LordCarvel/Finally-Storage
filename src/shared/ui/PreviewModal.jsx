import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';

const PREVIEW_ZOOM = 0.75;

export function PreviewModal({
  html,
  initialImage = '',
  onClose,
  onGenerated
}) {
  const contentRef = useRef(null);
  const [generatedImage, setGeneratedImage] = useState(initialImage);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    document.body.classList.add('preview-open');
    return () => document.body.classList.remove('preview-open');
  }, []);

  const handleGenerate = async () => {
    if (!contentRef.current) return;

    setIsGenerating(true);

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const dataUrl = canvas.toDataURL('image/png');
      setGeneratedImage(dataUrl);
      onGenerated({
        dataUrl,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(error);
      alert('Nao foi possivel gerar a pre-visualizacao da imagem.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) {
      alert('Gere a pre-visualizacao antes de baixar.');
      return;
    }

    const anchor = document.createElement('a');
    anchor.download = `fechamento-${new Date().toISOString().slice(0, 10)}.png`;
    anchor.href = generatedImage;
    anchor.click();
  };

  return (
    <div className="preview-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="preview-panel">
        <div
          ref={contentRef}
          className="preview-content"
          style={{ zoom: PREVIEW_ZOOM, width: '1160px', maxWidth: '100%' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {generatedImage ? (
          <div className="preview-image-slot">
            <img
              className="preview-generated-image"
              src={generatedImage}
              alt="Previa do fechamento"
            />
          </div>
        ) : null}

        <div className="preview-controls">
          <button type="button" className="btn-modal-secondary" onClick={onClose}>
            Fechar
          </button>
          <button type="button" className="btn-modal-primary" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? 'Gerando...' : 'Gerar pre-visualizacao'}
          </button>
          <button type="button" className="btn-modal-primary" onClick={handleDownload} disabled={!generatedImage}>
            Baixar imagem
          </button>
        </div>
      </div>
    </div>
  );
}
