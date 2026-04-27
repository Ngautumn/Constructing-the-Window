# Window Display Generator

This project is an interactive machine learning prototype that transforms simple geometric sketches into AI-generated shop window display images.

Users draw basic shapes on a p5.js canvas and assign each shape a semantic role, such as `window_frame`, `mannequin`, `plinth`, `backdrop_panel`, or `lighting_glow`.

The frontend sends both the sketch image and the shape metadata to a FastAPI backend. The backend then uses a Stable Diffusion img2img pipeline with a fine-tuned LoRA model to generate a dreamlike retail window display image.



## Project Structure

```text
Final Project Due：4月27日/
│
├── app.py
├── test_lora.py
│
├── frontend/
│   ├── index.html
│   └── sketch.js
│
├── data/
│   └── final_train_set/
│       └── train/
│
├── lora_output/
│   ├── round2_300steps/
│   │   └── pytorch_lora_weights.safetensors
│   │
│   └── round2_300steps_results/
│
├── lora_training/
│   └── diffusers/
│
├── inputs/
│
└── outputs/
```



## Main Files

### `app.py`

This is the backend server.

It uses:

- FastAPI
- Uvicorn
- Stable Diffusion img2img
- Hugging Face Diffusers
- LoRA weights
- shape metadata from the frontend
- base64 sketch image input

The backend receives a sketch and a list of semantic shapes, builds a prompt from the shape roles, and generates a final image.

The generated input sketches are saved in:

```text
inputs/
```

The generated result images are saved in:

```text
outputs/
```



### `frontend/sketch.js`

This is the frontend drawing interface.

It allows users to:

- draw circles, rectangles, triangles, and lines
- assign semantic roles to shapes
- move existing shapes
- delete selected shapes
- export the sketch
- send the sketch and metadata to the backend
- preview the generated result

Available semantic roles include:

```text
window_frame
mannequin
plinth
backdrop_panel
framed_display
curtain_drape
floral_cluster
decor_cluster
lighting_glow
display_object
folded_prop
frame_bar
hanging_string
```

These roles are used to help the backend understand the meaning of each geometric shape.

For example:

```text
window_frame      shop window frame
mannequin         mannequin or central figure
plinth            display pedestal
backdrop_panel    background panel
lighting_glow     light or glowing area
floral_cluster    floral decoration
decor_cluster     decorative objects
display_object    main display object
```



### `test_lora.py`

This script tests the LoRA model separately.

It first generates images using the base Stable Diffusion model, then loads the LoRA weights and generates another set of images using the same prompts.

This helps compare the difference between the base model and the fine-tuned LoRA model.

The test results are saved to:

```text
lora_output/round2_300steps_results/
```



### `lora_training/diffusers/`

This folder contains the Diffusers training source code used during the experimentation and LoRA training process.

It is not required for running the frontend demo.

To run the final interactive system, the backend only needs:

- the installed Python `diffusers` package
- the trained LoRA weight file
- the frontend files
- the backend `app.py`



## Installation

Before running the project, install the required Python packages:

```bash
pip install fastapi uvicorn torch diffusers pillow pydantic safetensors transformers accelerate
```

This project uses the Python `diffusers` library to load Stable Diffusion.

Users do not need to install a separate Stable Diffusion application.



## Stable Diffusion and LoRA Requirements

The backend uses the following base model:

```text
stable-diffusion-v1-5/stable-diffusion-v1-5
```

The project also requires the trained LoRA weight file to exist at:

```text
lora_output/round2_300steps/pytorch_lora_weights.safetensors
```

If this LoRA file is missing, the backend will stop and show an error.

On the first run, the base Stable Diffusion model may be downloaded automatically through the `diffusers` library. Therefore, an internet connection may be required the first time the backend is launched.

A CUDA-supported NVIDIA GPU is recommended because Stable Diffusion generation is very slow on CPU.



## How to Run

Open two terminals.



## Terminal 1: Backend

Run the backend server from the project root:

```bash
cd "E:\Machine learning\Final Project Due：4月27日"
python -m uvicorn app:app --port 8000
```

The backend will run at:

```text
http://127.0.0.1:8000
```

You can test whether the backend is running by opening:

```text
http://127.0.0.1:8000
```

If the backend is running correctly, the browser should show a JSON message similar to:

```json
{
  "ok": true,
  "message": "Backend is running."
}
```



## Terminal 2: Frontend

Run the frontend from the same project root.

Use port `5501` and force the server to serve the `frontend` folder:

```bash
cd "E:\Machine learning\Final Project Due：4月27日"
python -m http.server 5501 --directory frontend
```

Then open the frontend in the browser:

```text
http://127.0.0.1:5501
```


## How to Use

1. Open the frontend page in the browser.
2. Choose a shape tool: `Circle`, `Rectangle`, `Triangle`, or `Line`.
3. Choose a semantic role from the role dropdown.
4. Drag on the canvas to create shapes.
5. Click an existing shape to select it.
6. Drag a selected shape to move it.
7. Use `Apply Role to Selected` to change the selected shape's role.
8. Use `Delete Selected` to remove one selected shape.
9. Click `Generate` to send the sketch to the backend.
10. The generated image will appear on the right side of the page.



## Generation Logic

The project does not only send a sketch image to the model. It also sends semantic metadata for each shape.

For example:

- a rectangle with the role `window_frame` becomes a shop window structure
- a central shape with the role `mannequin` becomes a mannequin-like focal figure
- a lower shape with the role `plinth` becomes a display pedestal
- a circle with the role `lighting_glow` becomes a soft glowing light accent
- decorative shapes become floral clusters, props, or display objects

The backend converts these roles, positions, and sizes into a text prompt.

This prompt guides Stable Diffusion together with the sketch image.



## Example Prompt Style

The generated prompt may look like this:

```text
luxury shop window display, dreamlike scene, soft glow, layered composition, theatrical lighting, framed display, central focal object, boutique storefront, warm elegant visual merchandising, cinematic storefront photography, large framed shop window structure, medium center mannequin-like focal figure, small lower center display plinth, central mannequin-led composition, structured product presentation and pedestal arrangement
```



## Notes

Keep both terminals open while using the project.

The frontend communicates with the backend through:

```text
http://127.0.0.1:8000/generate
```

If generation fails, check:

- whether the backend is still running
- whether the LoRA file exists
- whether the model path is correct
- whether CUDA is available
- whether the frontend is opened from `http://127.0.0.1:5501`
- whether the required Python packages are installed



## Common Problems

### Backend cannot start

Check whether the LoRA file exists:

```text
lora_output/round2_300steps/pytorch_lora_weights.safetensors
```

Also check whether all required packages are installed:

```bash
pip install fastapi uvicorn torch diffusers pillow pydantic safetensors transformers accelerate
```



### Frontend cannot generate image

Make sure the backend is running at:

```text
http://127.0.0.1:8000
```

Also make sure the frontend is opened from:

```text
http://127.0.0.1:5501
```



### Generation is very slow

Stable Diffusion is slow on CPU.

A CUDA-supported NVIDIA GPU is recommended for faster generation.



## Project Aim

The aim of this project is to explore how simple user-drawn geometric forms can become a generative visual system.

Instead of drawing detailed images directly, the user creates a simplified spatial and semantic structure. The machine learning model then interprets this structure and transforms it into a stylised shop window display.

This creates a workflow between human sketching, semantic mapping, and AI image generation.

```text
Human sketching → Semantic mapping → AI image generation
```