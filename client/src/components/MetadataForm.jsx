import React, { useState } from 'react';

export default function MetadataForm({ onSubmit, isProcessing }) {
  const [form, setForm] = useState({
    background: 'White',
    metalColour: 'Gold',
    ornamentType: 'Ring',
    hasChain: false,
    stones: '',
    packingType: 'Small Box'
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  return (
    <div className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-semibold mb-6">Enter Metadata</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Background</label>
          <select name="background" value={form.background} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500">
            <option>White</option>
            <option>Black</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Metal Colour</label>
          <select name="metalColour" value={form.metalColour} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500">
            <option>Gold</option>
            <option>Rose Gold</option>
            <option>Silver</option>
            <option>Platinum</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Ornament Type</label>
          <select name="ornamentType" value={form.ornamentType} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500">
            <option>Ring</option>
            <option>Necklace</option>
            <option>Earring</option>
            <option>Pendant</option>
          </select>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input type="checkbox" name="hasChain" checked={form.hasChain} onChange={handleChange} className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
            <span className="text-sm font-medium text-gray-700">Has Chain</span>
          </label>
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700">Stones (Optional)</label>
           <input type="text" name="stones" value={form.stones} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Diamond, Ruby" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Packing Type</label>
          <select name="packingType" value={form.packingType} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500">
            <option>Small Box</option>
            <option>Big Box</option>
          </select>
        </div>
      </div>

      <button 
        onClick={() => onSubmit(form)} 
        disabled={isProcessing}
        className="w-full mt-8 bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 shadow flex justify-center items-center disabled:opacity-75 disabled:cursor-wait"
      >
        {isProcessing ? 'Processing Image from AI...' : 'Submit & Process'}
      </button>
    </div>
  );
}
