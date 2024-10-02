// app/components/__tests__/PdfUploader.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PdfUploader from "../PdfUploader";

describe("PdfUploader Component", () => {
  // Mock function for handling file upload
  let onFileUpload: jest.Mock;
  let pdfUploaded: boolean; // Flag to indicate whether a PDF has been uploaded or not.

  // Before each test, initialize the mock function and set pdfUploaded to false.
  beforeEach(() => {
    onFileUpload = jest.fn();
    pdfUploaded = false; // Initially, no PDF is uploaded.
  });

  // Test case 1: Ensure that the upload button is rendered with the correct label when no PDF is uploaded.
  test("renders upload button when PDF is not uploaded", () => {
    // Render the component with the PDF not uploaded.
    render(<PdfUploader onFileUpload={onFileUpload} pdfUploaded={pdfUploaded} />);

    // Verify that the button displays "Upload PDF" since no PDF has been uploaded.
    const button = screen.getByText(/upload pdf/i);
    expect(button).toBeInTheDocument();
  });

  // Test case 2: Ensure that the button label changes to "PDF Uploaded" when a PDF is uploaded.
  test("renders PDF uploaded button when PDF is uploaded", () => {
    // Simulate the PDF being uploaded by setting pdfUploaded to true.
    pdfUploaded = true;
    render(<PdfUploader onFileUpload={onFileUpload} pdfUploaded={pdfUploaded} />);

    // Verify that the button displays "PDF Uploaded".
    const button = screen.getByText(/pdf uploaded/i);
    expect(button).toBeInTheDocument();
  });

  // Test case 3: Ensure that the onFileUpload function is called with the selected file when a file is uploaded.
  test("calls onFileUpload when a file is selected", () => {
    // Render the component.
    render(<PdfUploader onFileUpload={onFileUpload} pdfUploaded={pdfUploaded} />);

    // Find the file input element by its label and create a mock file.
    const input = screen.getByLabelText(/upload pdf/i) as HTMLInputElement;
    const file = new File(["dummy content"], "example.pdf", { type: "application/pdf" });
    
    // Simulate selecting a file by triggering a change event.
    fireEvent.change(input, { target: { files: [file] } });

    // Verify that the onFileUpload function is called with the correct file.
    expect(onFileUpload).toHaveBeenCalledWith(file);
  });

  // Test case 4: Ensure that the onFileUpload function is not called if no file is selected (empty file list).
  test("does not call onFileUpload if no file is selected", () => {
    // Render the component.
    render(<PdfUploader onFileUpload={onFileUpload} pdfUploaded={pdfUploaded} />);

    // Find the file input element and simulate an event with no file selected.
    const input = screen.getByLabelText(/upload pdf/i) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });

    // Verify that the onFileUpload function was not called.
    expect(onFileUpload).not.toHaveBeenCalled();
  });

  // Test case 5: Ensure that the file input is hidden from view but still accessible programmatically.
  test("file input is hidden but accessible", () => {
    // Render the component.
    render(<PdfUploader onFileUpload={onFileUpload} pdfUploaded={pdfUploaded} />);

    // Check if the file input element has the "hidden" class, meaning it is visually hidden.
    const input = screen.getByLabelText(/upload pdf/i) as HTMLInputElement;
    expect(input).toHaveClass("hidden");
  });
});
