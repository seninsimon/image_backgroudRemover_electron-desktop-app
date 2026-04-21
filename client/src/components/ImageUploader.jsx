import React, { useState } from 'react';
import { UploadCloud } from 'lucide-react';

export default function ImageUploader({ onUpload }) {
  const [file, setFile] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  };

  return (
    <div 
      className="w-full max-w-xl p-12 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center bg-white shadow-sm hover:border-blue-500 transition-colors cursor-pointer"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-upload').click()}
    >
      <UploadCloud className="w-16 h-16 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-700">Drag & Drop Image Here</h3>
      <p className="text-sm text-gray-500 mt-2">or click to browse</p>
      <input 
        id="file-upload" 
        type="file" 
        className="hidden" 
        accept="image/*"
        onChange={(e) => {
          if(e.target.files[0]) setFile(e.target.files[0]);
        }}
      />
      
      {file && (
        <div className="mt-6 flex flex-col items-center">
          <p className="text-emerald-600 font-medium">{file.name}</p>
          <button 
            onClick={(e) => { e.stopPropagation(); onUpload(file); }}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 active:scale-95 transition-transform"
          >
            Upload Image
          </button>
        </div>
      )}
    </div>
  );
}
