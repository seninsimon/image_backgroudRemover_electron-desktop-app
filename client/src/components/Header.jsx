import React, { useRef } from 'react';
import { Gem, Upload, Zap, Download } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function Header({ imageCount, processedCount, onUpload, onProcessAll, images, apiUrl }) {
  const fileRef = useRef();

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) onUpload(files);
    e.target.value = '';
  };

  const handleBulkDownload = async () => {
    const completed = images.filter(i => i.status === 'completed' && i.processedUrl);
    if (completed.length === 0) return;

    if (completed.length === 1) {
      // Single file — direct download
      const link = document.createElement('a');
      link.href = completed[0].processedUrl;
      link.download = completed[0].file?.name || 'processed.jpg';
      link.click();
      return;
    }

    // Multiple — zip
    const zip = new JSZip();
    const folder = zip.folder('processed-images');

    for (let i = 0; i < completed.length; i++) {
      try {
        const resp = await fetch(completed[i].processedUrl);
        const blob = await resp.blob();
        const name = completed[i].file?.name || `image-${i + 1}.jpg`;
        folder.file(name, blob);
      } catch (err) {
        console.error('Error fetching for zip', err);
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'jewelry-processed.zip');
  };

  return (
    <header style={{
      height: 52,
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      flexShrink: 0,
      zIndex: 50,
    }}>
      {/* Left: Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, var(--accent), #a29bfe)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Gem size={18} color="#fff" />
        </div> */}
        <span style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
          ImgAI Studio
        </span>
        <span style={{
          fontSize: '0.65rem', fontWeight: 600,
          background: 'var(--accent-glow)', color: 'var(--accent)',
          padding: '2px 8px', borderRadius: 4, marginLeft: 4, letterSpacing: '0.04em',
        }}>
          BETA
        </span>
      </div>

      {/* Center: Stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <span>{imageCount} image{imageCount !== 1 ? 's' : ''} loaded</span>
        <span style={{ color: 'var(--success)' }}>{processedCount} processed</span>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="file" multiple accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={handleFiles} />

        <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
          <Upload size={14} /> Add Images
        </button>

        {imageCount > 0 && (
          <button className="btn-accent" onClick={onProcessAll}>
            <Zap size={14} /> Process All
          </button>
        )}

        {processedCount > 0 && (
          <button className="btn-ghost" onClick={handleBulkDownload}>
            <Download size={14} /> Bulk Download
          </button>
        )}
      </div>
    </header>
  );
}
