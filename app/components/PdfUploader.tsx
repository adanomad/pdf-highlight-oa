// app/components/PdfUploader.tsx
import React from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Upload } from "lucide-react";

interface PdfUploaderProps {
  onFileUpload: (files: File[]) => void;
  pdfUploaded: boolean;
}

const PdfUploader: React.FC<PdfUploaderProps> = ({
  onFileUpload,
  pdfUploaded,
}) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      onFileUpload(filesArray);
    }
  };

  return (
    <div className="text-center">
      <Input
        type="file"
        accept=".pdf"
        onChange={handleFileUpload}
        className="hidden"
        id="pdf-upload"
        multiple
      />
      <label htmlFor="pdf-upload">
        <Button as="span" className="w-full">
          <Upload className="w-4 h-4 mr-2" />
          {pdfUploaded ? "PDF Uploaded" : "Upload PDF"}
        </Button>
      </label>
    </div>
  );
};

export default PdfUploader;
