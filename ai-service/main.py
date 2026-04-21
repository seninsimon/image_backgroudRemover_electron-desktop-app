import io
import time
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import Response
import cv2
import numpy as np
from PIL import Image, ImageEnhance
from rembg import remove
from ultralytics import YOLO

app = FastAPI(title="ImgAI Service")

# Load YOLO model for tag detection. If the model path doesn't exist, YOLO will download a basic variant or fail.
# We will use 'yolov8n.pt' which automatically downloads the nano model, though ideally it should be a custom trained one.
try:
    model = YOLO("yolov8n.pt") 
    print("YOLOv8 initialized.")
except Exception as e:
    print(f"Error initializing YOLO: {e}")
    model = None

def apply_enhancements(img_pil: Image.Image) -> Image.Image:
    # Increase Sharpness
    enhancer = ImageEnhance.Sharpness(img_pil)
    img_pil = enhancer.enhance(1.5)
    
    # Increase Contrast
    enhancer = ImageEnhance.Contrast(img_pil)
    img_pil = enhancer.enhance(1.2)
    
    # Increase Brightness slightly
    enhancer = ImageEnhance.Brightness(img_pil)
    img_pil = enhancer.enhance(1.05)
    
    return img_pil

def remove_tag(image_cv: np.ndarray, detections) -> np.ndarray:
    """
    Inpaint detected tags using cv2.inpaint
     detections: list of bounding boxes from YOLO [xmin, ymin, xmax, ymax, conf, class]
    """
    if len(detections) == 0:
        return image_cv
        
    mask = np.zeros(image_cv.shape[:2], dtype=np.uint8)
    for det in detections:
        x1, y1, x2, y2 = map(int, det[:4])
        # Expand bounding box slightly for better inpainting
        cv2.rectangle(mask, (x1-5, y1-5), (x2+5, y2+5), 255, -1)
        
    # Inpaint algorithm
    inpainted = cv2.inpaint(image_cv, mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA)
    return inpainted
    
def composite_background(img_rgba: Image.Image, background_color: str) -> Image.Image:
    # Create background image
    color_map = {
        'Black': (0, 0, 0, 255),
        'White': (255, 255, 255, 255)
    }
    bg_color = color_map.get(background_color, (255, 255, 255, 255))
    
    bg = Image.new("RGBA", img_rgba.size, bg_color)
    bg.paste(img_rgba, mask=img_rgba.split()[3]) # paste using alpha channel
    return bg.convert("RGB")

@app.post("/process")
async def process_image(
    file: UploadFile = File(...),
    background: str = Form("White")
):
    try:
        contents = await file.read()
        
        input_image = Image.open(io.BytesIO(contents))
        # Optional: resize if too huge to save processing time
        input_image.thumbnail((1920, 1920))

        # 1. Background removal
        try:
            rmbg_out = remove(input_image)
            print("Background removed successfully.")
        except Exception as e:
            print(f"Error removing background: {e}")
            rmbg_out = input_image.convert("RGBA")
            
        # Convert to cv2 format for Tag Removal
        cv_img = cv2.cvtColor(np.array(rmbg_out), cv2.COLOR_RGBA2BGRA)
        
        # 2. Tag Detection & Removal
        if model:
            # We predict on the BGR image (ignore alpha for target detection)
            bgr_img = cv2.cvtColor(cv_img, cv2.COLOR_BGRA2BGR)
            results = model.predict(bgr_img, conf=0.25)
            
            # Extract bounding boxes
            detections = []
            if len(results) > 0 and len(results[0].boxes) > 0:
                for box in results[0].boxes:
                    det = box.xyxy[0].cpu().numpy()
                    detections.append(det)
                    
            cv_img_inpainted_bgr = remove_tag(bgr_img, detections)
            
            # Combine inpainted BGR back with Alpha from rmbg_out
            alpha_channel = cv_img[:, :, 3]
            cv_img = cv2.cvtColor(cv_img_inpainted_bgr, cv2.COLOR_BGR2BGRA)
            cv_img[:, :, 3] = alpha_channel
            
        # Convert back to PIL
        pil_inpainted = Image.fromarray(cv2.cvtColor(cv_img, cv2.COLOR_BGRA2RGBA))
        
        # 3. Form Background Composition
        comp_img = composite_background(pil_inpainted, background)
        
        # 4. Enhancements
        final_img = apply_enhancements(comp_img)
        
        # Output to buffer
        img_byte_arr = io.BytesIO()
        final_img.save(img_byte_arr, format='JPEG', quality=95)
        img_byte_arr.seek(0)
        
        return Response(content=img_byte_arr.getvalue(), media_type="image/jpeg")

    except Exception as e:
        print(f"Exception during processing: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
