// app/components/__tests__/HighlightPopup.test.tsx
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import HighlightPopup from '../HighlightPopup';

describe('HighlightPopup Component', () => {
  // Test case 1: Renders the popup with both text and emoji when valid text is provided
  it('renders the popup with text and emoji when text is provided', () => {
    // Mock comment containing text and an emoji
    const comment = { text: 'This is a highlight!', emoji: '✨' };
    // Render the HighlightPopup component with the comment prop
    const { getByText } = render(<HighlightPopup comment={comment} />);
    
    // Check if the popup displays both the text and the emoji together
    expect(getByText('✨ This is a highlight!')).toBeInTheDocument();
  });

  // Test case 2: Does not render the popup when the provided text is empty
  it('does not render the popup when text is empty', () => {
    // Mock comment with an empty text string and an emoji
    const comment = { text: '', emoji: '✨' };
    // Render the HighlightPopup component
    const { container } = render(<HighlightPopup comment={comment} />);
    
    // Verify that nothing is rendered if the text is empty (first child is null)
    expect(container.firstChild).toBeNull();
  });

  // Test case 3: Renders only the emoji when the text is a space or not provided
  it('renders only the emoji when text is not provided', () => {
    // Mock comment with an empty space for text and an emoji
    const comment = { text: ' ', emoji: '✨' };
    // Render the HighlightPopup component
    const { getByText } = render(<HighlightPopup comment={comment} />);
    
    // Check if only the emoji is rendered without any text
    expect(getByText('✨')).toBeInTheDocument();
  });
});
