// app/components/ChatSidebar.tsx
import type React from "react"
import { useState, useRef, useEffect } from "react"
import { MessageSquare, Send, History } from "lucide-react"
import { Button } from "./Button"
import { extractPdfText } from "../utils/pdfUtils";
import type { Conversation, Message } from "../utils/conversationUtils";

type ChatSidebarProps = {
  pdfUploaded: boolean;
  pdfUrl: string | null;
  isOpen: boolean;
  pdfId: string | null;
  pdfName: string | null;
  onLoadConversation: (conversationPdfId: string) => Promise<boolean>;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  pdfUploaded, 
  pdfUrl, 
  isOpen,
  pdfId,
  pdfName,
  onLoadConversation
}) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [showHistory, setShowHistory] = useState(false)
  const [currentPdfId, setCurrentPdfId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)

  // Fetch conversations when sidebar opens or when PDF is uploaded
  useEffect(() => {
    if (isOpen || pdfUploaded) {
      fetchConversations();
    }
  }, [isOpen, pdfUploaded]);

  // Create new conversation when PDF is uploaded
  useEffect(() => {
    if (pdfUploaded && pdfId && pdfName && conversationsLoaded) {
      // Check if a conversation already exists for this PDF
      const existingConversation = conversations.find(conv => conv.pdfId === pdfId);
      if (!existingConversation) {
        createNewConversation();
      } else {
        // If conversation exists, set it as current
        setCurrentConversationId(existingConversation.id);
        setCurrentPdfId(pdfId);
        // Load the messages for this conversation
        loadConversation(existingConversation.id);
      }
    }
  }, [pdfUploaded, pdfId, pdfName, conversations]);

  // Update currentPdfId when pdfId changes
  useEffect(() => {
    if (pdfId) {
      setCurrentPdfId(pdfId);
    }
  }, [pdfId]);

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/conversation");
      if (response.ok) {
        const data = await response.json();
        console.log("Fetching conversations");
        setConversations(data);
        setConversationsLoaded(true);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const createNewConversation = async () => {
    if (!pdfId || !pdfName) return;
    
    try {
      const response = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfId, pdfName }),
      });
      
      if (response.ok) {
        const conversation = await response.json();
        console.log("Creating new conversation");
        setCurrentConversationId(conversation.id);
        setCurrentPdfId(pdfId);
        setMessages([]);
        // Refresh conversations list
        fetchConversations();
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversation/${conversationId}`);
      if (response.ok) {
        const { conversation, messages } = await response.json();
        setCurrentConversationId(conversation.id);
        setMessages(messages);
        setShowHistory(false);

        // Load the corresponding PDF
        const pdfLoaded = await onLoadConversation(conversation.pdfId);
        if (pdfLoaded) {
          setCurrentPdfId(conversation.pdfId);
        } else {
          // If PDF is not available, show an error message
          const errorMessage: Message = {
            id: crypto.randomUUID(),
            conversationId: conversation.id,
            role: "assistant",
            content: "Error: The PDF file for this conversation is no longer available.",
            createdAt: new Date().toISOString()
          };
          setMessages([...messages, errorMessage]);
          await fetch(`/api/conversation/${conversationId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(errorMessage),
          });
        }
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return;
    if (!pdfUrl || !currentConversationId || !currentPdfId) {
      setMessages([
        ...messages,
        { id: crypto.randomUUID(), conversationId: currentConversationId!, role: "assistant", content: "Error: No PDF uploaded.", createdAt: new Date().toISOString() },
      ]);
      return;
    }
  
    // Add user message to chat
    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversationId: currentConversationId,
      role: "user",
      content: inputMessage,
      createdAt: new Date().toISOString()
    };
    
    setMessages([...messages, userMessage]);
    setInputMessage("");
    setIsLoading(true);
  
    try {
      // Save user message to database
      await fetch(`/api/conversation/${currentConversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userMessage),
      });

      // Extract text from the PDF
      const pdfText = await extractPdfText(pdfUrl);

      // Converts the array of conversation history to a string for the AI to be able to read it
      const conversationHistory = messages
        .map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n");

        const fullQuery = `You are an AI assistant helping with PDF analysis. 
        Here is the conversation so far:\n\n${conversationHistory}
        \n\nNow answer this question: "${inputMessage}" based on the following PDF text:\n${pdfText}.
        When providing an answer, cite the specific passage from the PDF that supports your response. 
        Return the citation in the format: "[Page X, Line Y-Z]" and include the exact passage. Keep your responses to less than 100 words when possible`;
        
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: fullQuery
        }),
      });
  
      const data = await response.json();
  
      if (data.text) {
        const aiMessage: Message = {
          id: crypto.randomUUID(),
          conversationId: currentConversationId,
          role: "assistant",
          content: "",
          createdAt: new Date().toISOString()
        };
        
        setMessages([...messages, userMessage, aiMessage]);
  
        // Gradually reveal AI response
        let index = 0;
        const typingInterval = setInterval(() => {
          aiMessage.content += data.text[index];
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages];
            updatedMessages[updatedMessages.length - 1] = aiMessage;
            return updatedMessages;
          });
          index++;
  
          if (index === data.text.length) {
            clearInterval(typingInterval);
            setIsLoading(false);
            // Save AI message to database
            fetch(`/api/conversation/${currentConversationId}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(aiMessage),
            });
          }
        }, 10);
      } else {
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          conversationId: currentConversationId,
          role: "assistant",
          content: "Sorry, I couldn't generate a response.",
          createdAt: new Date().toISOString()
        };
        setMessages([...messages, userMessage, errorMessage]);
        await fetch(`/api/conversation/${currentConversationId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(errorMessage),
        });
      }
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        conversationId: currentConversationId,
        role: "assistant",
        content: "Error communicating with the AI.",
        createdAt: new Date().toISOString()
      };
      setMessages([...messages, userMessage, errorMessage]);
      await fetch(`/api/conversation/${currentConversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(errorMessage),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll to the bottom of chat when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Add welcome message when PDF is uploaded
  useEffect(() => {
    if (pdfUploaded && messages.length === 0 && currentConversationId) {
      const welcomeMessage: Message = {
        id: crypto.randomUUID(),
        conversationId: currentConversationId,
        role: "assistant",
        content: "I've analyzed your PDF. Ask me any questions about its content!",
        createdAt: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
      fetch(`/api/conversation/${currentConversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(welcomeMessage),
      });
    }
  }, [pdfUploaded, messages.length, currentConversationId]);

  if (!isOpen) return null;

  return (
    <div className="bg-white border-l border-gray-200 w-80 flex flex-col h-[100vh] shadow-lg">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MessageSquare className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="font-medium">Chat with PDF</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHistory(!showHistory)}
            className="h-8 w-8"
          >
            <History className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showHistory ? (
        <div className="flex-grow p-4 overflow-y-auto">
          <h4 className="font-medium mb-4">Conversation History</h4>
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => loadConversation(conversation.id)}
                className={`w-full text-left p-2 rounded-lg hover:bg-gray-100 ${
                  currentConversationId === conversation.id ? "bg-blue-50" : ""
                }`}
              >
                <div className="font-medium truncate">{conversation.pdfName}</div>
                <div className="text-sm text-gray-500">
                  {new Date(conversation.updatedAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-grow p-4 overflow-y-auto">
          {pdfUploaded ? (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-gray-100">
                    <div className="flex space-x-2">
                      <div
                        className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="text-center text-gray-500">
              Upload a PDF to start chatting
            </div>
          )}
        </div>
      )}

      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            ref={chatInputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!pdfUploaded}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!pdfUploaded || isLoading}
            className="h-10 w-10"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};