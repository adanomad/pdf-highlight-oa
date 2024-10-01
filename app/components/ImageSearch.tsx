import React, { useState } from 'react';
import { extractImagesFromPDF, getImageEmbedding, getTextEmbedding, searchEmbeddings } from '../utils/imageSearchHelpers';

interface ImageSearchProps {
  pdfUrl: string;
}

const ImageSearch: React.FC<ImageSearchProps> = ({ pdfUrl }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [results, setResults] = useState<{ similarity: number; index: number }[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const handleSearch = async () => {
    setIsSearching(true);

    try {
      // Step 1: Extract images from the PDF using the helper function
      const images = await extractImagesFromPDF(pdfUrl);

      // Step 2: Generate embeddings for each image
      const imageEmbeddings = await Promise.all(images.map(async (img) => getImageEmbedding(img)));

      // Step 3: Generate text query embedding
      const queryEmbedding = await getTextEmbedding(searchQuery);

      // Step 4: Perform search by comparing the query embedding with image embeddings
      const matchingResults = searchEmbeddings(queryEmbedding, imageEmbeddings);
      setResults(matchingResults);
    } catch (error) {
      console.error('Error during search:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search images"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <button onClick={handleSearch} disabled={isSearching}>
        {isSearching ? 'Searching...' : 'Search'}
      </button>

      <div>
        {results.length > 0 ? (
          results.map((result, index) => (
            <p key={index}>Image found at index {result.index}, Similarity: {result.similarity.toFixed(2)}</p>
          ))
        ) : (
          <p>No matches found.</p>
        )}
      </div>
    </div>
  );
};

export default ImageSearch;
