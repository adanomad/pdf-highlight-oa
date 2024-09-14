// app/components/Sidebar.tsx
import {
  AreaHighlight,
  Highlight,
  PdfHighlighter,
  PdfLoader,
  Popup,
  Tip,
  IHighlight, // Importing IHighlight type
} from "react-pdf-highlighter";

interface SidebarProps {
  highlights: Array<IHighlight>;
  resetHighlights: () => void;
  toggleDocument: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  highlights,
  toggleDocument,
}) => {
  return (
    <div className="Sidebar">
      <button onClick={toggleDocument}>Toggle Document</button>
      <ul>
        {highlights.map((highlight) => (
          <li key={highlight.id}>
            <div
              onClick={() => {
                /* scroll to highlight logic */
              }}
            >
              {highlight.comment.text}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
