// app/components/HighlightPopup.tsx
import React from "react";

interface HighlightPopupProps {
  comment: { text: string; emoji: string };
}

const HighlightPopup: React.FC<HighlightPopupProps> = ({ comment }) =>
  comment.text ? (
    <div className="Highlight__popup">
      {comment.emoji} {comment.text}
    </div>
  ) : null;

export default HighlightPopup;
