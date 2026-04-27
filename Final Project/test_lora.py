import torch
from diffusers import StableDiffusionPipeline
from pathlib import Path

base_model = "stable-diffusion-v1-5/stable-diffusion-v1-5"
lora_dir = r"E:\Machine learning\Final Project Due：4月27日\lora_output\round2_300steps"
output_dir = Path(r"E:\Machine learning\Final Project Due：4月27日\lora_output\round2_300steps_results")
output_dir.mkdir(parents=True, exist_ok=True)

prompts = [
    "shop window display, dreamlike scene, soft glow, layered composition",
    "luxury shop window display, theatrical lighting, framed display, central object",
    "surreal retail display, soft glow, layered composition, sculptural arrangement",
    "night shop window display, dreamlike scene, central object, soft glow"
]

pipe = StableDiffusionPipeline.from_pretrained(
    base_model,
    torch_dtype=torch.float16
).to("cuda")


for i, prompt in enumerate(prompts, start=1):
    image = pipe(prompt, num_inference_steps=30, guidance_scale=7.5).images[0]
    image.save(output_dir / f"base_{i}.png")


pipe.load_lora_weights(
    lora_dir,
    weight_name="pytorch_lora_weights.safetensors"
)

for i, prompt in enumerate(prompts, start=1):
    image = pipe(prompt, num_inference_steps=30, guidance_scale=7.5).images[0]
    image.save(output_dir / f"lora_{i}.png")

print("Done. Results saved to:", output_dir)
