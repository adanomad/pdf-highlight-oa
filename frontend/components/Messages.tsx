import { FC } from "react";
import type Message from "../types/Message";

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
                    <p className="font-bold">
                        {m.role === "user" ? "you:" : "assistant:"}
                    </p>
                    {m.content
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
                        )}
                </li>
            ))}
        </ul>
    );
};
