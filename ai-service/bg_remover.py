import torch
import numpy as np
from PIL import Image
from torchvision import transforms
from huggingface_hub import hf_hub_download

from isnet import ISNetDIS

# =========================================
# Configuration
# =========================================
INPUT_SIZE = 512  # Faster for desktop
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

HF_REPO_ID = "NimaBoscarino/IS-Net_DIS-general-use"
HF_FILENAME = "isnet-general-use.pth"


class ISNetBGRemover:
    def __init__(self):
        self.model = None
        self.device = DEVICE
        self._load_model()

    # ----------------------------------------
    # FIXED DOWNLOAD (NO FILE MOVING)
    # ----------------------------------------
    def _download_weights(self) -> str:
        print("[ISNet] Downloading weights...")

        try:
            weights_path = hf_hub_download(
                repo_id=HF_REPO_ID,
                filename=HF_FILENAME
            )

            print(f"[ISNet] Using weights from: {weights_path}")
            return weights_path

        except Exception as e:
            print(f"[ISNet] Download failed: {e}")
            raise RuntimeError("Failed to download ISNet weights")

    # ----------------------------------------
    # LOAD MODEL
    # ----------------------------------------
    def _load_model(self):
        weights_path = self._download_weights()

        self.model = ISNetDIS(in_ch=3, out_ch=1)

        checkpoint = torch.load(weights_path, map_location=self.device)

        # Handle different checkpoint formats
        if isinstance(checkpoint, dict) and "model" in checkpoint:
            state_dict = checkpoint["model"]
        elif isinstance(checkpoint, dict) and "state_dict" in checkpoint:
            state_dict = checkpoint["state_dict"]
        else:
            state_dict = checkpoint

        # Clean keys
        cleaned = {}
        for k, v in state_dict.items():
            cleaned[k.replace("module.", "")] = v

        self.model.load_state_dict(cleaned, strict=False)
        self.model.to(self.device)

        # CPU optimization
        if self.device == "cpu":
            torch.set_num_threads(4)

        self.model.eval()
        print(f"[ISNet] Model loaded on {self.device}")

    # ----------------------------------------
    # PREPROCESS
    # ----------------------------------------
    def _preprocess(self, image: Image.Image):
        transform = transforms.Compose([
            transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
            transforms.ToTensor(),
        ])

        tensor = transform(image.convert("RGB"))

        # Normalize per channel
        for i in range(3):
            ch = tensor[i]
            min_val, max_val = ch.min(), ch.max()
            if max_val - min_val > 1e-6:
                tensor[i] = (ch - min_val) / (max_val - min_val)
            else:
                tensor[i] = ch * 0.0

        return tensor.unsqueeze(0).to(self.device)

    # ----------------------------------------
    # POSTPROCESS
    # ----------------------------------------
    def _postprocess(self, mask_tensor, original_size):
        mask = mask_tensor.squeeze().cpu().numpy()

        min_val, max_val = mask.min(), mask.max()
        if max_val - min_val > 1e-6:
            mask = (mask - min_val) / (max_val - min_val)
        else:
            mask = mask * 0.0

        mask = (mask * 255).astype(np.uint8)

        mask = Image.fromarray(mask).resize(original_size, Image.LANCZOS)
        return np.array(mask)

    # ----------------------------------------
    # MAIN FUNCTION
    # ----------------------------------------
    @torch.no_grad()
    def remove_background(self, image: Image.Image) -> Image.Image:
        image_rgb = image.convert("RGB")
        original_size = image_rgb.size

        input_tensor = self._preprocess(image_rgb)

        outputs = self.model(input_tensor)
        mask_tensor = outputs[0]

        alpha = self._postprocess(mask_tensor, original_size)

        rgba = np.array(image_rgb)
        rgba = np.dstack([rgba, alpha])

        return Image.fromarray(rgba, "RGBA")