import {
    FC,
    ChangeEvent,
    FormEvent,
    useState,
    useRef,
    useEffect,
    useCallback,
} from "react";

interface Props {
    handleMessage: (message: string) => boolean;
    isGenerating: boolean;
}

export const MessageInput: FC<Props> = ({ handleMessage, isGenerating }) => {
    const [inputMessage, setInputMessage] = useState("");
    const [height, setScrollHeight] = useState<string | number>("auto");
    const textareaRef = useRef(null);
    const isShift = useRef(false);

    const submit = useCallback(() => {
        const reset = handleMessage(inputMessage);
        if (reset) setInputMessage("");
    }, [inputMessage, handleMessage]);

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setInputMessage(e.target.value);
        setScrollHeight(e.target.scrollHeight);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        submit();
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter" && !isShift.current) {
                e.preventDefault();
                if (!isGenerating) submit();
            } else if (e.key === "Shift") {
                isShift.current = true;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === "Shift") {
                isShift.current = false;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, [inputMessage, submit, isGenerating]);

    return (
        <form className="flex w-full gap-5 p-5" onSubmit={handleSubmit}>
            <textarea
                className="grow ring-none outline-none border-none rounded ring-2 ring-gray-200 focus:ring-2 focus:ring-blue-500 p-5 dark:bg-slate-800 dark:ring-gray-600"
                value={inputMessage}
                // onChange={(e) => setInputMessage(e.target.value)}
                onChange={handleChange}
                placeholder="Your Message"
                autoFocus
                style={{ height: `${height}px` }}
                ref={textareaRef}
            />
            <button
                className={`bg-blue-500 text-white rounded-md p-2 px-6 font-semibold ${
                    isGenerating ? "cursor-not-allowed" : ""
                }`}
                type="submit"
            >
                {isGenerating ? (
                    <div className="w-7 h-7 animate-spin bg-transparent border-4 rounded-full border-t-transparent"></div>
                ) : (
                    "send"
                )}
            </button>
        </form>
    );
};
