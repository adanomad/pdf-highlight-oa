import * as tf from '@tensorflow/tfjs';
import { getDocument, GlobalWorkerOptions, OPS } from 'pdfjs-dist';
import '@tensorflow/tfjs-backend-webgl';

// Set the PDF.js worker source for version ^4.4.168
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js`;

// Load MobileNet for image embeddings
const mobileNetModel = await tf.loadGraphModel('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@1.0.0');

// Load Universal Sentence Encoder for text embeddings
const useModel = await tf.loadGraphModel('https://tfhub.dev/google/universal-sentence-encoder/2');

// Function to generate image embeddings using MobileNet
export const getImageEmbedding = async (imageElement: HTMLImageElement): Promise<number[]> => {
  const inputTensor = tf.browser.fromPixels(imageElement)
    .resizeNearestNeighbor([224, 224])
    .toFloat()
    .expandDims();

  const embeddings = await mobileNetModel.predict(inputTensor) as tf.Tensor;
  const embeddingArray = embeddings.dataSync();  // Synchronously convert to flat array
  return Array.from(embeddingArray);
};

// Function to generate text embeddings using Universal Sentence Encoder
export const getTextEmbedding = async (query: string): Promise<number[]> => {
  const inputTensor = tf.tensor([query]);

  const embeddings = await useModel.execute(inputTensor) as tf.Tensor;
  const embeddingArray = embeddings.dataSync();  // Synchronously convert to flat array
  return Array.from(embeddingArray);
};

// Function to calculate cosine similarity between two vectors
export const cosineSimilarity = (vec1: number[], vec2: number[]): number => {
  const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitude1 * magnitude2);
};

// Function to search embeddings
export const searchEmbeddings = (queryEmbedding: number[], imageEmbeddings: number[][]): { similarity: number; index: number }[] => {
  return imageEmbeddings.map((imageEmbedding, index) => {
    const similarity = cosineSimilarity(queryEmbedding, imageEmbedding);
    return { similarity, index };
  }).filter(result => result.similarity > 0.8);  // Filter by similarity threshold (0.8)
};

// Function to load the PDF and extract images from each page
export const extractImagesFromPDF = async (pdfDocument: any): Promise<HTMLImageElement[]> => {
  const images: HTMLImageElement[] = [];

  // Load the PDF document
  const loadingTask = getDocument(pdfDocument);
  const pdf = await loadingTask.promise;

  // Iterate through all pages in the PDF
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const imagesOnPage = await extractImagesFromPage(page);
    images.push(...imagesOnPage);  // Append the extracted images from the page
  }

  return images;
};

// Function to extract images from a specific PDF page
const extractImagesFromPage = async (page: any): Promise<HTMLImageElement[]> => {
  const images: HTMLImageElement[] = [];
  const viewport = page.getViewport({ scale: 1.0 });

  // Render the page content to get the operator list (images are part of the operators)
  const operatorList = await page.getOperatorList();

  // Create a canvas to render the page
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  // Render the page to the canvas
  const renderContext = {
    canvasContext: ctx,
    viewport,
  };
  await page.render(renderContext).promise;

  // Look for image objects in the operator list using the correct operator code for image rendering (OPS.paintImageXObject)
  for (let i = 0; i < operatorList.fnArray.length; i++) {
    if (operatorList.fnArray[i] === OPS.paintImageXObject) {  // Check for the image rendering operator
      const img = document.createElement('img');
      img.src = canvas.toDataURL();  // Convert the canvas to base64 data URL
      images.push(img);
    }
  }

  return images;
};
