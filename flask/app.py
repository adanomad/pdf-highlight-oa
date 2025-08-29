from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import CLIPProcessor, CLIPModel
import torch
from PIL import Image
import io, base64, requests

app = Flask(__name__)
CORS(app)

model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def chunk_text(text: str, max_chars: int = 300):
    # collapse whitespace so we don't over-count
    t = " ".join((text or "").split())
    if len(t) <= max_chars:
        return [t]
    chunks, cur, cur_len = [], [], 0
    for w in t.split():
        if cur_len + len(w) + (1 if cur else 0) > max_chars:
            if cur:
                chunks.append(" ".join(cur))
            cur, cur_len = [w], len(w)
        else:
            cur.append(w)
            cur_len += len(w) + (1 if cur_len else 0)
    if cur:
        chunks.append(" ".join(cur))
    return chunks

@app.post("/embed-text")
def embed_text():
    data = request.get_json(force=True)
    text = data.get("text")
    if not text:
        return jsonify(error="text required"), 400

    parts = chunk_text(text, max_chars=300)
    embs = []
    with torch.no_grad():
        for p in parts:
            inputs = processor(
                text=[p],
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=77,  # CLIP context window
            )
            feat = model.get_text_features(**inputs)
            feat = torch.nn.functional.normalize(feat, p=2, dim=-1)  # L2 norm
            embs.append(feat[0])  # shape: (512,)

    if len(embs) == 1:
        out = embs[0]
    else:
        stacked = torch.stack(embs, dim=0)
        out = torch.nn.functional.normalize(stacked.mean(dim=0), p=2, dim=-1)

    return jsonify(embedding=out.cpu().numpy().tolist())

@app.post("/embed-image")
def embed_image():
    """
    Accepts either:
      - { "image_base64": "<base64-bytes-without-data-url-prefix>" }
      - { "image_url": "https://..." }
    Returns: { "embedding": [512 floats] }
    """
    data = request.get_json(force=True)
    b64 = data.get("image_base64")
    url = data.get("image_url")

    if not b64 and not url:
        return jsonify(error="image_base64 or image_url required"), 400

    try:
        if b64:
            img_bytes = base64.b64decode(b64)
        else:
            r = requests.get(url, timeout=15)
            r.raise_for_status()
            img_bytes = r.content

        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    except Exception as e:
        return jsonify(error=f"could not load image: {e}"), 400

    with torch.no_grad():
        inputs = processor(images=img, return_tensors="pt")
        feat = model.get_image_features(**inputs)
        feat = torch.nn.functional.normalize(feat, p=2, dim=-1)
        emb = feat[0].cpu().numpy().tolist()

    return jsonify(embedding=emb)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
