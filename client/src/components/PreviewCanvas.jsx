import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download } from 'lucide-react';

// Dimensions in Pixels (at 300 DPI)
// 1 cm = ~118.11 pixels
const CARD_TYPES = {
  ATM: { name: 'ATM Card', width: 283, height: 189 },     // 2.4 x 1.6 cm
  BIG: { name: 'Big Card', width: 413, height: 295 },     // 3.5 x 2.5 cm
  CERT: { name: 'Certificate', width: 885, height: 650 }, // 7.5 x 5.5 cm
  FOLD: { name: 'Fold Card', width: 709, height: 472 }    // 6 x 4 cm
};

export default function PreviewCanvas({ processedImage, apiUrl }) {
  const [selectedCard, setSelectedCard] = useState('ATM');
  const printRef = useRef();

  const handleExportPNG = async () => {
    const canvas = await html2canvas(printRef.current, { scale: 2 });
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `jewelry-${selectedCard}.png`;
    link.click();
  };

  const handleExportPDF = async () => {
    const canvas = await html2canvas(printRef.current, { scale: 2 });
    const dataUrl = canvas.toDataURL('image/png');
    const dimensions = CARD_TYPES[selectedCard];
    
    // Convert px to mm for jsPDF
    const pdf = new jsPDF({
      orientation: dimensions.width > dimensions.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [dimensions.width * 0.264583, dimensions.height * 0.264583]
    });
    
    pdf.addImage(dataUrl, 'PNG', 0, 0, dimensions.width * 0.264583, dimensions.height * 0.264583);
    pdf.save(`jewelry-${selectedCard}.pdf`);
  };

  const card = CARD_TYPES[selectedCard];
  const imageUrl = `${apiUrl}/output-images/${processedImage.metadata.ornamentType}/${processedImage.metadata.metalColour}/${processedImage.processedFilename}`;

  return (
    <div className="w-full max-w-4xl bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Preview & Export</h2>
        <div className="flex gap-2">
          {Object.keys(CARD_TYPES).map(key => (
            <button
              key={key}
              onClick={() => setSelectedCard(key)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${selectedCard === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {CARD_TYPES[key].name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-100 p-8 rounded-xl shadow-inner mb-8 flex justify-center w-full overflow-x-auto">
        {selectedCard === 'FOLD' ? (
          <div 
            ref={printRef}
            className="flex bg-white shadow-xl relative" 
            style={{ width: card.width, height: card.height }}
          >
             {/* Left Panel */}
             <div className="w-1/2 h-full flex items-center justify-center border-r border-dashed border-gray-300">
               <span className="text-gray-400 text-sm transform -rotate-90">Back Text Options</span>
             </div>
             {/* Right Panel */}
             <div className="w-1/2 h-full flex flex-col items-center justify-center p-4">
               <img src={imageUrl} alt="Processed" className="max-w-full max-h-[80%] object-contain drop-shadow-md" />
               <p className="mt-2 font-serif text-xs px-2 text-center text-gray-700 font-semibold">{processedImage.metadata.ornamentType}</p>
             </div>
          </div>
        ) : (
          <div 
            ref={printRef}
            className="bg-white shadow-xl flex flex-col items-center justify-center p-6 relative" 
            style={{ width: card.width, height: card.height }}
          >
            <img src={imageUrl} alt="Processed" className="max-w-full max-h-[80%] object-contain drop-shadow-md" />
            <div className="mt-4 flex gap-4 text-xs font-serif text-gray-600 border-t border-gray-100 pt-2 w-[80%] justify-between">
              <span>{processedImage.metadata.ornamentType}</span>
              <span>{processedImage.metadata.metalColour}</span>
              <span>{processedImage.metadata.hasChain ? 'With Chain' : ''}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button onClick={handleExportPNG} className="flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition shadow">
          <Download className="w-4 h-4" /> Export PNG
        </button>
        <button onClick={handleExportPDF} className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition shadow">
          <Download className="w-4 h-4" /> Export PDF
        </button>
      </div>
    </div>
  );
}
