import { useState, useRef, useEffect } from 'react';
import { Message } from '../utils/types';

interface ChatInterfaceProps {
  pdfId: string | null;
  pdfUrl: string | null;
  userId?: string;
}

export default function ChatInterface({ pdfId, pdfUrl, userId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages when new ones are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !pdfUrl) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfUrl,
          pdfId,
          userId,
          message: userMessage.content,
          history: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      
      // Add AI response to chat
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
        createdAt: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error in chat:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        createdAt: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg shadow-sm bg-white">
      {/* Chat Header */}
      <div className="py-3 px-4 border-b bg-gray-100">
        <h3 className="text-lg font-medium text-gray-900">Chat with PDF</h3>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto bg-white">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-900 flex-col">
            <p className="mb-2 font-medium">Ask a question about this PDF</p>
            <p className="text-sm text-gray-700">Examples:</p>
            <ul className="text-sm text-gray-700 list-disc pl-5 mt-1">
              <li>What is the main topic of this document?</li>
              <li>Can you summarize this PDF?</li>
              <li>What conclusions are drawn in this text?</li>
            </ul>
            <div className="mt-3 p-3 bg-yellow-50 text-yellow-800 rounded-md text-xs">
              <p className="font-bold">Note:</p>
              <p>For demo purposes, the AI will generate responses without actually reading the PDF content.</p>
              <p>In a production environment, real PDF text extraction would be implemented.</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={message.id || index}
              className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
            >
              <div 
                className={`inline-block px-4 py-2 rounded-lg max-w-[90%] ${
                  message.role === 'user' 
                    ? 'bg-blue-500 chat-message-user rounded-br-none' 
                    : 'bg-gray-100 chat-message-assistant rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {message.createdAt && new Date(message.createdAt).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question here..."
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:border-blue-400"
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`px-4 py-2 rounded-lg font-medium ${
              isLoading || !input.trim() 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
} 