from flask import Flask, request, jsonify
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import base64
import requests
from io import BytesIO
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load the CLIP model and processor
model = CLIPModel.from_pretrained('openai/clip-vit-base-patch32')
processor = CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32')

@app.route('/embed-text', methods=['POST'])
def embed_text():
    try:
        data = request.json
        text = data.get('text')

        if not text:
            return jsonify({'error': 'No text provided'}), 400

        # Process the text input and compute embeddings
        inputs = processor(text=[text], return_tensors="pt", padding=True)
        embeddings = model.get_text_features(**inputs).detach().cpu().numpy()

        return jsonify({'embedding': embeddings.tolist()})
    
    except Exception as e:
        app.logger.error(f"Error processing text: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/embed-image', methods=['POST'])
def embed_image():
    data = request.json
    image_data = data.get('image_url')

    if not image_data:
        return jsonify({'error': 'No image data provided'}), 400

    try:
        # Check if the image data is in base64 format (starts with 'data:image/')
        if image_data.startswith('data:image'):
            # Extract base64 data from the format (data:image/png;base64,...)
            header, base64_data = image_data.split(',', 1)
            image = Image.open(BytesIO(base64.b64decode(base64_data)))
            app.logger.debug(f"Processed base64 image with header: {header}")
        else:
            # Assume it's a URL, download the image
            response = requests.get(image_data)
            response.raise_for_status()  # Ensure the request was successful
            image = Image.open(BytesIO(response.content))
            app.logger.debug("Processed image from URL")

        # Check if the image was successfully loaded
        if image is None:
            raise ValueError("Failed to load image")

        # Process the image and compute embeddings
        inputs = processor(images=image, return_tensors="pt")
        embeddings = model.get_image_features(**inputs).detach().cpu().numpy()

        return jsonify({'embedding': embeddings.tolist()})

    except requests.exceptions.RequestException as e:
        app.logger.error(f"Error fetching image from URL: {e}")
        return jsonify({'error': f"Error fetching image: {str(e)}"}), 500

    except Exception as e:
        app.logger.error(f"Error processing image: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
