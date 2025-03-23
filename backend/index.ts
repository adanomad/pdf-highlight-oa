import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { OpenAI } from "openai";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { getDocument } from "pdfjs-dist";
import { v4 as uuidv4 } from "uuid";
import { existsSync, readFileSync, writeFileSync } from "fs";
dotenv.config();

interface Message {
    role: "user" | "assistant" | "system" | "context";
    content: string;
}

interface Thread {
    chunks: PdfChunk[];
    messages: Message[];
    id: string;
    title: string;
}

// json file for prototyping persistence
const threads: { [key: string]: Thread } = (() => {
    if (existsSync("./threads.json")) {
        return JSON.parse(readFileSync("./threads.json").toString());
    } else {
        writeFileSync("./threads.json", "{}");
        return {};
    }
})();

console.log(threads);

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

function chunkText(text: string, chunkSize = 700, overlap = 50): string[] {
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
    return response.data[0]?.embedding!;
}

async function processPdfText(text: string) {
    const chunks = chunkText(text);
    const promises = [];
    let i = 0;
    for (const chunk of chunks) {
        console.log(chunk);
        console.log(i);
        i++;

        try {
            const embeddingPromise = getEmbedding(chunk);
            promises.push(embeddingPromise);
        } catch (error) {
            console.error("Embedding error:", error);
        }
    }

    const embeddings = await Promise.all(promises);
    const pdfChunks = chunks.map((chunk, i) => ({
        text: chunk,
        embeddings: embeddings[i]!,
    }));

    return pdfChunks;
}

async function generateTitle(chunkTexts: string[]) {
    const title = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "user",
                content:
                    "generate a title for this pdf based on it's first few chunks, it should be 5 words max and descriptive, optionally include an emoji\nchunks:\n" +
                    chunkTexts.slice(0, 4).join("\n"),
            },
        ],
    });
    return title.choices[0]?.message.content;
}

const upload = multer();

app.post("/upload", upload.single("file"), async (req, res, next) => {
    if (!req.file) {
        res.status(400).send("No file uploaded.");
        return;
    }

    try {
        const text = await getDocumentText(req.file.buffer);
        const [newChunks, title] = await Promise.all([
            processPdfText(text),
            generateTitle(chunkText(text)),
        ]);

        if (!title) throw new Error("Failed to generate title");
        console.log("TITLE:", title);

        const newThread: Thread = {
            chunks: newChunks,
            messages: [],
            id: uuidv4(),
            title,
        };

        threads[newThread.id] = newThread;
        writeFileSync("./threads.json", JSON.stringify(threads));

        res.json({ text: text, threadId: newThread.id });
    } catch (error) {
        next(error);
    }
});

app.get("/thread/:id", (req, res) => {
    console.log(threads);
    console.log(req.params.id);
    const thread = threads[req.params.id];
    if (!thread) {
        res.status(404).send("Thread not found");
        return;
    }
    res.json({ messages: thread.messages, title: thread.title, id: thread.id });
});

app.get("/threads", (req, res) => {
    res.json(Object.values(threads).map((t) => ({ title: t.title, id: t.id })));
});

// Socket connection for AI chat.
io.on("connection", (socket) => {
    let threadId: string | null = null;
    socket.on("join_thread", (id: string) => {
        threadId = id;
        const thread = threads[id];
        if (!thread) {
            socket.emit("thread_error", "Thread not found");
            return;
        }
        console.log("Thread joined:", id);
        socket.emit("thread_joined", thread.title);
    });
    console.log("Client connected:", socket.id);
    socket.on("message", async (msg: string) => {
        const thread = threads[threadId!];
        if (!thread) {
            socket.emit("thread_error", {
                error: "Thread not found",
            });
            return;
        }

        thread.messages.push({ role: "user", content: msg });

        const pdfChunks = thread.chunks;

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
                    .slice(0, 4)
                    .map((c, i) => `${c.text}`);
                topChunks.forEach((c) => console.log(c));
                topChunks.forEach((c) => socket.emit("context_chunk", c));

                contextText = topChunks.join("\n\n\n");

                socket.emit("context", `Context from PDF:\n${contextText}`);

                thread.messages.push({
                    role: "context",
                    content: `Context from PDF:\n${contextText}`,
                });
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
            ...thread.messages.map((m) => ({
                role: m.role === "context" ? "assistant" : m.role,
                content: m.content,
            })),
        ];

        socket.emit("start_message");
        try {
            const stream = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages,
                stream: true,
            });

            const tokens = [];
            for await (const chunk of stream) {
                const text = chunk.choices[0]!.delta?.content;
                // console.log(text);
                if (text) {
                    socket.emit("incoming_token", text);
                    tokens.push(text);
                }
            }
            const response = tokens.join("");
            thread.messages.push({ role: "assistant", content: response });
        } catch (error) {
            console.error("OpenAI error:", error);
            socket.emit("chat response", {
                error: "Failed to get response from OpenAI",
            });
        }
        socket.emit("end_message");
        writeFileSync("./threads.json", JSON.stringify(threads));
    });
});

server.listen(port, () => {
    console.log(`Server listening on`, port);
});
