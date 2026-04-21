import React, { useState } from 'react';
import axios from 'axios';
import ImageUploader from './components/ImageUploader';
import MetadataForm from './components/MetadataForm';
import PreviewCanvas from './components/PreviewCanvas';

const API_URL = 'http://localhost:5000';

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [image, setImage] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await axios.post(`${API_URL}/upload`, formData);
      setImage(res.data.image);
      setCurrentStep(2);
    } catch (error) {
      console.error('Upload error', error);
    }
  };

  const handleMetadataSubmit = async (data) => {
    try {
      setIsProcessing(true);
      await axios.post(`${API_URL}/metadata/${image._id}`, data);
      setMetadata(data);
      
      const res = await axios.post(`${API_URL}/process-image/${image._id}`);
      setProcessedImage(res.data.image);
      setCurrentStep(3);
    } catch (error) {
      console.error('Processing error', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 flex flex-col items-center font-sans text-gray-900">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Jewelry Image AI Processing</h1>
      
      {currentStep === 1 && (
        <ImageUploader onUpload={handleUpload} />
      )}

      {currentStep === 2 && (
        <MetadataForm 
          onSubmit={handleMetadataSubmit} 
          isProcessing={isProcessing} 
        />
      )}

      {currentStep === 3 && processedImage && (
        <PreviewCanvas 
           processedImage={processedImage} 
           apiUrl={API_URL} 
        />
      )}
    </div>
  );
}

export default App;
