const mongoose = require('mongoose');

const MetadataSchema = new mongoose.Schema({
  background: { type: String, enum: ['Black', 'White'] },
  metalColour: { type: String, enum: ['Gold', 'Rose Gold', 'Silver', 'Platinum'] },
  ornamentType: { type: String, enum: ['Ring', 'Necklace', 'Earring', 'Pendant'] },
  hasChain: { type: Boolean, default: false },
  stones: { type: String }, // optional
  packingType: { type: String, enum: ['Big Box', 'Small Box'] }
}, { _id: false });

const ImageSchema = new mongoose.Schema({
  originalFilename: { type: String, required: true },
  processedFilename: { type: String },
  originalPath: { type: String },
  processedPath: { type: String },
  status: { type: String, enum: ['uploaded', 'processing', 'completed', 'failed'], default: 'uploaded' },
  metadata: MetadataSchema,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Image', ImageSchema);
