# Jewelry Image AI Processing App

ImgAI is a production-level desktop application specifically designed for the jewelry industry. It provides an automated, AI-driven pipeline to process, organize, and format jewelry product images for diverse print configurations along with relevant metadata capturing. 

## Features
- **AI Background Removal**: Automatically extracts the jewel from complex backgrounds using **IS-Net** (Dichotomous Image Segmentation) with PyTorch — higher accuracy than rembg for product photography.
- **Auto Tag Removal**: Uses a YOLOv8 object detection model to locate product tags in the image and cleanly inpaints (removes) them using OpenCV.
- **Image Enhancement**: Enhances sharpness, brightness, and contrast seamlessly applying PIL adjustments.
- **Intelligent Organization**: Processed images are automatically cataloged and structured locally (e.g., `outputs/Ring/Gold/...`).
- **Printable Card Canvas**: Dynamically scales your processed jewelry to standard industry card templates at 300 DPI layout standards (ATM, Fold Card, Big Card, Certificate).
- **PDF/PNG Export**: Export directly generated print layouts ready for manufacturing standards.

## Project Architecture
The project leverages a robust multi-service architecture for rapid background processing without blocking the front end:
1. **Desktop App (`/app`)**: An **Electron** wrapper holding the frontend client. 
2. **Frontend (`/client`)**: Built with **React**, **Vite**, and **Tailwind CSS**. Manages state, drag-and-drop processing, and UI representations. 
3. **Backend API (`/server`)**: A **Node.js** & **Express** application routing image streams, persisting jewelry metadata via **MongoDB** schemas, and orchestrating the local storage paths.
4. **AI Service (`/ai-service`)**: A **Python & FastAPI** application loaded with **PyTorch**, **OpenCV**, and **IS-Net** handling heavy-lift tensor/image manipulation logic safely away from Node's single thread. Model weights are auto-downloaded from HuggingFace on first run.

---

## Prerequisites
Before you run the project, ensure you have the following installed on your machine:
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- **MongoDB** running locally on your default port (27017).

---

## Installation & Running

We use cross-process multi-terminals so each architecture can log and perform independently. Run the following steps in separate terminal windows.

### 1. Database Setup
Ensure that your MongoDB server is up and running. 
> *The Node backend automatically defaults to `mongodb://127.0.0.1:27017/imgai` but you can edit the `.env` inside the `server/` directory optionally.*

### 2. Python AI Service
Boot up the ML pipelines first. On first run, IS-Net weights (~170 MB) will be auto-downloaded from HuggingFace and cached locally in `ai-service/weights/`.
```bash
cd ai-service
pip install -r requirements.txt
python main.py
```
> The FastAPI service will run on `http://0.0.0.0:8000`.

### 3. Node.js Backend Server
This routes all your database, local-filestore, and communicates with the Python process.
```bash
cd server
npm install
npm start
```
> The Express server will run on `http://localhost:5000`.

### 4. React Frontend (Development mode)
This boots the user interface on your local dev server.
```bash
cd client
npm install
npm run dev
```

### 5. Electron Output View
Finally, this boots a localized browser window containing your React app natively on Windows.
```bash
cd app
npm install
npm start
```

## Post-Install AI Customization
Out of the box, ImgAI uses IS-Net (`isnet-general-use`) pretrained weights for background removal. For optimal **Tag Removal** detection (currently disabled), you can train a YOLOv8 dataset specifically on "Jewelry Tags" and integrate it into the pipeline within `ai-service/main.py`.
