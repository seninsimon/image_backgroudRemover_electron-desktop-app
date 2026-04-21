import React, { useState, useRef } from 'react';
import { Sun, Contrast, Droplets, RotateCcw, Download, FileImage, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/* ============================
   Card Dimensions (300 DPI)
   1 cm ≈ 118.11 px at 300 DPI
   ============================ */
const CARD_TYPES = {
  ATM:  { name: 'ATM Card',    widthCm: 2.4,  heightCm: 1.6, fold: false },
  BIG:  { name: 'Big Card',    widthCm: 3.5,  heightCm: 2.5, fold: false },
  CERT: { name: 'Certificate', widthCm: 7.5,  heightCm: 5.5, fold: false },
  FOLD: { name: 'Fold Card',   widthCm: 6.0,  heightCm: 4.0, fold: true  },
};

const cmToPx = (cm) => Math.round(cm * 118.11); // 300 DPI

/* ============================
   Slider Component
   ============================ */
function EditSlider({ icon: Icon, label, value, min, max, step, unit, onChange }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 6,
      }}>
        <span style={{
          fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <Icon size={12} /> {label}
        </span>
        <span style={{
          fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent)',
          minWidth: 36, textAlign: 'right',
        }}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step || 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/* ============================
   Card Preview (for export)
   ============================ */
function CardPreview({ image, cardKey, cardRef }) {
  const card = CARD_TYPES[cardKey];
  const widthPx = cmToPx(card.widthCm);
  const heightPx = cmToPx(card.heightCm);

  // Scale down for preview (fit in ~300px wide)
  const scale = Math.min(280 / widthPx, 200 / heightPx, 1);
  const previewW = widthPx * scale;
  const previewH = heightPx * scale;

  const src = image?.processedUrl || image?.originalUrl;
  if (!src) return null;

  const bg = image?.metadata?.background === 'Black' ? '#000' : '#fff';
  const textColor = image?.metadata?.background === 'Black' ? '#fff' : '#1a1a2e';

  if (card.fold) {
    return (
      <div ref={cardRef} style={{
        width: previewW, height: previewH,
        display: 'flex', background: bg,
        borderRadius: 4, overflow: 'hidden',
        boxShadow: '0 2px 20px rgba(0,0,0,0.4)',
      }}>
        {/* Left panel */}
        <div style={{
          width: '50%', height: '100%',
          borderRight: '1px dashed rgba(128,128,128,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 8 * scale, color: 'rgba(128,128,128,0.5)', transform: 'rotate(-90deg)' }}>
            Back Panel
          </span>
        </div>
        {/* Right panel */}
        <div style={{
          width: '50%', height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 6 * scale,
        }}>
          <img src={src} alt="" style={{ maxWidth: '85%', maxHeight: '75%', objectFit: 'contain' }} />
          <span style={{ fontSize: 7 * scale, color: textColor, marginTop: 4 * scale, fontWeight: 600 }}>
            {image?.metadata?.ornamentType}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div ref={cardRef} style={{
      width: previewW, height: previewH,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: bg, borderRadius: 4, overflow: 'hidden',
      padding: 10 * scale,
      boxShadow: '0 2px 20px rgba(0,0,0,0.4)',
    }}>
      <img src={src} alt="" style={{ maxWidth: '88%', maxHeight: '72%', objectFit: 'contain' }} />
      <div style={{
        marginTop: 6 * scale,
        display: 'flex', justifyContent: 'center', gap: 10 * scale,
        fontSize: 7 * scale, color: textColor, fontWeight: 500,
        borderTop: `1px solid rgba(128,128,128,0.2)`, paddingTop: 4 * scale,
        width: '80%',
      }}>
        <span>{image?.metadata?.ornamentType}</span>
        <span>•</span>
        <span>{image?.metadata?.metalColour}</span>
      </div>
    </div>
  );
}

/* ============================
   Main Toolbar
   ============================ */
export default function Toolbar({ image, edits, onEditChange, onReset, apiUrl }) {
  const [selectedCard, setSelectedCard] = useState('ATM');
  const [showCardPreview, setShowCardPreview] = useState(false);
  const cardRef = useRef();

  // ---- Export functions ----
  const handleDownloadSingle = () => {
    if (!image?.processedUrl) return;
    const link = document.createElement('a');
    link.href = image.processedUrl;
    link.download = image.file?.name || 'processed.jpg';
    link.click();
  };

  const handleExportPNG = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true, backgroundColor: null });
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `card-${selectedCard}.png`;
    link.click();
  };

  const handleExportPDF = async () => {
    if (!cardRef.current) return;
    const card = CARD_TYPES[selectedCard];
    const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true, backgroundColor: null });
    const url = canvas.toDataURL('image/png');

    const wMm = card.widthCm * 10;
    const hMm = card.heightCm * 10;

    const pdf = new jsPDF({
      orientation: wMm > hMm ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [wMm, hMm],
    });
    pdf.addImage(url, 'PNG', 0, 0, wMm, hMm);
    pdf.save(`card-${selectedCard}.pdf`);
  };

  const sectionTitle = {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 14,
    marginTop: 6,
  };

  if (!image) {
    return (
      <aside style={{
        width: 280, minWidth: 280,
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', fontSize: '0.8rem',
      }}>
        Select an image to edit
      </aside>
    );
  }

  return (
    <aside style={{
      width: 280,
      minWidth: 280,
      background: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px' }}>
        {/* ---- ADJUSTMENTS ---- */}
        <div style={sectionTitle}>Adjustments</div>

        <EditSlider icon={Sun}      label="Brightness" value={edits.brightness} min={20}  max={200} unit="%" onChange={(v) => onEditChange('brightness', v)} />
        <EditSlider icon={Contrast} label="Contrast"   value={edits.contrast}   min={20}  max={200} unit="%" onChange={(v) => onEditChange('contrast', v)} />
        <EditSlider icon={Droplets} label="Saturation"  value={edits.saturation} min={0}   max={200} unit="%" onChange={(v) => onEditChange('saturation', v)} />
        <EditSlider icon={Sun}      label="Hue Rotate"  value={edits.hue}        min={0}   max={360} unit="°" onChange={(v) => onEditChange('hue', v)} />
        <EditSlider icon={Droplets} label="Blur"        value={edits.blur}       min={0}   max={10}  step={0.5} unit="px" onChange={(v) => onEditChange('blur', v)} />

        <button className="btn-ghost" onClick={onReset} style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}>
          <RotateCcw size={13} /> Reset Adjustments
        </button>

        {/* ---- EXPORT ---- */}
        <div style={sectionTitle}>Export</div>

        {image.processedUrl && (
          <button className="btn-accent" onClick={handleDownloadSingle} style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}>
            <Download size={14} /> Download Processed
          </button>
        )}

        {/* ---- PRINT CARDS ---- */}
        <div style={sectionTitle}>Print Cards</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
          {Object.entries(CARD_TYPES).map(([key, card]) => (
            <button
              key={key}
              onClick={() => { setSelectedCard(key); setShowCardPreview(true); }}
              style={{
                padding: '8px 6px',
                borderRadius: 6,
                fontSize: '0.72rem',
                fontWeight: 600,
                border: selectedCard === key ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                background: selectedCard === key ? 'var(--accent-glow)' : 'var(--bg-elevated)',
                color: selectedCard === key ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'center',
              }}
            >
              {card.name}
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {card.widthCm}×{card.heightCm} cm
              </div>
            </button>
          ))}
        </div>

        {/* Card Preview */}
        {showCardPreview && (
          <div className="animate-fade-in" style={{
            background: 'var(--bg-elevated)',
            borderRadius: 10,
            padding: 16,
            marginBottom: 14,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}>
            <CardPreview image={image} cardKey={selectedCard} cardRef={cardRef} />

            <div style={{ display: 'flex', gap: 6, width: '100%' }}>
              <button className="btn-ghost" onClick={handleExportPNG} style={{ flex: 1, justifyContent: 'center' }}>
                <FileImage size={13} /> PNG
              </button>
              <button className="btn-danger" onClick={handleExportPDF} style={{ flex: 1, justifyContent: 'center', background: '#e74c3c' }}>
                <Printer size={13} /> PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
