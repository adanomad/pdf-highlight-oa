// app/components/HighlightUploader.tsx
import React from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Download, Upload } from "lucide-react";
import { IHighlight } from "react-pdf-highlighter";
import { IHighlightToStoredHighlight } from "../utils/utils";

interface HighlightUploader {
  onFileUpload: (file: File) => void;
  highlights: IHighlight[];
  pdfId: string;
}

const HighlightUploader: React.FC<HighlightUploader> = ({
  onFileUpload,
  highlights,
  pdfId,
}) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onFileUpload(event.target.files[0]);
    }
  };

  return (
    <div className="flex flex-row gap-4">
      <div className="w-full text-center inline-flex items-center justify-center rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 text-white">
        <div className="w-full">
          <Input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
            id="highlight-upload"
          />
          <label htmlFor="highlight-upload">
            <Button as="span" className="w-full hover:bg-blue-600">
              <Upload className="w-4 h-4 mr-2" />
              {"Upload highlights"}
            </Button>
          </label>
        </div>
      </div>
      <div className="text-center inline-flex items-center justify-center rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 w-full bg-blue-500 text-white hover:bg-blue-600">
        <a
          className="w-full"
          type="button"
          href={`data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(
              highlights.map((highlight: IHighlight) =>
                IHighlightToStoredHighlight(highlight, pdfId)
              )
            )
          )}`}
          download="highlights.json"
        >
          <div className="flex flex-row p-1.5 items-center justify-center text-sm">
            <Download className="w-4 h-4 mr-2" />
            {"Download highlights"}
          </div>
        </a>
      </div>
    </div>
  );
};

export default HighlightUploader;
