interface Message {
    role: "user" | "assistant";
    content: string;
}

export default Message;
