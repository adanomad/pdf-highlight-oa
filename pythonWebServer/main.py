import open_clip
import torch
from PIL import Image
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

import base64
import random
import time

app = Flask(__name__)
CORS(app)

def base64_to_image(base64_string):
    # Remove the data URI prefix if present
    if "data:image" in base64_string:
        base64_string = base64_string.split(",")[1]
    # Decode the Base64 string into bytes
    image_bytes = base64.b64decode(base64_string)
    return image_bytes

device = "cuda" if torch.cuda.is_available() else "cpu"

model, preprocess = open_clip.create_model_from_pretrained('hf-hub:laion/CLIP-ViT-B-32-laion2B-s34B-b79K')
tokenizer = open_clip.get_tokenizer('hf-hub:laion/CLIP-ViT-B-32-laion2B-s34B-b79K')

model.to(device)


def imageContains(rawImage, keyword):
    image = Image.open(rawImage)
    image = preprocess(image).unsqueeze(0).to(device)
    text = tokenizer(keyword).to(device)

    with torch.no_grad(), torch.cuda.amp.autocast():
        image_features = model.encode_image(image)
        text_features = model.encode_text(text)
        image_features /= image_features.norm(dim=-1, keepdim=True)
        text_features /= text_features.norm(dim=-1, keepdim=True)
        text_probs = image_features @ text_features.T
    return text_probs.item() > 0.2


@app.route('/image-contains', methods=['POST'])
def image_contains_endpoint():
    data = request.get_json()
    if 'image' not in data or 'keyword' not in data:
        return jsonify({'error': 'Missing image or keyword in request data'}), 400

    image_b64 = data['image']
    keyword = data['keyword']

    filename = f"images/{time.time()}"


    with open(filename, 'wb') as f:
        f.write(base64_to_image(image_b64))

    result = imageContains(filename, keyword)
    return jsonify({'result': result})


if __name__ == '__main__':
    app.run(debug=True)
