from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
from io import BytesIO
import base64, requests

app = Flask(__name__)
CORS(app)

model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

@app.post("/embed-text")
def embed_text():
    data = request.get_json(force=True)
    text = data.get("text")
    if not text:
        return jsonify(error="text required"), 400
    inputs = processor(text=[text], return_tensors="pt", padding=True)
    emb = model.get_text_features(**inputs).detach().cpu().numpy().tolist()
    return jsonify(embedding=emb)

@app.post("/embed-image")
def embed_image():
    data = request.get_json(force=True)
    img = data.get("image_url")
    if not img:
        return jsonify(error="image_url required"), 400

    if img.startswith("data:image"):
        _, b64 = img.split(",", 1)
        image = Image.open(BytesIO(base64.b64decode(b64))).convert("RGB")
    else:
        r = requests.get(img, timeout=15)
        r.raise_for_status()
        image = Image.open(BytesIO(r.content)).convert("RGB")

    inputs = processor(images=image, return_tensors="pt")
    emb = model.get_image_features(**inputs).detach().cpu().numpy().tolist()
    return jsonify(embedding=emb)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
