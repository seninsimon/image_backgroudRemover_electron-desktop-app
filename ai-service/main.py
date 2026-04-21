import io
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import Response
from PIL import Image, ImageEnhance

from bg_remover import ISNetBGRemover

app = FastAPI(title="ImgAI Service")

# -------------------------------
# Initialize IS-Net Background Remover
# -------------------------------
print("[ImgAI] Loading IS-Net model...")
bg_remover = ISNetBGRemover()
print("[ImgAI] IS-Net ready.")


# -------------------------------
# Image Enhancements
# -------------------------------
def apply_enhancements(img_pil: Image.Image) -> Image.Image:
    img_pil = ImageEnhance.Sharpness(img_pil).enhance(1.5)
    img_pil = ImageEnhance.Contrast(img_pil).enhance(1.2)
    img_pil = ImageEnhance.Brightness(img_pil).enhance(1.05)
    return img_pil


# -------------------------------
# Background Composition
# -------------------------------
def composite_background(img_rgba: Image.Image, background_color: str) -> Image.Image:
    color_map = {
        'Black': (0, 0, 0, 255),
        'White': (255, 255, 255, 255)
    }

    bg_color = color_map.get(background_color, (255, 255, 255, 255))
    bg = Image.new("RGBA", img_rgba.size, bg_color)

    # Proper alpha compositing
    final = Image.alpha_composite(bg, img_rgba)

    return final.convert("RGB")


# -------------------------------
# API Endpoint
# -------------------------------
@app.post("/process")
async def process_image(
    file: UploadFile = File(...),
    background: str = Form("White")
):
    try:
        contents = await file.read()

        # Load image
        input_image = Image.open(io.BytesIO(contents)).convert("RGB")
        input_image.thumbnail((1920, 1920))

        # -------------------------------
        # 1. Background Removal (IS-Net)
        # -------------------------------
        try:
            rmbg_out = bg_remover.remove_background(input_image)
            print("Background removed successfully with IS-Net.")
        except Exception as e:
            print(f"Error removing background: {e}")
            rmbg_out = input_image.convert("RGBA")

        # -------------------------------
        # 2. Background Composition
        # -------------------------------
        comp_img = composite_background(rmbg_out, background)

        # -------------------------------
        # 3. Enhancements
        # -------------------------------
        final_img = apply_enhancements(comp_img)
        final_img = final_img.convert("RGB")

        # -------------------------------
        # Output
        # -------------------------------
        img_byte_arr = io.BytesIO()
        final_img.save(img_byte_arr, format="JPEG", quality=95)
        img_byte_arr.seek(0)

        return Response(content=img_byte_arr.getvalue(), media_type="image/jpeg")

    except Exception as e:
        print(f"Exception during processing: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------
# Run Server
# -------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
