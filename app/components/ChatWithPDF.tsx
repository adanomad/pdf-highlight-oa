// components/ChatWithWtfPDF.tsx
"use client";

import React, { useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

interface ChatWithWtfPDFProps {
  extractedMessage?: string;
}

const ChatWithWtfPDF: React.FC<ChatWithWtfPDFProps> = ({ extractedMessage }) => {
  const [query, setQuery] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSend = async () => {
    if (!query.trim()) return;
    setLoading(true);

    const userMessage: ChatMessage = { role: "user", text: query };
    setChatHistory((prev) => [...prev, userMessage]);

    try {
      const payload = {
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: extractedMessage
              ? extractedMessage
              : "You are a helpful assistant.",
          },
          { role: "user", content: query },
        ],
        temperature: 0.7,
      };

      const res = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await res.json();

      const botMessage: ChatMessage = {
        role: "assistant",
        text: data.response || "No response found",
      };
      setChatHistory((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        text: "There was an error processing your request.",
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    }

    setQuery("");
    setLoading(false);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg max-w-xl mx-auto flex flex-col h-[80vh] p-4">
      <h2 className="text-xl font-bold mb-4 text-center">Chat with Groq Bot</h2>

      {/* Chat history container with scroll */}
      <div className="flex-1 border border-gray-300 p-2 overflow-y-auto mb-4 rounded">
        {chatHistory.map((msg, index) => (
          <div key={index} className="mb-2">
            <strong>{msg.role === "user" ? "You:" : "Bot:"}</strong> {msg.text}
          </div>
        ))}
      </div>

      {/* Input row */}
      <div className="flex">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your message..."
          className="flex-1 mr-2 p-2 border border-gray-300 rounded"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default ChatWithWtfPDF;
