// app/components/__tests__/Sidebar.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Sidebar } from "../Sidebar";
import { IHighlight } from "react-pdf-highlighter";

describe("Sidebar Component", () => {
  // Sample data for highlights (each highlight contains text and its position on a page)
  let highlights: IHighlight[];
  let setHighlights: jest.Mock; // Mock function to set highlights
  let resetHighlights: jest.Mock; // Mock function to reset highlights
  let toggleDocument: jest.Mock; // Mock function to toggle the PDF document
  let toggleSidebar: jest.Mock; // Mock function to toggle the sidebar's visibility
  let scrollViewerTo: React.MutableRefObject<(highlight: IHighlight) => void>; // Reference to function for scrolling to a highlight
  let sidebarIsOpen: boolean; // Indicates whether the sidebar is open
  let pdfName: string; // Name of the currently loaded PDF
  let pdfId: string; // Unique ID of the currently loaded PDF

  // Initialize mock data and functions before each test
  beforeEach(() => {
    highlights = [
      {
        id: "1",
        content: { text: "Highlight 1 text", image: "" },
        position: { pageNumber: 1 },
      },
      {
        id: "2",
        content: { text: "Highlight 2 text", image: "" },
        position: { pageNumber: 2 },
      },
    ];
    setHighlights = jest.fn();
    resetHighlights = jest.fn();
    toggleDocument = jest.fn();
    toggleSidebar = jest.fn();
    scrollViewerTo = {
      current: jest.fn(),
    };
    sidebarIsOpen = true; // Sidebar starts as open
    pdfName = "Test PDF"; // Test PDF name
    pdfId = "test-pdf-id"; // Test PDF ID

    // Render the Sidebar component with the provided props
    render(
      <Sidebar
        highlights={highlights}
        setHighlights={setHighlights}
        resetHighlights={resetHighlights}
        toggleDocument={toggleDocument}
        toggleSidebar={toggleSidebar}
        sidebarIsOpen={sidebarIsOpen}
        pdfName={pdfName}
        pdfId={pdfId}
        scrollViewerTo={scrollViewerTo}
      />
    );
  });

  // Test case 1: Verify that the sidebar renders correctly when open
  test("renders the sidebar when open", () => {
    // Check that the PDF name and highlights are displayed in the sidebar
    expect(screen.getByText(pdfName)).toBeInTheDocument();
    expect(screen.getByText("Highlight 1 text")).toBeInTheDocument();
    expect(screen.getByText("Highlight 2 text")).toBeInTheDocument();
  });

  // Test case 2: Verify that clicking the close button calls the toggleSidebar function
  test("calls toggleSidebar when close button is clicked", () => {
    // Simulate clicking the close button and verify toggleSidebar is called
    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);
    expect(toggleSidebar).toHaveBeenCalled();
  });

  // Test case 3: Verify that clicking a highlight calls the scrollViewerTo function
  test("calls scrollViewerTo when a highlight is clicked", () => {
    // Simulate clicking on a highlight and verify the scrollViewerTo function is called with the correct highlight
    const highlightItem = screen.getByText("Highlight 1 text");
    fireEvent.click(highlightItem);
    expect(scrollViewerTo.current).toHaveBeenCalledWith(highlights[0]);
  });

  // Test case 4: Verify that clicking the delete button removes the highlight
  test("removes a highlight when delete button is clicked", () => {
    // Simulate clicking the delete button for the first highlight
    const deleteButton = screen.getAllByRole("button", { name: /clear/i })[0];
    fireEvent.click(deleteButton);

    // Verify setHighlights is called with the remaining highlight
    expect(setHighlights).toHaveBeenCalledWith([highlights[1]]);
  });

  // Test case 5: Verify that the sidebar renders as closed and opens when the open button is clicked
  test("renders the sidebar closed and opens when open button is clicked", () => {
    // Render the sidebar with sidebarIsOpen set to false (closed)
    sidebarIsOpen = false;
    render(
      <Sidebar
        highlights={highlights}
        setHighlights={setHighlights}
        resetHighlights={resetHighlights}
        toggleDocument={toggleDocument}
        toggleSidebar={toggleSidebar}
        sidebarIsOpen={sidebarIsOpen}
        pdfName={pdfName}
        pdfId={pdfId}
        scrollViewerTo={scrollViewerTo}
      />
    );

    // Verify that no highlights are displayed when the sidebar is closed
    expect(screen.queryByText("Highlight 1 text")).not.toBeInTheDocument();

    // Simulate clicking the open button and verify toggleSidebar is called
    const openButton = screen.getByRole("button", { name: /open/i });
    fireEvent.click(openButton);
    expect(toggleSidebar).toHaveBeenCalled();
  });
});
