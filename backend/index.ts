import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { OpenAI } from "openai";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { getDocument } from "pdfjs-dist";
dotenv.config();

const app = express();

app.use(
    cors({
        origin: "*",
    })
);

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

const port = process.env.PORT || 5000;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY as string });

interface PdfChunk {
    text: string;
    embeddings: number[];
}

let pdfChunks: PdfChunk[] = [];

function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.slice(start, end));
        start += chunkSize - overlap;
    }
    return chunks;
}

function cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((acc, val, i) => acc + val * b[i]!, 0);
    const normA = Math.sqrt(a.reduce((acc, val) => acc + val ** 2, 0));
    const normB = Math.sqrt(b.reduce((acc, val) => acc + val ** 2, 0));
    return dotProduct / (normA * normB);
}

async function getDocumentText(pdf: any): Promise<string> {
    const loadingTask = getDocument({ data: new Uint8Array(pdf) });
    const pdfDocument = await loadingTask.promise;

    let extractedText = "";

    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(" ");
        extractedText += pageText + "\n";
    }

    return extractedText;
}

async function getEmbedding(text: string): Promise<number[]> {
    const embedding = openai.embeddings.create({
        input: text,
        model: "text-embedding-3-small",
    });
    const response = await embedding;
    // console.log(response.data[0]?.embedding);
    return response.data[0]?.embedding!;
}

// Process uploaded PDF: extract text, chunk it, and compute embeddings.
async function processPdf(fileBuffer: Buffer) {
    const data = await getDocumentText(fileBuffer);
    const chunks = chunkText(data);
    pdfChunks = []; // reset previous chunks if any
    for (const chunk of chunks) {
        try {
            const embedding = await getEmbedding(chunk);
            pdfChunks.push({ text: chunk, embeddings: embedding });
        } catch (error) {
            console.error("Embedding error:", error);
        }
    }
}

async function processPdfText(text: string) {
    const chunks = chunkText(text);
    pdfChunks = []; // reset previous chunks if any
    const promises = [];
    let i = 0;
    for (const chunk of chunks) {
        console.log(chunk);
        console.log(i);
        i++;
        // if (i > 1) break;
        try {
            const embeddingPromise = getEmbedding(chunk);
            promises.push(embeddingPromise);
            // pdfChunks.push({ text: chunk, embeddings: embedding });
            // console.log(embedding);
        } catch (error) {
            console.error("Embedding error:", error);
        }
    }

    const embeddings = await Promise.all(promises);
    // console.log(embeddings);
    pdfChunks = chunks.map((chunk, i) => ({
        text: chunk,
        embeddings: embeddings[i]!,
    }));

    // console.log(pdfChunks);
}

const upload = multer();

app.post("/upload", upload.single("file"), async (req, res, next) => {
    if (!req.file) {
        res.status(400).send("No file uploaded.");
        return;
    }

    try {
        // Use the file buffer provided by multer
        const text = await getDocumentText(req.file.buffer);
        await processPdfText(text);
        // Send extracted text as the response
        res.json({ text: text });
    } catch (error) {
        next(error);
    }
});
// // Endpoint to upload PDF.
// app.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
//     if (!req.file) return res.status(400).send("No file uploaded.");
//     try {
//         await processPdf(req.file.buffer);
//         res.send("PDF processed successfully.");
//     } catch (error) {
//         console.error(error);
//         res.status(500).send("Error processing PDF.");
//     }
// });

// Socket connection for AI chat.
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.on("message", async (msg: string) => {
        console.log(msg);
        console.log(pdfChunks.length);
        // If PDF chunks exist, compute query embedding and select top chunks.
        let contextText = "";
        try {
            if (pdfChunks.length > 0) {
                const queryEmbedding = await getEmbedding(msg);
                // Compute similarity for each chunk.
                const scoredChunks = pdfChunks.map((chunk) => ({
                    text: chunk.text,
                    score: cosineSimilarity(queryEmbedding, chunk.embeddings),
                }));
                // Pick top 3 chunks.
                scoredChunks.sort((a, b) => b.score - a.score);
                const topChunks = scoredChunks
                    .slice(0, 3)
                    .map((c, i) => `${i + 1}. ${c.text}`);
                topChunks.forEach((c) => console.log(c));
                topChunks.forEach((c) => socket.emit("context_chunk", c));

                contextText = topChunks.join("\n");
                console.log(pdfChunks);
            }
        } catch (error) {
            console.error("Context error:", error);
        }

        // Build chat messages with context if available.
        const messages = [
            {
                role: "system",
                content: `You are a helpful assistant, who has access to a pdf, every message from the user will be accompanied by pdf context in a system message, if available.${
                    pdfChunks.length > 0
                        ? "here is the first bit of the pdf just so you know what it's about:\n" +
                          pdfChunks.slice(0, 3).join("\n")
                        : ""
                }`,
            },
            ...(contextText
                ? [
                      {
                          role: "system",
                          content: `Context from PDF:\n${contextText}`,
                      },
                  ]
                : []),
            { role: "user", content: msg },
        ];

        socket.emit("start_message");
        try {
            const stream = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages,
                stream: true,
            });

            for await (const chunk of stream) {
                const text = chunk.choices[0]!.delta?.content;
                // console.log(text);
                if (text) {
                    socket.emit("incoming_token", text);
                }
            }
        } catch (error) {
            console.error("OpenAI error:", error);
            socket.emit("chat response", {
                error: "Failed to get response from OpenAI",
            });
        }
        socket.emit("end_message");
    });
});

server.listen(port, () => {
    console.log(`Server listening on`, port);
});
