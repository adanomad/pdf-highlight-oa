import React from "react";

type PdfUploaderProps = {
  onFileUpload: (file: File) => void;
  pdfUploaded: boolean;
};

export default function PdfUploader({ onFileUpload, pdfUploaded }: PdfUploaderProps) {
  const inputId = "pdf-upload";

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    files.forEach(onFileUpload);
    // allow selecting the same file again later
    event.target.value = "";
  };

  return (
    <div className="border rounded p-3 bg-white">
      <div className="font-semibold mb-2">Upload PDF{pdfUploaded ? "s" : ""}</div>
      <div className="flex items-center gap-2">
        <label
          htmlFor={inputId}
          className="cursor-pointer inline-flex items-center justify-center border rounded px-3 py-2 hover:bg-gray-50"
        >
          Choose PDF{`(s)`}
        </label>
        <input
          id={inputId}
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
      <p className="text-sm mt-2">You can select multiple PDFs at once or click again to add more.</p>
    </div>
  );
}
