// app/components/__tests__/HighlightUploader.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import HighlightUploader from "../HighlightUploader";
import { IHighlight } from "react-pdf-highlighter";

// Mock data: This is a sample list of highlights used to test the component's functionality.
const mockHighlights: IHighlight[] = [
  {
    id: "1",
    content: { text: "Sample highlight text", image: null },
    position: { pageNumber: 1, boundingRect: {}, rects: [], usePdfCoordinates: true },
  },
  {
    id: "2",
    content: { text: "Another highlight", image: null },
    position: { pageNumber: 2, boundingRect: {}, rects: [], usePdfCoordinates: true },
  },
];

describe("HighlightUploader Component", () => {
  let onFileUpload: jest.Mock; // Mock function to simulate the file upload handler.
  let pdfId: string; // Mock PDF ID.

  // Runs before each test case to initialize the mock function and PDF ID.
  beforeEach(() => {
    onFileUpload = jest.fn();
    pdfId = "12345";
  });

  // Test case 1: Ensure the "Upload highlights" button is rendered.
  test("renders upload highlights button", () => {
    // Render the component with mock data.
    render(<HighlightUploader onFileUpload={onFileUpload} highlights={mockHighlights} pdfId={pdfId} />);

    // Check if the upload button is displayed with the correct text.
    const uploadButton = screen.getByText(/upload highlights/i);
    expect(uploadButton).toBeInTheDocument(); // Ensure the button is in the DOM.
  });

  // Test case 2: Ensure the "Download highlights" button is rendered.
  test("renders download highlights button", () => {
    // Render the component with mock data.
    render(<HighlightUploader onFileUpload={onFileUpload} highlights={mockHighlights} pdfId={pdfId} />);

    // Check if the download button is displayed with the correct text.
    const downloadButton = screen.getByText(/download highlights/i);
    expect(downloadButton).toBeInTheDocument(); // Ensure the button is in the DOM.
  });

  // Test case 3: Simulate file upload and ensure the file is passed to the handler function.
  test("calls onFileUpload when a file is selected", () => {
    // Render the component with mock data.
    render(<HighlightUploader onFileUpload={onFileUpload} highlights={mockHighlights} pdfId={pdfId} />);

    // Find the hidden file input element.
    const input = screen.getByLabelText(/upload highlights/i) as HTMLInputElement;
    
    // Create a mock file to simulate the file selection.
    const file = new File(["dummy content"], "highlights.json", { type: "application/json" });
    
    // Trigger the file input change event with the mock file.
    fireEvent.change(input, { target: { files: [file] } });

    // Verify that the mock file is passed to the onFileUpload handler.
    expect(onFileUpload).toHaveBeenCalledWith(file);
  });

  // Test case 4: Ensure the onFileUpload function is not called if no file is selected.
  test("does not call onFileUpload if no file is selected", () => {
    // Render the component with mock data.
    render(<HighlightUploader onFileUpload={onFileUpload} highlights={mockHighlights} pdfId={pdfId} />);

    // Find the hidden file input element.
    const input = screen.getByLabelText(/upload highlights/i) as HTMLInputElement;
    
    // Trigger the file input change event without selecting any file.
    fireEvent.change(input, { target: { files: [] } });

    // Verify that the onFileUpload handler is not called if no file is selected.
    expect(onFileUpload).not.toHaveBeenCalled();
  });

  // Test case 5: Ensure the highlights can be downloaded as a JSON file with correct data.
  test("downloads highlights as JSON", () => {
    // Render the component with mock data.
    render(<HighlightUploader onFileUpload={onFileUpload} highlights={mockHighlights} pdfId={pdfId} />);

    // Find the download link that allows the user to download highlights as JSON.
    const downloadLink = screen.getByText(/download highlights/i).closest("a");

    // Check that the download link has the correct 'download' attribute for the JSON file.
    expect(downloadLink).toHaveAttribute("download", "highlights.json");

    // Generate the expected JSON content to be downloaded.
    const expectedData = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(mockHighlights.map((highlight) => ({
        id: highlight.id,
        content: highlight.content,
        position: highlight.position,
        pdfId, // Add pdfId to the JSON structure.
      })))
    )}`;
    
    // Verify that the href attribute contains the correct JSON data.
    expect(downloadLink).toHaveAttribute("href", expectedData);
  });
});
