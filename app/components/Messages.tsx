import { FC, useState } from "react";
import { ChevronDown } from "lucide-react";
import type Message from "../types/Message";

interface ContextProps {
    message: string;
}
const AIContext: FC<ContextProps> = ({ message }) => {
    const actualMessage = message.split("\n").slice(1).join("\n");
    const chunks = actualMessage.split("\n\n\n");

    const [open, setOpen] = useState(false);

    const toggleSection = () => {
        setOpen(!open);
    };

    return (
        <div className="border rounded-md overflow-hidden">
            <button
                className="flex justify-between items-center w-full p-4 text-left transition-colors duration-200"
                onClick={() => toggleSection()}
            >
                <span className="font-medium">PDF Context:</span>
                <ChevronDown
                    className={`transition-transform duration-300 ${
                        open ? "transform rotate-180" : ""
                    }`}
                    size={20}
                />
            </button>
            <div
                className={`overflow-y-scroll transition-all duration-300 ${
                    open ? "max-h-40" : "max-h-0"
                }`}
            >
                <div className="p-4">
                    <p className="font-bold">Context:</p>
                    <ol className="flex flex-col gap-2">
                        {chunks.map((chunk, i) => (
                            <li key={i}>...{chunk}...</li>
                        ))}
                    </ol>
                </div>
            </div>
        </div>
    );
};

interface MessagesProps {
    messages: Message[];
}

export const Messages: FC<MessagesProps> = ({ messages }) => {
    return (
        <ul className="px-5">
            {messages.map((m, i) => (
                <li
                    className={`p-5 flex flex-col gap-3 rounded ${
                        m.role === "user"
                            ? ""
                            : "bg-slate-100 dark:bg-slate-800"
                    }`}
                    key={i}
                >
                    {m.role !== "context" && (
                        <p className="font-bold">
                            {m.role === "user" ? "You:" : "Assistant:"}
                        </p>
                    )}
                    {m.role === "context" ? (
                        <AIContext message={m.content} />
                    ) : (
                        m.content
                            .trim()
                            .split("```")
                            .map((chunk, chunkI) =>
                                chunkI % 2 == 1 ? (
                                    <pre
                                        className="bg-gray-950 p-3 rounded text-white overflow-x-scroll"
                                        key={`chunk: ${chunkI}`}
                                    >
                                        {chunk.trim()}
                                    </pre>
                                ) : (
                                    chunk
                                        .split("\n")
                                        .map((t, i) =>
                                            t !== "" ? <p key={i}>{t}</p> : ""
                                        )
                                )
                            )
                    )}
                </li>
            ))}
        </ul>
    );
};
