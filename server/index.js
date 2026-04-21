require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const Image = require('./models/Image');

const app = express();
const PORT = process.env.PORT || 5000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/imgai')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Create output directory base
const outputBaseDir = path.join(__dirname, '..', 'outputs');
if (!fs.existsSync(outputBaseDir)) {
  fs.mkdirSync(outputBaseDir, { recursive: true });
}

// ----------------------
// Routes
// ----------------------

// 1. Upload Route
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const newImage = new Image({
      originalFilename: req.file.originalname,
      originalPath: req.file.path,
    });

    await newImage.save();
    res.json({ message: 'Image uploaded successfully', image: newImage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Metadata Route
app.post('/metadata/:id', async (req, res) => {
  try {
    const { background, metalColour, ornamentType, hasChain, stones, packingType } = req.body;
    
    const image = await Image.findByIdAndUpdate(
      req.params.id, 
      { 
        metadata: { background, metalColour, ornamentType, hasChain, stones, packingType },
        updatedAt: Date.now()
      }, 
      { new: true }
    );

    if (!image) return res.status(404).json({ error: 'Image not found' });

    res.json({ message: 'Metadata added', image });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Process Image Route
app.post('/process-image/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) return res.status(404).json({ error: 'Image not found' });
    if (!image.metadata || !image.metadata.ornamentType || !image.metadata.metalColour) {
      return res.status(400).json({ error: 'Metadata is required before processing' });
    }

    image.status = 'processing';
    await image.save();

    // Call Python AI Service
    const formData = new FormData();
    formData.append('file', fs.createReadStream(image.originalPath));
    formData.append('background', image.metadata.background || 'White');
    
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/process`, formData, {
      headers: formData.getHeaders(),
      responseType: 'arraybuffer' // receive image buffer
    });

    // Auto-Organize Outputs: /outputs/{ornamentType}/{metalColor}/
    const outDir = path.join(outputBaseDir, image.metadata.ornamentType, image.metadata.metalColour);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const processedFilename = `processed-${Date.now()}-${image.originalFilename}`;
    const processedPath = path.join(outDir, processedFilename);

    fs.writeFileSync(processedPath, aiResponse.data);

    image.processedFilename = processedFilename;
    image.processedPath = processedPath;
    image.status = 'completed';
    image.updatedAt = Date.now();
    await image.save();

    res.json({ message: 'Image processed and organized', image });
  } catch (error) {
    console.error('Processing error:', error.message);
    await Image.findByIdAndUpdate(req.params.id, { status: 'failed' });
    res.status(500).json({ error: 'Failed to process image' });
  }
});

// 4. Get Images Route
app.get('/images', async (req, res) => {
  try {
    const images = await Image.find().sort({ createdAt: -1 });
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend outputs if needed or static images
app.use('/output-images', express.static(outputBaseDir));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
