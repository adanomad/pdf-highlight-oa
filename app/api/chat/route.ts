import { NextRequest, NextResponse } from 'next/server';
import { Message } from '../../utils/types';

export async function POST(request: NextRequest) {
  try {
    const { pdfUrl, message, history } = await request.json();

    if (!pdfUrl || !message) {
      return NextResponse.json(
        { error: 'PDF URL and message are required' },
        { status: 400 }
      );
    }

    // Instead of trying to extract text from the PDF,
    // let's simulate a response for now to get the chat working
    
    // This is just for the demo - in a real application, you would:
    // 1. Use a server-side PDF extraction library that doesn't need workers
    // 2. OR pre-extract text when the PDF is uploaded and store it
    // 3. OR use a third-party API to extract text from PDFs
    
    const mockPdfContent = `This is a simulation of PDF content extraction.
    The actual PDF you uploaded would normally be processed here.
    For demo purposes, I'll respond as if I had read your PDF.
    You can ask questions about this document, and I'll do my best to answer.`;
    
    // Prepare conversation history
    const formattedHistory = history.map((msg: Message) => ({
      role: msg.role,
      content: msg.content,
    }));
    
    // Call AI model API (e.g., OpenAI)
    const aiResponse = await callAiModel(message, mockPdfContent, formattedHistory);
    
    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

// Call AI model (OpenAI example)
async function callAiModel(
  message: string, 
  pdfContent: string, 
  history: Array<{role: string, content: string}>
): Promise<string> {
  // Replace with your API key and endpoint
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return "OpenAI API key not found. Please add your API key to the .env file.";
  }

  const contextPrompt = `You are an AI assistant that answers questions about PDF documents. 
  Use the following PDF content to answer the user's questions.
  PDF Content:
  ${pdfContent}
  
  Answer the user's questions based on the PDF content. If the information is not in the PDF, 
  say that you cannot find that information in the document.`;
  
  const messages = [
    { role: 'system', content: contextPrompt },
    ...history,
    { role: 'user', content: message }
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling AI model:', error);
    return 'Sorry, I encountered an error processing your request. Please ensure you have set up the OpenAI API key correctly.';
  }
} 