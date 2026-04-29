# hai-recipe-agent

## Open-Source Code and Attribution

This project is built on top of open-source frameworks and libraries, plus pre-trained model weights:

- React + Vite frontend starter structure
- FastAPI backend application structure
- `google-genai` SDK for Gemini API access
- Ultralytics `YOLOE` package and model weights (`yoloe-26l-seg.pt`) for initial object detection
- Pillow (`PIL`) for image preprocessing, cropping, and annotation rendering

I did not import any open source code into my project. I asked Cursor to create a boilerplate repository so I could get started. I coded the backend myself and had Cursor help debug if there were errors I did not know to solve. For the frontend, I had assistance from Cursor to construct the user interface and styling components. I provided the chat logs for this under the /transcripts folder. 

## Nontrivial Changes Made

Compared to a basic React/FastAPI scaffold, the following nontrivial changes were implemented:

- Added a multi-stage backend vision pipeline (`reading -> detecting -> first_pass -> second_pass -> done`) in `backend/services/vision.py`
- Integrated YOLOE detections with Gemini structured generation to produce normalized ingredient records with bounding boxes
- Implemented second-pass low-confidence recheck logic using image crops for better ingredient identification quality
- Added backend Server-Sent Events streaming in `backend/routers/detect.py` so the frontend receives progress updates in real time
- Built frontend SSE stream parsing and event handling in `frontend/src/services/api/pantryApi.js`
- Implemented a full multi-stage recipe workflow UI in `frontend/src/App.jsx` and `frontend/src/features/recipeFlow/*`
- Added interactive ingredient editing and manual ingredient addition/deletion before recipe generation
- Added recipe generation and conversational recipe guidance API flows via `/recipes/` and `/recipes/chat`

## New Code Implemented in This Repository

Major new implementation areas include:

- **Backend services**
  - `backend/services/vision.py`: end-to-end ingredient detection and refinement pipeline
  - `backend/services/image_utils.py`: preprocessing, crop extraction, and annotation drawing utilities
  - `backend/services/recipe_gen.py`: recipe generation and chat guidance integration
- **Backend API surface**
  - `backend/routers/detect.py`: streaming detection endpoint
  - `backend/routers/recipes.py`: recipe generation and chat endpoints
  - `backend/routers/health.py`: health-check endpoint
- **Frontend application code**
  - `frontend/src/App.jsx`: orchestration of upload, detection, synthesis, and execution stages
  - `frontend/src/services/api/pantryApi.js`: stream consumer + API client calls
  - `frontend/src/features/recipeFlow/*`: stage panels, navigation, diagnostics, and flow-specific UI logic
- **Prompting and schema support**
  - `backend/prompts/first_pass.txt` and `backend/prompts/second_pass.txt`
  - Pydantic/domain models under `backend/models/*`
