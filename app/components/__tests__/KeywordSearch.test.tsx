// app/components/__tests__/KeywordSearch.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import KeywordSearch from "../KeywordSearch";

describe("KeywordSearch Component", () => {
  // Variables for mocking state and handlers
  let searchTerm: string; // Represents the search term input by the user.
  let setSearchTerm: jest.Mock; // Mock function to update the search term.
  let handleSearch: jest.Mock; // Mock function to handle the search action.
  let resetHighlights: jest.Mock; // Mock function to reset highlights.

  // Initialize the mock functions and render the component before each test.
  beforeEach(() => {
    searchTerm = ""; // Initially, the search term is empty.
    setSearchTerm = jest.fn((term: string) => {
      searchTerm = term; // Updates the search term when called.
    });
    handleSearch = jest.fn(); // Initializes the mock function for search.
    resetHighlights = jest.fn(); // Initializes the mock function for resetting highlights.

    // Render the KeywordSearch component with the above props.
    render(
      <KeywordSearch
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleSearch={handleSearch}
        resetHighlights={resetHighlights}
      />
    );
  });

  // Test case 1: Ensure the input field and buttons are rendered.
  test("renders input and buttons", () => {
    // Check if the input field is rendered with the correct placeholder text.
    expect(screen.getByPlaceholderText("Enter keyword to highlight")).toBeInTheDocument();

    // Check if the "Highlight" button is rendered.
    expect(screen.getByRole("button", { name: /highlight/i })).toBeInTheDocument();

    // Check if the "Clear Highlights" button is rendered.
    expect(screen.getByRole("button", { name: /clear highlights/i })).toBeInTheDocument();
  });

  // Test case 2: Ensure the search term updates when the input changes.
  test("updates search term on input change", () => {
    // Find the input element by its placeholder text.
    const input = screen.getByPlaceholderText("Enter keyword to highlight");

    // Simulate changing the input value to "test keyword".
    fireEvent.change(input, { target: { value: "test keyword" } });

    // Verify that the setSearchTerm function was called with the correct value.
    expect(setSearchTerm).toHaveBeenCalledWith("test keyword");
  });

  // Test case 3: Ensure the handleSearch function is called when the "Highlight" button is clicked.
  test("calls handleSearch on highlight button click", () => {
    // Find the "Highlight" button by its role and name.
    const highlightButton = screen.getByRole("button", { name: /highlight/i });

    // Simulate clicking the "Highlight" button.
    fireEvent.click(highlightButton);

    // Verify that the handleSearch function was called when the button was clicked.
    expect(handleSearch).toHaveBeenCalled();
  });

  // Test case 4: Ensure the resetHighlights function is called when the "Clear Highlights" button is clicked.
  test("calls resetHighlights on clear button click", () => {
    // Find the "Clear Highlights" button by its role and name.
    const clearButton = screen.getByRole("button", { name: /clear highlights/i });

    // Simulate clicking the "Clear Highlights" button.
    fireEvent.click(clearButton);

    // Verify that the resetHighlights function was called when the button was clicked.
    expect(resetHighlights).toHaveBeenCalled();
  });
});
