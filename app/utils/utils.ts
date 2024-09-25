// app/utils/utils.ts
import { IHighlight } from "react-pdf-highlighter";
import { StoredHighlight } from "./types";

export const IHighlightToStoredHighlight = (
  highlight: IHighlight,
  pdfId: string,
): StoredHighlight => {
  return {
    id: highlight.id,
    pdfId,
    pageNumber: highlight.position.pageNumber,
    x1: highlight.position.boundingRect.x1,
    y1: highlight.position.boundingRect.y1,
    x2: highlight.position.boundingRect.x2,
    y2: highlight.position.boundingRect.y2,
    width: highlight.position.boundingRect.width,
    height: highlight.position.boundingRect.height,
    text: highlight.comment.text,
    image: highlight.content.image,
    keyword: highlight.content.text,
  };
};

export const StoredHighlightToIHighlight = (
  storedHighlight: StoredHighlight,
): IHighlight => {
  return {
    content: {
      text: storedHighlight.keyword,
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
      emoji: "🔍",
    },
    id: storedHighlight.id,
  };
};
