// app/components/DocumentSidebar.tsx
import React, { useState, useEffect } from "react";


// Created two interfaces, one for a specific document, one for all props
interface Document {
    id: string;
    name: string;
}

interface DocumentSidebarProps {
    documents: Document[];
    onDocumentSelect: (id: string) => void;
    selectedDocumentId: string | null;
    onDeleteDocument: (id: string) => Promise<void>;
}



/**
 * Component representing a sidebar for displaying and selecting documents.
 *
 * @component
 * @param {DocumentSidebarProps} props - The props for the DocumentSidebar component.
 * @param {Document[]} props.documents - The list of documents to display.
 * @param {function} props.onDocumentSelect - Function to handle document selection.
 * @param {string} props.selectedDocumentId - The ID of the currently selected document.
 * @param {function} props.onDeleteDocument - Function to delete a document.
 */
const DocumentSidebar: React.FC<DocumentSidebarProps> = ({
    documents,
    onDocumentSelect,
    selectedDocumentId,
    onDeleteDocument,
  }) => {

    const [searchText, setSearchText] = useState('');
    const [filteredDocuments, setFilteredDocuments] = useState<Document[]>(documents);

    useEffect(() => {
      const filtered = documents.filter((doc) => 
        doc.name.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())
      );
      setFilteredDocuments(filtered);
    }, [searchText, documents]);

    return (
      <div className="w-75 h-screen bg-white border-l border-gray-300 p-4">
        <h2 className="text-lg font-bold mb-4">Saved Documents</h2>

        {/* Search bar */}
        <input 
          type = "text"
          placeholder = "Search documents..."
          value = {searchText}
          onChange = {(e) => setSearchText(e.target.value)}
          className = "w-full p-2 mb-4 border border-gray-300 rounded"
        />

      {/* Document list */}
      <ul>
        {filteredDocuments.map((doc) => (
          <li
            key={doc.id}
            className={`relative p-2 rounded-md mb-2 overflow-hidden whitespace-nowrap text-ellipsis cursor-pointer ${
              doc.id === selectedDocumentId ? "bg-blue-100" : "bg-gray-100"
            }`}
            onClick={() => onDocumentSelect(doc.id)} // Make the entire li clickable for document selection
          >
            {/* Wrapper div for document name */}
            <div className="inline-block max-w-[85%] overflow-hidden text-ellipsis">
              {doc.name}
            </div>

            {/* Delete button */}
            <button
              className="absolute right-2 text-red-500"
              onClick={(e) => {
                e.stopPropagation(); // Prevent event from bubbling up to the li's onClick
                onDeleteDocument(doc.id);
              }}
              title="Delete"
            >
              🗑️
            </button>
          </li>
        ))}
      </ul>


    </div>
  );
};

export default DocumentSidebar;