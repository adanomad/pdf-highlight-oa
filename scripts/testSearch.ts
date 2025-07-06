// scripts/testSearch.ts

import fetch from 'node-fetch';

const query = "machine learning"; 

interface SearchResult {
  pdfId: string;
  filename: string;
  page: number;
  text: string;
}

async function testSearch() {
  const response = await fetch("http://localhost:3000/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    console.error("Failed to search:", await response.text());
    return;
  }

  const results = (await response.json()) as SearchResult[];

  console.log("Search results:");
  results.forEach((res, idx) => {
    console.log(
      `#${idx + 1} | PDF: ${res.filename} | Page: ${res.page} | Match: ${res.text.slice(0, 100)}...`
    );
  });
}

testSearch();
