import React from 'react';
import { Image as ImageIcon, Columns, Eye, EyeOff } from 'lucide-react';

export default function Canvas({ image, viewMode, onViewModeChange }) {
  if (!image) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
      }}>
        Select an image from the sidebar
      </div>
    );
  }

  const originalSrc = image.originalUrl;
  const processedSrc = image.processedUrl;
  const hasBoth = !!processedSrc;

  // Build CSS filter from edits
  const edits = image.edits || {};
  const filterStr = [
    `brightness(${(edits.brightness || 100) / 100})`,
    `contrast(${(edits.contrast || 100) / 100})`,
    `saturate(${(edits.saturation || 100) / 100})`,
    `hue-rotate(${edits.hue || 0}deg)`,
    `blur(${edits.blur || 0}px)`,
  ].join(' ');

  // What to show in main display
  const displaySrc = viewMode === 'original' ? originalSrc : (processedSrc || originalSrc);

  const imgStyle = {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    borderRadius: 4,
    filter: viewMode !== 'original' ? filterStr : 'none',
    transition: 'filter 0.15s ease',
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: 'var(--bg-primary)',
    }}>
      {/* Top bar: View toggle */}
      <div style={{
        height: 40,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-secondary)',
        flexShrink: 0,
      }}>
        {[
          { key: 'original', label: 'Original', icon: EyeOff },
          { key: 'processed', label: 'Processed', icon: Eye },
          { key: 'split', label: 'Compare', icon: Columns },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onViewModeChange(key)}
            style={{
              padding: '5px 14px',
              borderRadius: 6,
              fontSize: '0.75rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 0.15s ease',
              background: viewMode === key ? 'var(--accent)' : 'transparent',
              color: viewMode === key ? '#fff' : 'var(--text-muted)',
            }}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Canvas area */}
      <div className="checkerboard" style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        overflow: 'auto',
        gap: 16,
      }}>
        {viewMode === 'split' ? (
          <>
            {/* Side-by-side compare */}
            <div style={{
              flex: 1, maxWidth: '48%', height: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 8,
            }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Original
              </span>
              <img src={originalSrc} alt="Original" style={{ ...imgStyle, filter: 'none' }} />
            </div>
            <div style={{
              width: 1, alignSelf: 'stretch', background: 'var(--border-color)',
            }} />
            <div style={{
              flex: 1, maxWidth: '48%', height: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 8,
            }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Processed
              </span>
              {processedSrc ? (
                <img src={processedSrc} alt="Processed" style={imgStyle} />
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Not yet processed</div>
              )}
            </div>
          </>
        ) : (
          <img
            src={displaySrc}
            alt={viewMode}
            style={imgStyle}
            className="animate-fade-in"
          />
        )}
      </div>

      {/* Bottom info bar */}
      <div style={{
        height: 32,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-secondary)',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        flexShrink: 0,
      }}>
        <span>{image.file?.name || 'Unnamed'}</span>
        <span>{image.file ? `${(image.file.size / 1024).toFixed(0)} KB` : ''}</span>
      </div>
    </div>
  );
}
