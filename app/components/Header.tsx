// app/components/Header.tsx
import Link from "next/link";
import { useSession } from "next-auth/react";

interface HeaderProps {
  pdfName: string | null;
  showChat: boolean;
  setShowChat: (show: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ pdfName, showChat, setShowChat }) => {
  // const session = useSession();
  return (
    <header className="bg-white shadow-sm py-4 px-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-800">PDF Highlighter</h1>
          {pdfName && (
            <span className="text-sm text-gray-600 truncate max-w-md">
              {pdfName}
            </span>
          )}
        </div>
        
        {pdfName && (
          <button
            onClick={() => setShowChat(!showChat)}
            className={`px-4 py-2 rounded-md font-medium text-sm ${
              showChat 
                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {showChat ? 'Hide Chat' : 'Chat with PDF'}
          </button>
        )}
      </div>
    </header>
  );
};
