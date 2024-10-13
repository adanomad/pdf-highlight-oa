# image_search.py

import fitz  # PyMuPDF
import io
from PIL import Image
import torch
import clip
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

def extract_images_from_pdf(pdf_path):
    images = []
    doc = fitz.open(pdf_path)
    for page_index in range(len(doc)):
        page = doc[page_index]
        image_list = page.get_images(full=True)
        for img_index, img in enumerate(image_list):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
            images.append(image)
    return images

def get_text_embedding(text):
    text_tokens = clip.tokenize([text]).to(device)
    with torch.no_grad():
        text_embedding = model.encode_text(text_tokens)
    text_embedding /= text_embedding.norm(dim=-1, keepdim=True)
    return text_embedding.cpu().numpy()

def get_image_embeddings(images):
    image_embeddings = []
    for image in images:
        image_input = preprocess(image).unsqueeze(0).to(device)
        with torch.no_grad():
            image_embedding = model.encode_image(image_input)
        image_embedding /= image_embedding.norm(dim=-1, keepdim=True)
        image_embeddings.append(image_embedding.cpu().numpy())
    return image_embeddings

def find_best_matches(text_embedding, image_embeddings):
    similarities = []
    for idx, image_embedding in enumerate(image_embeddings):
        similarity = cosine_similarity(text_embedding, image_embedding)
        # Convert the similarity score to a native Python float
        similarity_score = float(similarity[0][0])
        similarities.append((idx, similarity_score))
    # Sort the results
    similarities.sort(key=lambda x: x[1], reverse=True)
    return similarities


def run_image_search(search_term, pdf_path):
    # Step 1: Extract images from PDF
    images = extract_images_from_pdf(pdf_path)
    if not images:
        print("No images found in PDF.")
        return [], []

    # Step 2: Generate embeddings
    text_embedding = get_text_embedding(search_term)
    image_embeddings = get_image_embeddings(images)

    # Step 3: Compute similarities
    results = find_best_matches(text_embedding, image_embeddings)

    return results, images
