import React, { useState, useCallback } from 'react';
import axios from 'axios';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import EmptyState from './components/EmptyState';

const API_URL = 'http://localhost:5000';

const DEFAULT_EDITS = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sharpness: 0,
  hue: 0,
  blur: 0,
};

function App() {
  // ---- Asset List State ----
  const [images, setImages] = useState([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [viewMode, setViewMode] = useState('processed'); // 'original' | 'processed' | 'split'

  // ---- Helpers ----
  const activeImage = activeIdx >= 0 ? images[activeIdx] : null;

  const updateImage = useCallback((idx, patch) => {
    setImages(prev => prev.map((img, i) => i === idx ? { ...img, ...patch } : img));
  }, []);

  // ---- Upload Handler (supports multiple) ----
  const handleUpload = useCallback(async (files) => {
    const newImages = [];
    for (const file of files) {
      const previewUrl = URL.createObjectURL(file);
      newImages.push({
        file,
        originalUrl: previewUrl,
        processedUrl: null,
        serverId: null,
        status: 'local', // local → uploaded → processing → completed | failed
        metadata: {
          background: 'White',
          metalColour: 'Gold',
          ornamentType: 'Ring',
          hasChain: false,
          stones: '',
          packingType: 'Small Box',
        },
        edits: { ...DEFAULT_EDITS },
      });
    }
    setImages(prev => {
      const updated = [...prev, ...newImages];
      return updated;
    });
    // auto-select first new image
    setActiveIdx(prev => prev < 0 ? images.length : prev);
  }, [images.length]);

  // ---- Upload to server ----
  const uploadToServer = useCallback(async (idx) => {
    const img = images[idx];
    if (!img || img.status !== 'local') return;

    const formData = new FormData();
    formData.append('image', img.file);
    try {
      const res = await axios.post(`${API_URL}/upload`, formData);
      updateImage(idx, { serverId: res.data.image._id, status: 'uploaded' });
      return res.data.image._id;
    } catch (err) {
      console.error('Upload failed', err);
      updateImage(idx, { status: 'failed' });
      return null;
    }
  }, [images, updateImage]);

  // ---- Process Image ----
  const processImage = useCallback(async (idx) => {
    let img = images[idx];
    if (!img) return;

    // Upload first if local
    let serverId = img.serverId;
    if (img.status === 'local') {
      serverId = await uploadToServer(idx);
      if (!serverId) return;
      img = { ...img, serverId, status: 'uploaded' };
    }

    updateImage(idx, { status: 'processing' });

    try {
      // Save metadata
      await axios.post(`${API_URL}/metadata/${serverId}`, img.metadata);

      // Process
      const res = await axios.post(`${API_URL}/process-image/${serverId}`);
      const proc = res.data.image;

      const processedUrl = `${API_URL}/output-images/${proc.metadata.ornamentType}/${proc.metadata.metalColour}/${proc.processedFilename}`;
      updateImage(idx, { processedUrl, status: 'completed', serverId });
    } catch (err) {
      console.error('Processing error', err);
      updateImage(idx, { status: 'failed' });
    }
  }, [images, uploadToServer, updateImage]);

  // ---- Process All ----
  const processAll = useCallback(async () => {
    for (let i = 0; i < images.length; i++) {
      if (images[i].status === 'local' || images[i].status === 'uploaded') {
        await processImage(i);
      }
    }
  }, [images, processImage]);

  // ---- Update metadata for active image ----
  const updateMetadata = useCallback((field, value) => {
    if (activeIdx < 0) return;
    setImages(prev => prev.map((img, i) => {
      if (i !== activeIdx) return img;
      return { ...img, metadata: { ...img.metadata, [field]: value } };
    }));
  }, [activeIdx]);

  // ---- Update edits for active image ----
  const updateEdits = useCallback((field, value) => {
    if (activeIdx < 0) return;
    setImages(prev => prev.map((img, i) => {
      if (i !== activeIdx) return img;
      return { ...img, edits: { ...img.edits, [field]: value } };
    }));
  }, [activeIdx]);

  const resetEdits = useCallback(() => {
    if (activeIdx < 0) return;
    updateImage(activeIdx, { edits: { ...DEFAULT_EDITS } });
  }, [activeIdx, updateImage]);

  // ---- Remove image ----
  const removeImage = useCallback((idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setActiveIdx(prev => {
      if (prev >= images.length - 1) return Math.max(0, images.length - 2);
      if (prev > idx) return prev - 1;
      return prev;
    });
  }, [images.length]);

  // ---- Whether to show studio or empty screen ----
  const hasImages = images.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)' }}>
      <Header
        imageCount={images.length}
        processedCount={images.filter(i => i.status === 'completed').length}
        onUpload={handleUpload}
        onProcessAll={processAll}
        images={images}
        apiUrl={API_URL}
      />

      {!hasImages ? (
        <EmptyState onUpload={handleUpload} />
      ) : (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Sidebar: filmstrip + metadata */}
          <Sidebar
            images={images}
            activeIdx={activeIdx}
            onSelect={setActiveIdx}
            onRemove={removeImage}
            metadata={activeImage?.metadata}
            onMetadataChange={updateMetadata}
            onProcess={() => processImage(activeIdx)}
            activeStatus={activeImage?.status}
          />

          {/* Center Workspace */}
          <Canvas
            image={activeImage}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* Right Toolbar: Edits & Export */}
          <Toolbar
            image={activeImage}
            edits={activeImage?.edits || DEFAULT_EDITS}
            onEditChange={updateEdits}
            onReset={resetEdits}
            apiUrl={API_URL}
          />
        </div>
      )}
    </div>
  );
}

export default App;
