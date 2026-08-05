// app/utils/utils.ts
import { IHighlight } from "react-pdf-highlighter";
import { StoredHighlight } from "./types";

const getNextId = () => String(Math.random()).slice(2);

export const StoredHighlightToIHighlight = (
  storedHighlight: StoredHighlight,
): IHighlight => {
  return {
    content: {
      text: storedHighlight.text,
      image: storedHighlight.image,
    },
    position: {
      boundingRect: {
        x1: storedHighlight.x1,
        y1: storedHighlight.y1,
        x2: storedHighlight.x2,
        y2: storedHighlight.y2,
        width: storedHighlight.width,
        height: storedHighlight.height,
        pageNumber: storedHighlight.pageNumber,
      },
      rects: [
        {
          x1: storedHighlight.x1,
          y1: storedHighlight.y1,
          x2: storedHighlight.x2,
          y2: storedHighlight.y2,
          width: storedHighlight.width,
          height: storedHighlight.height,
          pageNumber: storedHighlight.pageNumber,
        },
      ],
      pageNumber: storedHighlight.pageNumber,
    },
    comment: {
      text: storedHighlight.text,
      emoji: "",
    },
    id: getNextId(),
  };
};
