interface Message {
    role: "user" | "assistant" | "context";
    content: string;
}

export default Message;
