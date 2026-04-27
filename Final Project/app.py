from pathlib import Path
from typing import Any, Dict, List, Optional
from io import BytesIO
import base64
import uuid

import torch
from PIL import Image, ImageOps
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from diffusers import StableDiffusionImg2ImgPipeline


ROOT_DIR = Path(__file__).resolve().parent

FRONTEND_DIR = ROOT_DIR / "frontend"
DATA_DIR = ROOT_DIR / "data" / "final_train_set"
TRAIN_DIR = DATA_DIR / "train"

LORA_OUTPUT_DIR = ROOT_DIR / "lora_output"
LORA_PATH = LORA_OUTPUT_DIR / "round2_300steps"

INPUT_DIR = ROOT_DIR / "inputs"
OUTPUT_DIR = ROOT_DIR / "outputs"

INPUT_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)


BASE_MODEL_ID = "stable-diffusion-v1-5/stable-diffusion-v1-5"
LORA_WEIGHT_NAME = "pytorch_lora_weights.safetensors"

GEN_WIDTH = 768
GEN_HEIGHT = 512

DEFAULT_STRENGTH = 0.82
DEFAULT_STEPS = 35
DEFAULT_GUIDANCE_SCALE = 8.0

NEGATIVE_PROMPT = (
    "line art, sketch, wireframe, outline drawing, diagram, abstract geometry, "
    "technical drawing, blueprint, flat illustration, cartoon, low quality, blurry, "
    "deformed, duplicate objects, cluttered storefront, bad anatomy, extra limbs, "
    "distorted mannequin, text artifacts"
)


app = FastAPI(title="Window Display Generator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/inputs", StaticFiles(directory=str(INPUT_DIR)), name="inputs")
app.mount("/outputs", StaticFiles(directory=str(OUTPUT_DIR)), name="outputs")


class GenerateRequest(BaseModel):
    shapes: List[Dict[str, Any]]
    sketch: str
    strength: Optional[float] = DEFAULT_STRENGTH
    steps: Optional[int] = DEFAULT_STEPS
    guidance_scale: Optional[float] = DEFAULT_GUIDANCE_SCALE
    seed: Optional[int] = None


DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
DTYPE = torch.float16 if DEVICE == "cuda" else torch.float32

print("=" * 60)
print(f"[INFO] ROOT_DIR = {ROOT_DIR}")
print(f"[INFO] DEVICE = {DEVICE}")
print(f"[INFO] BASE_MODEL_ID = {BASE_MODEL_ID}")
print(f"[INFO] LORA_PATH = {LORA_PATH}")
print("=" * 60)

if not LORA_PATH.exists():
    raise FileNotFoundError(f"LoRA path not found: {LORA_PATH}")

lora_weight_file = LORA_PATH / LORA_WEIGHT_NAME
if not lora_weight_file.exists():
    raise FileNotFoundError(f"LoRA weight file not found: {lora_weight_file}")

print("[INFO] Loading StableDiffusionImg2ImgPipeline...")

pipe = StableDiffusionImg2ImgPipeline.from_pretrained(
    BASE_MODEL_ID,
    torch_dtype=DTYPE,
).to(DEVICE)

pipe.load_lora_weights(
    str(LORA_PATH),
    weight_name=LORA_WEIGHT_NAME
)

pipe.enable_attention_slicing()

print("[INFO] Pipeline + LoRA loaded successfully.")


ROLE_PROMPTS = {
    "window_frame": "framed shop window display, storefront frame, large display window",
    "mannequin": "fashion mannequin, central display figure, boutique mannequin",
    "plinth": "display plinth, pedestal, presentation stand",
    "backdrop_panel": "clean backdrop panel, display wall, layered background panel",
    "framed_display": "framed display structure, central framed composition",
    "curtain_drape": "soft draped fabric, translucent curtain, theatrical drapery",
    "floral_cluster": "soft floral arrangement, decorative flower cluster, organic prop cluster",
    "decor_cluster": "decorative props cluster, styled display objects, curated accessories",
    "lighting_glow": "warm glowing light source, soft illuminated accent, theatrical glow",
    "display_object": "central display object, sculptural decorative object, curated focal prop",
    "folded_prop": "folded display prop, angular decorative panel",
    "frame_bar": "thin framing structure, elegant support bar",
    "hanging_string": "delicate hanging string, thin suspension detail"
}

GLOBAL_STYLE_PROMPT = (
    "luxury shop window display, dreamlike scene, soft glow, layered composition, "
    "theatrical lighting, framed display, central focal object, boutique storefront, "
    "warm elegant visual merchandising, cinematic storefront photography"
)


def summarize_shapes(shapes: List[Dict[str, Any]]) -> Dict[str, int]:
    counts: Dict[str, int] = {}
    for s in shapes:
        role = s.get("role", "unknown")
        counts[role] = counts.get(role, 0) + 1
    return counts


def get_shape_bounds(s: Dict[str, Any]) -> Dict[str, float]:
    if s["type"] == "circle":
        return {
            "left": s["x"] - s["r"],
            "right": s["x"] + s["r"],
            "top": s["y"] - s["r"],
            "bottom": s["y"] + s["r"],
            "width": s["r"] * 2,
            "height": s["r"] * 2,
            "cx": s["x"],
            "cy": s["y"],
        }

    if s["type"] == "rectangle":
        return {
            "left": s["x"],
            "right": s["x"] + s["w"],
            "top": s["y"],
            "bottom": s["y"] + s["h"],
            "width": s["w"],
            "height": s["h"],
            "cx": s["x"] + s["w"] / 2,
            "cy": s["y"] + s["h"] / 2,
        }

    if s["type"] == "triangle":
        xs = [s["x1"], s["x2"], s["x3"]]
        ys = [s["y1"], s["y2"], s["y3"]]
        left, right = min(xs), max(xs)
        top, bottom = min(ys), max(ys)

        return {
            "left": left,
            "right": right,
            "top": top,
            "bottom": bottom,
            "width": right - left,
            "height": bottom - top,
            "cx": sum(xs) / 3,
            "cy": sum(ys) / 3,
        }

    if s["type"] == "line":
        left, right = min(s["x1"], s["x2"]), max(s["x1"], s["x2"])
        top, bottom = min(s["y1"], s["y2"]), max(s["y1"], s["y2"])

        return {
            "left": left,
            "right": right,
            "top": top,
            "bottom": bottom,
            "width": max(1, right - left),
            "height": max(1, bottom - top),
            "cx": (s["x1"] + s["x2"]) / 2,
            "cy": (s["y1"] + s["y2"]) / 2,
        }

    return {
        "left": 0,
        "right": 0,
        "top": 0,
        "bottom": 0,
        "width": 0,
        "height": 0,
        "cx": 0,
        "cy": 0,
    }


def get_position_phrase(bounds: Dict[str, float]) -> str:
    cx = bounds["cx"] / GEN_WIDTH
    cy = bounds["cy"] / GEN_HEIGHT

    if cy < 0.33:
        v = "upper"
    elif cy < 0.66:
        v = "middle"
    else:
        v = "lower"

    if cx < 0.33:
        h = "left"
    elif cx < 0.66:
        h = "center"
    else:
        h = "right"

    return f"{v} {h}"


def get_size_phrase(bounds: Dict[str, float]) -> str:
    area_ratio = (bounds["width"] * bounds["height"]) / (GEN_WIDTH * GEN_HEIGHT)

    if area_ratio > 0.12:
        return "large"
    elif area_ratio > 0.04:
        return "medium"
    else:
        return "small"


def build_prompt_from_shapes(shapes: List[Dict[str, Any]]) -> str:
    if not shapes:
        return GLOBAL_STYLE_PROMPT

    prompt_parts = [GLOBAL_STYLE_PROMPT]
    role_descriptions = []

    for s in shapes:
        role = s.get("role", "display_object")
        base_phrase = ROLE_PROMPTS.get(role)

        if not base_phrase:
            continue

        bounds = get_shape_bounds(s)
        pos = get_position_phrase(bounds)
        size = get_size_phrase(bounds)

        if role == "mannequin":
            role_descriptions.append(f"{size} {pos} mannequin-like focal figure")
        elif role == "plinth":
            role_descriptions.append(f"{size} {pos} display plinth")
        elif role == "window_frame":
            role_descriptions.append("large framed shop window structure")
        elif role == "backdrop_panel":
            role_descriptions.append(f"{size} layered backdrop panel in the {pos}")
        elif role == "framed_display":
            role_descriptions.append(f"{size} framed display composition in the {pos}")
        elif role == "curtain_drape":
            role_descriptions.append(f"soft translucent drapery in the {pos}")
        elif role == "floral_cluster":
            role_descriptions.append(f"{size} floral cluster in the {pos}")
        elif role == "decor_cluster":
            role_descriptions.append(f"{size} decorative prop cluster in the {pos}")
        elif role == "lighting_glow":
            role_descriptions.append(f"warm glowing light accent in the {pos}")
        elif role == "display_object":
            role_descriptions.append(f"{size} sculptural display object in the {pos}")
        elif role == "folded_prop":
            role_descriptions.append(f"{size} folded display prop in the {pos}")
        elif role == "frame_bar":
            role_descriptions.append(f"thin framing bar in the {pos}")
        elif role == "hanging_string":
            role_descriptions.append(f"delicate hanging string detail in the {pos}")
        else:
            role_descriptions.append(base_phrase)

    if role_descriptions:
        prompt_parts.append(", ".join(role_descriptions))

    role_counts = summarize_shapes(shapes)

    if role_counts.get("mannequin", 0) >= 1:
        prompt_parts.append("central mannequin-led composition")

    if role_counts.get("plinth", 0) >= 1:
        prompt_parts.append("structured product presentation and pedestal arrangement")

    if role_counts.get("floral_cluster", 0) >= 1 or role_counts.get("decor_cluster", 0) >= 1:
        prompt_parts.append("soft styled props and decorative merchandising details")

    if role_counts.get("curtain_drape", 0) >= 1:
        prompt_parts.append("soft atmospheric drapery and dreamy textile layering")

    if role_counts.get("window_frame", 0) >= 1:
        prompt_parts.append("clear framed storefront composition")

    return ", ".join(prompt_parts)


def decode_base64_image(data_url: str) -> Image.Image:
    try:
        _, encoded = data_url.split(",", 1)
    except ValueError as e:
        raise ValueError("Invalid sketch data URL") from e

    img_bytes = base64.b64decode(encoded)
    img = Image.open(BytesIO(img_bytes)).convert("RGB")
    return img


def resize_with_white_bg(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    img = ImageOps.contain(img, (target_w, target_h))
    canvas = Image.new("RGB", (target_w, target_h), "white")

    offset_x = (target_w - img.width) // 2
    offset_y = (target_h - img.height) // 2

    canvas.paste(img, (offset_x, offset_y))
    return canvas


def run_generation(
    init_image: Image.Image,
    prompt: str,
    strength: float,
    steps: int,
    guidance_scale: float,
    seed: Optional[int],
) -> Image.Image:
    generator = None

    if seed is not None:
        generator = torch.Generator(device=DEVICE).manual_seed(seed)

    result = pipe(
        prompt=prompt,
        negative_prompt=NEGATIVE_PROMPT,
        image=init_image,
        strength=strength,
        num_inference_steps=steps,
        guidance_scale=guidance_scale,
        generator=generator,
    ).images[0]

    return result


@app.get("/")
def root():
    return {
        "ok": True,
        "message": "Backend is running.",
        "root_dir": str(ROOT_DIR),
        "lora_path": str(LORA_PATH),
        "lora_weight_exists": lora_weight_file.exists(),
        "train_dir_exists": TRAIN_DIR.exists(),
        "device": DEVICE,
    }


@app.post("/generate")
def generate(req: GenerateRequest):
    try:
        uid = str(uuid.uuid4())

        # Decode sketch
        sketch_img = decode_base64_image(req.sketch)
        sketch_img = resize_with_white_bg(sketch_img, GEN_WIDTH, GEN_HEIGHT)

        # Save input
        sketch_filename = f"{uid}_sketch.png"
        sketch_path = INPUT_DIR / sketch_filename
        sketch_img.save(sketch_path)

        # Build prompt
        prompt = build_prompt_from_shapes(req.shapes)

        # Generate image
        output_img = run_generation(
            init_image=sketch_img,
            prompt=prompt,
            strength=req.strength if req.strength is not None else DEFAULT_STRENGTH,
            steps=req.steps if req.steps is not None else DEFAULT_STEPS,
            guidance_scale=req.guidance_scale if req.guidance_scale is not None else DEFAULT_GUIDANCE_SCALE,
            seed=req.seed,
        )

        # Save output
        output_filename = f"{uid}_result.png"
        output_path = OUTPUT_DIR / output_filename
        output_img.save(output_path)

        return {
            "ok": True,
            "prompt": prompt,
            "shape_summary": summarize_shapes(req.shapes),
            "sketch_url": f"http://127.0.0.1:8000/inputs/{sketch_filename}",
            "image_url": f"http://127.0.0.1:8000/outputs/{output_filename}",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))