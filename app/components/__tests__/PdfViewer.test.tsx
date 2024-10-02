// app/components/__tests__/PdfViewer.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PdfViewer from "../PdfViewer";
import '@testing-library/jest-dom'; 

// Mocking components and utilities
jest.mock("react-pdf-highlighter", () => ({
  PdfLoader: ({ children }) => <div data-testid="pdf-loader">{children({})}</div>,
  PdfHighlighter: ({ children }) => <div data-testid="pdf-highlighter">{children}</div>,
  Highlight: () => <div data-testid="highlight" />,
  AreaHighlight: () => <div data-testid="area-highlight" />,
  Tip: ({ onConfirm }) => (
    <button data-testid="confirm-highlight" onClick={() => onConfirm("Sample comment")}>Confirm</button>
  ),
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
}));

jest.mock("./Sidebar", () => ({
  Sidebar: () => <div data-testid="sidebar" />
}));

jest.mock("./Spinner", () => () => <div data-testid="spinner" />);

const mockSetHighlights = jest.fn();
const mockResetHash = jest.fn();
const mockScrollViewerTo = { current: jest.fn() };
const mockScrollToHighlightFromHash = jest.fn();

const defaultProps = {
  pdfUrl: "test-pdf-url",
  pdfName: "test-pdf",
  pdfId: "1",
  highlights: [],
  setHighlights: mockSetHighlights,
  highlightsKey: 1,
  pdfViewerRef: { current: null },
  resetHash: mockResetHash,
  scrollViewerTo: mockScrollViewerTo,
  scrollToHighlightFromHash: mockScrollToHighlightFromHash,
};

describe("PdfViewer Component", () => {
  
  test("renders 'Upload your PDF to start highlighting!' message when pdfUrl is null", () => {
    render(<PdfViewer {...defaultProps} pdfUrl={null} />);
    expect(screen.getByText("Upload your PDF to start highlighting!")).toBeInTheDocument();
  });

  test("shows a loading spinner while the PDF is loading", () => {
    render(<PdfViewer {...defaultProps} />);
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  test("renders the PdfHighlighter component when the PDF loads", async () => {
    render(<PdfViewer {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId("pdf-highlighter")).toBeInTheDocument();
    });
  });

  test("renders highlights correctly", () => {
    const propsWithHighlights = {
      ...defaultProps,
      highlights: [
        {
          id: "1",
          position: { top: 100, left: 100, width: 100, height: 100 },
          comment: { text: "Test Highlight" }
        }
      ],
    };
    render(<PdfViewer {...propsWithHighlights} />);
    expect(screen.getByTestId("highlight")).toBeInTheDocument();
  });

  test("adds a new highlight when a selection is confirmed", async () => {
    render(<PdfViewer {...defaultProps} />);
    
    const confirmButton = screen.getByTestId("confirm-highlight");
    
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockSetHighlights).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  test("updates existing highlights correctly", async () => {
    const propsWithHighlights = {
      ...defaultProps,
      highlights: [
        {
          id: "1",
          position: { top: 100, left: 100, width: 100, height: 100 },
          comment: { text: "Test Highlight" }
        }
      ],
    };

    render(<PdfViewer {...propsWithHighlights} />);

    // Simulate area highlight update (e.g., dragging to resize)
    const areaHighlight = screen.getByTestId("area-highlight");

    fireEvent.change(areaHighlight, { target: { value: { top: 120, left: 120 } } });

    await waitFor(() => {
      expect(mockSetHighlights).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  test("toggles sidebar open and closed", () => {
    render(<PdfViewer {...defaultProps} />);

    const sidebar = screen.getByTestId("sidebar");

    // Assume initial state is open
    expect(sidebar).toBeInTheDocument();

    // Simulate toggling the sidebar
    fireEvent.click(sidebar);
    expect(mockSetHighlights).toHaveBeenCalledWith(expect.any(Function));
  });

  test("handles PDF load errors", () => {
    render(<PdfViewer {...defaultProps} />);
    
    // Simulate an error
    const errorHandler = screen.getByTestId("pdf-loader");

    fireEvent.error(errorHandler);

    expect(screen.queryByTestId("pdf-highlighter")).not.toBeInTheDocument();
  });
});
