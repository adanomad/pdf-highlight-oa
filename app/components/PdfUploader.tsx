import React from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Upload } from "lucide-react";
import { supabase } from '../utils/supabase'; //Import Supabase client

interface PdfUploaderProps {
  onFileUpload: (file: File) => void;
  pdfUploaded: boolean;
}

const PdfUploader: React.FC<PdfUploaderProps> = ({
  onFileUpload,
  pdfUploaded,
}) => {
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      console.log('Selected file:', file); //Log selected file for confirmation
      
      try {
        //Upload the PDF to Supabase storage
        const { data, error } = await supabase.storage
          .from('pdf-bucket')  
          .upload(`documents/${file.name}`, file);

        if (error) throw new Error(`Failed to upload PDF: ${error.message}`);

        console.log('PDF uploaded successfully:', data);
        onFileUpload(file);  
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error('Error uploading the PDF:', err.message);
        } else {
          console.error('Unknown error occurred during PDF upload');
        }
      }
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
