// app/utils/tensorflow.ts

import * as mobilenet from '@tensorflow-models/mobilenet';
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';

// Load the Universal Sentence Encoder model
let textModel: use.UniversalSentenceEncoder | null = null;
export const loadTextModel = async () => {
  if (!textModel) {
    textModel = await use.load();
  }
  return textModel;
};

// Load the MobileNet model
let imageModel: mobilenet.MobileNet | null = null;
export const loadImageModel = async () => {
  if (!imageModel) {
    imageModel = await mobilenet.load();
  }
  return imageModel;
};

// Compute text embedding using Universal Sentence Encoder
export const computeTextEmbedding = async (text: string) => {
  const model = await loadTextModel();
  const embeddings = await model.embed([text]);
  return embeddings;
};

// Compute image embedding using MobileNet
export const computeImageEmbedding = async (imageData: any) => {
  const model = await loadImageModel();

  // Create a canvas to render the PDF image
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    console.error('Unable to get canvas context');
    return null;
  }

  // Set the canvas dimensions based on extracted image dimensions
  if (imageData.width && imageData.height) {
    canvas.width = imageData.width;
    canvas.height = imageData.height;
  } else {
    console.error('Invalid image dimensions');
    return null;
  }

  // Check if the imageData contains an HTMLImageElement or base64 data
  if (imageData instanceof HTMLImageElement) {
    // If imageData is an HTMLImageElement, draw it onto the canvas
    ctx.drawImage(imageData, 0, 0, imageData.width, imageData.height);
  } else if (typeof imageData === 'string') {
    // If imageData is a base64-encoded string, load it into an Image object
    const imageElement = new Image();
    imageElement.src = imageData;

    // Wait for the image to load before drawing it on the canvas
    await new Promise((resolve, reject) => {
      imageElement.onload = () => {
        ctx.drawImage(imageElement, 0, 0, imageElement.width, imageElement.height);
        resolve(true);
      };
      imageElement.onerror = reject; // Handle image loading errors
    });
  } else {
    console.error('Invalid image data format:', imageData);
    return null;
  }

  try {
    // Pass the canvas to the mobilenet model for inference
    const embeddings = await model.infer(canvas, true);

    return embeddings;
  } catch (error) {
    console.error('Error during image inference:', error);
    return null;
  }
};

export const trimImageEmbedding = (imageEmbedding: any, targetSize: number) => {
  if (imageEmbedding.shape[1] > targetSize) {
    return imageEmbedding.slice([0, 0], [-1, targetSize]); // Trim excess dimensions
  } else if (imageEmbedding.shape[1] < targetSize) {
    return tf.pad(imageEmbedding, [[0, 0], [0, targetSize - imageEmbedding.shape[1]]]); // Pad to match size
  }
  return imageEmbedding;
};

// Cosine Similarity Function
export const cosineSimilarity = (a: tf.Tensor, b: tf.Tensor) => {
  // Squeeze the tensors to 1D
  const aSqueezed = a.squeeze();
  const bSqueezed = b.squeeze();

  // Normalize the tensors
  const aNorm = aSqueezed.div(aSqueezed.norm());
  const bNorm = bSqueezed.div(bSqueezed.norm());

  // Calculate the dot product
  const similarity = aNorm.dot(bNorm);

  return similarity.dataSync()[0];  // Return the raw similarity score
};