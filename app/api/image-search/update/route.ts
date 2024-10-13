// api/image-search/update/route.ts

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';

export async function POST(req: Request) {
  try {
    // Parse form data to extract the search term and PDF file
    const formData = await req.formData();
    const searchTerm = formData.get('searchTerm') as string;
    const pdfFile = formData.get('pdfFile') as File; // Ensure the field name matches the front-end form

    if (!searchTerm || !pdfFile) {
      return new Response(
        JSON.stringify({ error: 'Missing searchTerm or pdfFile' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Convert the PDF file to a Buffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Prepare the form data to send to the Python API
    const apiFormData = new FormData();
    apiFormData.append('search_term', searchTerm);
    apiFormData.append('pdf_file', buffer, {
      filename: pdfFile.name,
      contentType: pdfFile.type,
    });

    // Make a POST request to the Python API
    const response = await axios.post('http://localhost:8000/search_images', apiFormData, {
      headers: apiFormData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // Get the results from the Python API response
    const { results } = response.data;

    // Return the results as a JSON response
    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error calling the image search API:', error);
    return new Response(
      JSON.stringify({ error: 'Image search failed', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
