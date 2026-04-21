import React, { useRef } from 'react';
import { X, ImagePlus, Loader, CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react';

const STATUS_CFG = {
  local:      { label: 'Ready',      cls: 'badge-uploaded',   icon: Clock },
  uploaded:   { label: 'Uploaded',   cls: 'badge-uploaded',   icon: Clock },
  processing: { label: 'AI Running', cls: 'badge-processing', icon: Loader },
  completed:  { label: 'Done',       cls: 'badge-completed',  icon: CheckCircle },
  failed:     { label: 'Failed',     cls: 'badge-failed',     icon: AlertCircle },
};

/* =====================
   Filmstrip Thumbnail
   ===================== */
function Thumbnail({ image, index, isActive, onSelect, onRemove }) {
  const st = STATUS_CFG[image.status] || STATUS_CFG.local;
  const IconComp = st.icon;
  const thumbSrc = image.processedUrl || image.originalUrl;

  return (
    <div
      onClick={() => onSelect(index)}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1',
        borderRadius: 8,
        overflow: 'hidden',
        cursor: 'pointer',
        border: isActive ? '2px solid var(--accent)' : '2px solid transparent',
        boxShadow: isActive ? '0 0 12px var(--accent-glow)' : 'none',
        transition: 'all 0.2s ease',
        flexShrink: 0,
      }}
    >
      <img
        src={thumbSrc}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {/* Status indicator */}
      <div style={{
        position: 'absolute', bottom: 3, left: 3,
        display: 'flex', alignItems: 'center', gap: 3,
      }}>
        <span className={`badge ${st.cls}`} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <IconComp size={9} className={image.status === 'processing' ? 'animate-spin' : ''} />
          {st.label}
        </span>
      </div>
      {/* Remove btn */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(index); }}
        style={{
          position: 'absolute', top: 3, right: 3,
          width: 20, height: 20, borderRadius: 4,
          background: 'rgba(0,0,0,0.6)', color: '#fff',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0.5, transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.5}
      >
        <X size={12} />
      </button>
    </div>
  );
}

/* =====================
   Metadata Panel
   ===================== */
function MetadataPanel({ metadata, onChange, onProcess, activeStatus }) {
  if (!metadata) return null;

  const selStyle = {
    width: '100%',
    padding: '7px 10px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-color)',
    borderRadius: 6,
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
    outline: 'none',
    cursor: 'pointer',
  };

  const labelStyle = {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 4,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 2px' }}>
      <div>
        <div style={labelStyle}>Background</div>
        <select style={selStyle} value={metadata.background} onChange={(e) => onChange('background', e.target.value)}>
          <option>White</option>
          <option>Black</option>
        </select>
      </div>

      <div>
        <div style={labelStyle}>Metal Colour</div>
        <select style={selStyle} value={metadata.metalColour} onChange={(e) => onChange('metalColour', e.target.value)}>
          <option>Gold</option>
          <option>Rose Gold</option>
          <option>Silver</option>
          <option>Platinum</option>
        </select>
      </div>

      <div>
        <div style={labelStyle}>Ornament Type</div>
        <select style={selStyle} value={metadata.ornamentType} onChange={(e) => onChange('ornamentType', e.target.value)}>
          <option>Ring</option>
          <option>Necklace</option>
          <option>Earring</option>
          <option>Pendant</option>
        </select>
      </div>

      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={metadata.hasChain}
            onChange={(e) => onChange('hasChain', e.target.checked)}
            style={{ accentColor: 'var(--accent)' }}
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Has Chain</span>
        </label>
      </div>

      <div>
        <div style={labelStyle}>Stones (optional)</div>
        <input
          type="text"
          value={metadata.stones}
          onChange={(e) => onChange('stones', e.target.value)}
          placeholder="e.g. Diamond, Ruby"
          style={{ ...selStyle, cursor: 'text' }}
        />
      </div>

      <div>
        <div style={labelStyle}>Packing Type</div>
        <select style={selStyle} value={metadata.packingType} onChange={(e) => onChange('packingType', e.target.value)}>
          <option>Small Box</option>
          <option>Big Box</option>
        </select>
      </div>

      <button
        className="btn-accent"
        onClick={onProcess}
        disabled={activeStatus === 'processing'}
        style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
      >
        {activeStatus === 'processing' ? (
          <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Processing…</>
        ) : (
          <> Process Image</>
        )}
      </button>
    </div>
  );
}

/* =====================
   Main Sidebar
   ===================== */
export default function Sidebar({ images, activeIdx, onSelect, onRemove, metadata, onMetadataChange, onProcess, activeStatus }) {
  const fileRef = useRef();

  return (
    <aside style={{
      width: 260,
      minWidth: 260,
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Section: Filmstrip */}
      <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{
          fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
        }}>
          Assets ({images.length})
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 6,
          maxHeight: 240,
          overflowY: 'auto',
          paddingRight: 4,
        }}>
          {images.map((img, i) => (
            <Thumbnail
              key={i}
              image={img}
              index={i}
              isActive={activeIdx === i}
              onSelect={onSelect}
              onRemove={onRemove}
            />
          ))}
        </div>
      </div>

      {/* Section: Metadata */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px' }}>
        <div style={{
          fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
        }}>
          Metadata
        </div>
        <MetadataPanel
          metadata={metadata}
          onChange={onMetadataChange}
          onProcess={onProcess}
          activeStatus={activeStatus}
        />
      </div>
    </aside>
  );
}
