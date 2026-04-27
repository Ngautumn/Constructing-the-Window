
# Constructing the Window
### By Shuran Zhang
<img width="1736" height="1199" alt="image" src="https://github.com/user-attachments/assets/e05ef0af-dc6c-4d67-87f3-81af8fe3d242" />

This project is an interactive machine learning prototype that transforms simple geometric sketches into AI-generated shop window display images.

Users can draw basic geometric shapes on a p5.js canvas and assign each shape a semantic role, such as `window_frame`, `mannequin`, `plinth`, `backdrop_panel`, or `lighting_glow`.

The frontend sends both the sketch image and the shape metadata to a FastAPI backend. The backend uses a Stable Diffusion img2img pipeline with a fine-tuned LoRA model to generate a dreamlike retail window display image.



## About `lora_training/diffusers/`

The `lora_training/diffusers/` folder was only used for local LoRA training experiments, so it is not uploaded to GitHub. The final demo does not depend on this local folder to run.

To run the project, users only need to install the official Python `diffusers` package:

```bash
pip install diffusers
```

As long as the required dependencies are installed correctly and the LoRA weight file exists, the project can run normally.



## Main Files

### `app.py`

This is the backend server file. It receives the sketch and semantic shape data from the frontend, then uses Stable Diffusion and the LoRA model to generate an image.

The input sketches are saved in `inputs/`, and the generated results are saved in `outputs/`.





### `frontend/sketch.js`

This is the main frontend interaction file. It handles drawing shapes, assigning semantic roles, moving or deleting shapes, and sending data to the backend.

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



### `test_lora.py`

This script is used to test the LoRA model separately. It compares the generation results of the base Stable Diffusion model and the fine-tuned LoRA model.

The test results are saved to:

```text
lora_output/
```



## Installation

Before running the project, install the required Python packages:

```bash
pip install fastapi uvicorn torch diffusers pillow pydantic safetensors transformers accelerate
```

This project uses the official Python `diffusers` library to load Stable Diffusion.

Users do not need to install a separate Stable Diffusion application or download the local `lora_training/diffusers/` folder.



## Stable Diffusion and LoRA Requirements

The backend uses the following base model:

```text
stable-diffusion-v1-5/stable-diffusion-v1-5
```

The project also requires the trained LoRA weight file to exist at:

```text
Final Project/lora_output/
```

If this LoRA file is missing, the backend will stop and show an error.

On the first run, the base Stable Diffusion model may be downloaded automatically through the `diffusers` library, so an internet connection may be required.

A CUDA-supported NVIDIA GPU is recommended because Stable Diffusion generation is very slow on CPU.



## How to Run

Open two terminal windows.

Both terminals should be run from the `Final Project` folder.

On my local computer, the project folder is:

```text
E:\Machine learning\Constructing-the-Window\Final Project
```



## Terminal 1: Run the Backend

Run the backend server:

```bash
cd "E:\Machine learning\Constructing-the-Window\Final Project"
python -m uvicorn app:app --port 8000
```

The backend will run at:

```text
http://127.0.0.1:8000
```

You can open the following address in the browser to check whether the backend is running




## Terminal 2: Run the Frontend

Run the frontend from the same `Final Project` folder.

Use port `5501` and serve the `frontend` folder:

```bash
cd "E:\Machine learning\Constructing-the-Window\Final Project"
python -m http.server 5501 --directory frontend
```

Then open the following address in the browser:

```text
http://127.0.0.1:5501
```



## How to Use

1. Open the frontend page in the browser.
2. Choose a shape tool: `Circle`, `Rectangle`, `Triangle`, or `Line`.
3. Select a semantic role from the role dropdown menu.
4. Drag on the canvas to create a shape.
5. Click an existing shape to select it.
6. Drag the selected shape to move it.
7. Use `Apply Role to Selected` to change the selected shape's role.
8. Use `Delete Selected` to remove the selected shape.
9. Click `Generate` to send the sketch to the backend.
10. The generated image will appear on the right side of the page.



## Notes

Keep both terminal windows open while using the project.

The frontend communicates with the backend through:

```text
http://127.0.0.1:8000/generate
```

If generation fails, check:

- whether the backend is running
- whether the LoRA weight file exists
- whether the required Python packages are installed
- whether the Python `diffusers` package is installed
- whether the frontend is opened from `http://127.0.0.1:5501`



## Common Problems

### Backend cannot start

Make sure the required dependencies are installed and the LoRA weight file exists.

```bash
pip install fastapi uvicorn torch diffusers pillow pydantic safetensors transformers accelerate
```

```text
Final Project/lora_output
```



### Cannot find `diffusers` or `fastapi`

If a `ModuleNotFoundError` appears, it means the current Python environment is missing dependencies. Reinstall them with:

```bash
pip install fastapi uvicorn diffusers
```



### Frontend cannot generate image

Make sure the backend is running and the frontend is opened from the correct address.

```text
http://127.0.0.1:8000
http://127.0.0.1:5501
```



### Generation is very slow

Stable Diffusion is very slow on CPU. A CUDA-supported NVIDIA GPU is recommended.



