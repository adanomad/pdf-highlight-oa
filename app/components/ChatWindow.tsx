"use client";
import { FC, useState, useEffect } from "react";
import type Message from "../types/Message";
import { Messages } from "./Messages";
import { MessageInput } from "./MessageInput";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

interface ClientMessage {
    type: "message";
    content?: string;
}

interface Props {
    threadId: string;
    handleContext?: (context: string) => void;
}

export const ChatWindow: FC<Props> = ({ threadId, handleContext }) => {
    const [messages, setMessages] = useState<Message[]>([]);

    const [isGenerating, setIsGenerating] = useState(false);
    const [incomingMessage, setIncomingMessage] = useState("");

    useEffect(() => {
        console.log("bro");
        socket.on("connect", () => {
            console.log("connected to socket");
            socket.emit("join_thread", threadId);
        });

        const getThread = async () => {
            console.log("THREAD ID", threadId);
            const response = await fetch(
                `http://localhost:5000/thread/${threadId}`
            );
            const data = await response.json();
            console.log(data);
            setMessages(data.messages);
        };
        getThread();
    }, []);

    useEffect(() => {
        if (isGenerating === false && incomingMessage !== "") {
            setMessages([
                ...messages,
                { content: incomingMessage, role: "assistant" },
            ]);
            setIncomingMessage("");
        }
    }, [isGenerating, incomingMessage, messages]);

    useEffect(() => {
        const pageHeight = document.body.scrollHeight;
        window.scroll({
            behavior: "smooth",
            left: 0,
            top: pageHeight,
        });
    }, [incomingMessage]);

    useEffect(() => {
        console.log(incomingMessage);
        socket.emit("join_thread", threadId);
    });

    useEffect(() => {
        function handleStartMessage() {
            setIsGenerating(true);
            setIncomingMessage("");
        }

        function handleEndMessage() {
            setIsGenerating(false);
        }

        function handleIncomingToken(token: string) {
            console.log(token);
            setIncomingMessage((prev) => `${prev}${token}`);
        }

        function handleIncomingContext(context: string) {
            console.log(context);
            handleContext?.(context);
            setMessages((prev) => [
                ...prev,
                { role: "context", content: context },
            ]);
        }

        socket.on("context", handleIncomingContext);
        socket.on("incoming_token", handleIncomingToken);
        socket.on("start_message", handleStartMessage);
        socket.on("end_message", handleEndMessage);

        return () => {
            socket.off("context", handleIncomingContext);
            socket.off("incoming_token", handleIncomingToken);
            socket.off("start_message", handleStartMessage);
            socket.off("end_message", handleEndMessage);
        };
    }, [messages, incomingMessage, isGenerating]);

    return (
        <div className="flex flex-col h-[calc(100vh-16rem)] overflow-scroll">
            <div className="w-full flex flex-col min-h-screen">
                <div className="w-full flex justify-center flex-grow">
                    <div className="w-full max-w-5xl">
                        <Messages
                            messages={
                                isGenerating
                                    ? [
                                          ...messages,
                                          {
                                              role: "assistant",
                                              content: incomingMessage,
                                          },
                                      ]
                                    : messages
                            }
                        />
                        {messages.length === 0 && (
                            <div className="p-5 text-center">
                                <p className="text-xl">
                                    pdf has been uploaded and processed, ask it
                                    a question!
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="sticky bottom-0 w-full flex justify-center">
                    <div className="w-full max-w-5xl">
                        <MessageInput
                            isGenerating={isGenerating}
                            handleMessage={(m) => {
                                if (isGenerating || m === "") return false;

                                const clientMessage: ClientMessage = {
                                    type: "message",
                                    content: m,
                                };

                                socket.emit("message", m);

                                setMessages([
                                    ...messages,
                                    { role: "user", content: m },
                                ]);

                                return true;
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
