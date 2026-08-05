// app/utils/pdfUtils.ts
import { IHighlight } from "react-pdf-highlighter";
import { StoredHighlight, StoredImage } from "./types";
import * as pdfjs from "pdfjs-dist";
import * as Tesseract from "tesseract.js";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

// Creating a searchable PDF:
// Convert uploaded PDF file to b64 image,
//   perform OCR,
//   convert output back to PDF
//   update file url with new PDF url
const TESSERACT_THRESHOLD = 60; //confidence threshold to use Tesseract OCR output
export const tesseractRead = async (i: StoredImage[], pdfId: string, pdfUrl: string) => {
    const numPages = i.length;
    let dataToEmbed: StoredHighlight[][] = new Array(numPages);
    const scheduler = Tesseract.createScheduler();

        // Creates worker and adds to scheduler
        const workerGen = async () => {
          const worker = await Tesseract.createWorker('eng');
          scheduler.addWorker(worker);
        }

        const workerN = 4;

        try {
          const resArr = Array(workerN);
          for (let j=0; j<workerN; j++) {
            resArr[j] = workerGen();
          }
          await Promise.all(resArr);
          // Add recognition jobs 
          await Promise.all(i.map((pageImg, index) => (
            scheduler.addJob(
              'recognize', 
              pageImg.image,
              { pdfTitle: "ocr-out" },
              { pdf: true }
            ).then((res) => {
              (async () => {
                const pdfOpened = await pdfjs.getDocument(pdfUrl).promise;
                const page = await pdfOpened.getPage(index + 1);
                const viewport = page.getViewport({ scale: 1 });

                // Create an adjusted viewport to flip the y-coordinate
                // FIXME: This might not be necessary or correct for all PDFs
                const adjustedViewport = {
                  ...viewport,
                  convertToViewportPoint: (x: number, y: number) => {
                    const [vx, vy] = viewport.convertToViewportPoint(x, y);
                    return [vx, viewport.height - vy];
                  },
                };

                const pdf = res.data.pdf;
                if (pdf) {

                  const linesToHighlights = (lines: Tesseract.Line[]) => {
                    return lines.map((line, j) => {
                      const x1 = line.bbox.x0;
                      const y1 = Math.min(line.bbox.y0, line.bbox.y1);
                      const x2 = line.bbox.x1;
                      const y2 = Math.max(line.bbox.y0, line.bbox.y1);
                      return processImage(
                        pdfId,
                        line.bbox.x0,
                        line.bbox.y1,
                        Math.abs(line.bbox.x0 - line.bbox.x1),
                        Math.abs(line.bbox.y0 - line.bbox.y1),
                        index + 1,
                        j + 1,
                        viewport,
                        line.text
                      )
                    })
                  }
                  
                  const rawData: any = res.data.confidence >= TESSERACT_THRESHOLD 
                    ? linesToHighlights(res.data.lines) 
                    : [];

                  dataToEmbed[index] = rawData;
                  console.log(dataToEmbed[index]);
                } 
              })()
            })
          )))
          await scheduler.terminate(); // It also terminates all workers.
          return dataToEmbed;
        } catch(err) {
          console.log("Error uploading file: " + err);
        }
        return [];
}

export const getLines = async (
  pdfId: string,
  pdfUrl: string,
  viewportZoom: number = 1,
): Promise<StoredHighlight[][]> => {

  try {
    // Load the PDF document
    const pdf = await pdfjs.getDocument(pdfUrl).promise;
    const numPages = pdf.numPages;
    const highlights: StoredHighlight[][] = new Array(numPages);
    let text: any[] = new Array(numPages);

    // Iterate through each page of the PDF
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: viewportZoom });

      // Create an adjusted viewport to flip the y-coordinate
      // FIXME: This might not be necessary or correct for all PDFs
      const adjustedViewport = {
        ...viewport,
        convertToViewportPoint: (x: number, y: number) => {
          const [vx, vy] = viewport.convertToViewportPoint(x, y);
          return [vx, viewport.height - vy];
        },
      };

      // Extract text content from the page
      const textContent = await page.getTextContent({includeMarkedContent: false});
      const textItems = textContent.items as any[];

      let lastY: number | null = null;
      let textLine = "";
      let lineItems: any[] = [];
      text[pageNum - 1] = [];
      highlights[pageNum - 1] = [];

      // Group text items into lines
      for (let j = 0; j < textItems.length; ++j) {
        const item = textItems[j];
        if (lastY !== item.transform[5] && lineItems.length > 0) {
          // Process the completed line
          highlights[pageNum - 1].push(processLine(
            pdfId,
            lineItems,
            textLine,
            //keywords,
            pageNum,
            j + 1,
            adjustedViewport,
          ));
          text[pageNum - 1].push(textLine);
          textLine = "";
          lineItems = [];
        }
        textLine += item.str;
        lineItems.push(item);
        lastY = item.transform[5];
      }

      // Process the last line if it exists
      if (lineItems.length > 0) {
        highlights[pageNum - 1].push(processLine(
          pdfId,
          lineItems,
          textLine,
          pageNum,
          textItems.length,
          adjustedViewport,
        ));
        text[pageNum - 1].push(textLine);
      } 
    }
    return highlights;
  } catch (error) {
    console.error("Error searching PDF:", error);
  }
  return [];

};

export const getImagesIndividual = async (
  pdfId: string,
  pdfUrl: string,
  viewportZoom: number = 1,
): Promise<StoredHighlight[][]> => {

  try {
    // Load the PDF document
    const pdf = await pdfjs.getDocument(pdfUrl).promise;
    const numPages = pdf.numPages;
    const highlights: StoredHighlight[][] = new Array(numPages);

    // Iterate through each page of the PDF
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          highlights[pageNum - 1] = [];
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: /*viewportZoom*/ 1 });

          // Create an adjusted viewport to flip the y-coordinate
          // FIXME: This might not be necessary or correct for all PDFs
          const adjustedViewport = {
            ...viewport,
            convertToViewportPoint: (x: number, y: number) => {
              const [vx, vy] = viewport.convertToViewportPoint(x, y);
              return [vx, viewport.height - vy];
            },
          };

          // Extract images as XObjects
          const operatorList = await page.getOperatorList();
          const resources = page.objs;
          let currentTransform = [1, 0, 0, 1, 0, 0];
          let lineNumber = -1;
          for (let i = 0; i < operatorList.fnArray.length; ++i) {
            if (operatorList.fnArray[i] === pdfjs.OPS.transform) {
              // Update the current transformation matrix
              currentTransform = operatorList.argsArray[i];
            } else if (operatorList.fnArray[i] === pdfjs.OPS.paintImageXObject) {
              try {
                const imageXObjectRef = await operatorList.argsArray[i][0];

                let imageObj;
                
                if (resources.has(imageXObjectRef)) {
                  imageObj = await resources.get(imageXObjectRef);const [a, b, c, d, e, f] = currentTransform;
                  const pdfX = e; // Translation in x-direction
                  const pdfY = f;
                  const [viewportX, viewportY] = viewport.convertToViewportPoint(pdfX, pdfY);
                  
                  const imageBitMap: ImageBitmap = await imageObj.bitmap;

                  if (imageBitMap) {
                    while (imageBitMap.height === 0 || imageBitMap.width === 0) {
                      console.log("Waiting on BitMap!");
                    }

                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext("2d");
                    if (context) {
                      
                      canvas.width = Math.abs(imageBitMap.width);
                      canvas.height = Math.abs(imageBitMap.height);

                      try {
                        context.drawImage(imageBitMap, 0, 0);
                        const imgUrl = canvas.toDataURL("image/png");
                        highlights[pageNum - 1].push(processImage(
                          pdfId,
                          viewportX,
                          viewportY,
                          Math.abs(a),
                          Math.abs(d),
                          pageNum,
                          lineNumber,
                          adjustedViewport,
                          "",
                          imgUrl
                        ));
                        lineNumber--;
                      } catch(err) {
                        throw("Error processing image: " + err);
                      }
                    } else {
                      throw(`Invalid context!`);
                    }
                  } else {
                    throw(`Image XObject not found for ref: ${imageXObjectRef}`);
                  }
                    }
              } catch(err) {
                console.error("Error getting image: " + err)
              }
          }
        }
      } catch(err) {
        console.error("Error getting images from page " + pageNum + ": " + err)
      }
    }
    return highlights;
  } catch (error) {
    console.error("Error getting images:", error);
  }
  return [[]];
};

/**
 * Processes a line of text to find and create highlights for matching keywords
 * @param lineItems - Array of text items in the line
 * @param text - Concatenated text of the line
 * @param keywords - Array of keywords to search for
 * @param pageNumber - Current page number
 * @param highlights - Array to store created highlights
 * @param viewport - Adjusted viewport for coordinate conversion
 */
const processLine = (
  pdfId: string,
  lineItems: any[],
  text: string,
  //keywords: string[],
  pageNumber: number,
  lineNumber: number,
  //highlights: IHighlight[],
  viewport: any,
) => {
      // Calculate coordinates for the highlight
      // FIXME: These calculations might not be accurate for all PDFs
    try {
      let startItem = lineItems[0];
      let endItem = lineItems[lineItems.length - 1];

      const x1 = startItem.transform[4];
      const y1 = startItem.transform[5];
      const x2 = endItem.transform[4] + endItem.width;
      const y2 =
        startItem.transform[5] +
        Math.max(...lineItems.map((item) => item.height));

      // Convert coordinates to viewport points
      const [tx1, ty1] = [x1, y1];
      const [tx2, ty2] = [x2, y2];

      // Flip y-coordinates
      // FIXME: This flipping might not be necessary or correct for all PDFs
      const flippedY1 = viewport.height - ty1;
      const flippedY2 = viewport.height - ty2;

      // Create and add the highlight
      return {
        //id: getNextId(),
        pdfId,
        pageNumber,
        lineNumber,
        x1: tx1,
        y1: Math.min(flippedY1, flippedY2),
        x2: tx2,
        y2: Math.max(flippedY1, flippedY2),
        width: viewport.width,
        height: viewport.height,
        text: text,
      } as StoredHighlight;
    } catch (err) {
      throw ("Error creating highlight: " + err);
    }
    //}
  //});
};

const processImage = (
  pdfId: string,
  //keywords: string[],
  x1: number,
  y1: number,
  width: number,
  height: number,
  pageNumber: number,
  lineNumber: number,
  //highlights: IHighlight[],
  viewport: any,
  text: string,
  image?: string,
) => {
  // Calculate coordinates for the highlight
  // FIXME: These calculations might not be accurate for all PDFs
  try {

    const x2 = x1 + width;
    const y2 = y1 - height;

    // Create and add the highlight
    if (image) {
      return {
        pdfId,
        pageNumber,
        lineNumber,
        x1: x1,
        y1: Math.min(y1, y2),
        x2: x2,
        y2: Math.max(y1, y2),
        width: viewport.width,
        height: viewport.height,
        text, 
        image
      } as StoredHighlight;
    }
    return {
      pdfId,
      pageNumber,
      lineNumber,
      x1: x1,
      y1: Math.min(y1, y2),
      x2: x2,
      y2: Math.max(y1, y2),
      width: viewport.width,
      height: viewport.height,
      text
    } as StoredHighlight;
  } catch (err) {
    throw ("Error creating highlight: " + err);
  }
};

export const getPdfId = (pdfName: string, email?: string) => {
  return email
    ? `${pdfName.replace(".", "__")}__${email.replace("@", "__at__").replace(".", "__")}`
    : pdfName.replace(".", "__");
}

// https://stackoverflow.com/a/65985452
const readFileData = async (file: File) => {
  return new Promise((resolve, reject) => {
    console.log("Reading file data!")
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e?.target?.result);
    };
    reader.onerror = (err) => {
      reject(err);
    };
    reader.readAsDataURL(file);
  });
};

export const convertPdfToImages = async (file: File) => {
  console.log("Reading file data!")
  const data = await readFileData(file);
  console.log("Data read!");
  if (!data) {
    return [];
  }
  const images: StoredImage[] = [];
  const pdf = await pdfjs.getDocument(data).promise;
  const canvas = document.createElement("canvas");
  for (let i = 0; i < pdf.numPages; i++) {
    const page = await pdf.getPage(i + 1);
    const viewport = page.getViewport({ scale: 1 });
    const context = canvas.getContext("2d");
    if (context) {
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport: viewport }).promise;
      images.push({image: canvas.toDataURL(), height: canvas.height, width: canvas.width } as StoredImage);
    }
  }
  canvas.remove();
  return images;
};

export const convertToBlob = async (file: File) => {
  return new Promise<Blob> ((resolve, reject) => {
    try {
      var request = new XMLHttpRequest();
      let fileUrl = URL.createObjectURL(file);
      request.open('GET', fileUrl, true);
      request.responseType = 'blob';
      request.send();
      console.log(request.response);
      resolve(request.response);
    } catch (err) {
      reject(err);
    }
  })
};
