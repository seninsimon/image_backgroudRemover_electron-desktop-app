import React, { useRef } from 'react';
import { UploadCloud, Sparkles } from 'lucide-react';

export default function EmptyState({ onUpload }) {
  const fileRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) onUpload(files);
  };

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) onUpload(files);
    e.target.value = '';
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div
        onClick={() => fileRef.current.click()}
        className="animate-fade-in"
        style={{
          width: 480,
          maxWidth: '90%',
          padding: '56px 40px',
          border: '2px dashed var(--border-color)',
          borderRadius: 20,
          background: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          cursor: 'pointer',
          transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent)';
          e.currentTarget.style.boxShadow = '0 0 40px var(--accent-glow)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: 'linear-gradient(135deg, var(--accent), #a29bfe)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px var(--accent-glow)',
        }}>
          <UploadCloud size={32} color="#fff" />
        </div>

        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
          Drop jewelry images here
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, textAlign: 'center' }}>
          or click to browse — supports JPG, PNG, WEBP
        </p>

        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Background Removal', 'AI Enhancement', 'Tag Detection', 'Card Export'].map(f => (
            <span key={f} style={{
              fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.03em',
              padding: '4px 12px', borderRadius: 20,
              background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Sparkles size={10} /> {f}
            </span>
          ))}
        </div>
      </div>

      <input type="file" multiple accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={handleFiles} />
    </div>
  );
}
