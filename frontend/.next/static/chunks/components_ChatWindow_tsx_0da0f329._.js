(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push(["static/chunks/components_ChatWindow_tsx_0da0f329._.js", {

"[project]/components/ChatWindow.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "ChatWindow": (()=>ChatWindow)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/socket.io-client/build/esm/index.js [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/socket.io-client/build/esm/index.js [app-client] (ecmascript) <locals>");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
const MessageInput = ({ handleMessage, isGenerating })=>{
    _s();
    const [inputMessage, setInputMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [height, setScrollHeight] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("auto");
    const textareaRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const isShift = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const submit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MessageInput.useCallback[submit]": ()=>{
            const reset = handleMessage(inputMessage);
            if (reset) setInputMessage("");
        }
    }["MessageInput.useCallback[submit]"], [
        inputMessage,
        handleMessage
    ]);
    const handleChange = (e)=>{
        setInputMessage(e.target.value);
        setScrollHeight(e.target.scrollHeight);
    };
    const handleSubmit = (e)=>{
        e.preventDefault();
        submit();
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MessageInput.useEffect": ()=>{
            const handleKeyDown = {
                "MessageInput.useEffect.handleKeyDown": (e)=>{
                    if (e.key === "Enter" && !isShift.current) {
                        e.preventDefault();
                        if (!isGenerating) submit();
                    } else if (e.key === "Shift") {
                        isShift.current = true;
                    }
                }
            }["MessageInput.useEffect.handleKeyDown"];
            const handleKeyUp = {
                "MessageInput.useEffect.handleKeyUp": (e)=>{
                    if (e.key === "Shift") {
                        isShift.current = false;
                    }
                }
            }["MessageInput.useEffect.handleKeyUp"];
            window.addEventListener("keydown", handleKeyDown);
            window.addEventListener("keyup", handleKeyUp);
            return ({
                "MessageInput.useEffect": ()=>{
                    window.removeEventListener("keydown", handleKeyDown);
                    window.removeEventListener("keyup", handleKeyUp);
                }
            })["MessageInput.useEffect"];
        }
    }["MessageInput.useEffect"], [
        inputMessage,
        submit,
        isGenerating
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
        className: "flex w-full gap-5 p-5",
        onSubmit: handleSubmit,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                className: "grow ring-none outline-none border-none rounded ring-2 ring-gray-200 focus:ring-2 focus:ring-blue-500 p-5 dark:bg-slate-800 dark:ring-gray-600",
                value: inputMessage,
                // onChange={(e) => setInputMessage(e.target.value)}
                onChange: handleChange,
                placeholder: "Your Message",
                autoFocus: true,
                style: {
                    height: `${height}px`
                },
                ref: textareaRef
            }, void 0, false, {
                fileName: "[project]/components/ChatWindow.tsx",
                lineNumber: 68,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                className: `bg-blue-500 text-white rounded-md p-2 px-6 font-semibold ${isGenerating ? "cursor-not-allowed" : ""}`,
                type: "submit",
                children: isGenerating ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-7 h-7 animate-spin bg-transparent border-4 rounded-full border-t-transparent"
                }, void 0, false, {
                    fileName: "[project]/components/ChatWindow.tsx",
                    lineNumber: 85,
                    columnNumber: 21
                }, this) : "send"
            }, void 0, false, {
                fileName: "[project]/components/ChatWindow.tsx",
                lineNumber: 78,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/ChatWindow.tsx",
        lineNumber: 67,
        columnNumber: 9
    }, this);
};
_s(MessageInput, "3NuXMehGm/8n+NZo6zvRgE7w+00=");
_c = MessageInput;
// const socket = new WebSocket("ws://localhost:4000");
const socket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["io"])("http://localhost:5000");
function ChatWindow() {
    _s1();
    const [messages, setMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([
        {
            role: "assistant",
            content: "how can i help you today"
        }
    ]);
    const [isGenerating, setIsGenerating] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [incomingMessage, setIncomingMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChatWindow.useEffect": ()=>{
            console.log("bro");
            socket.on("connect", {
                "ChatWindow.useEffect": ()=>{
                    console.log("connected to socket");
                }
            }["ChatWindow.useEffect"]);
        }
    }["ChatWindow.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChatWindow.useEffect": ()=>{
            if (isGenerating === false && incomingMessage !== "") {
                setMessages([
                    ...messages,
                    {
                        content: incomingMessage,
                        role: "assistant"
                    }
                ]);
                setIncomingMessage("");
            }
        }
    }["ChatWindow.useEffect"], [
        isGenerating,
        incomingMessage,
        messages
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChatWindow.useEffect": ()=>{
            const pageHeight = document.body.scrollHeight;
            window.scroll({
                behavior: "smooth",
                left: 0,
                top: pageHeight
            });
        }
    }["ChatWindow.useEffect"], [
        incomingMessage
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChatWindow.useEffect": ()=>{
            console.log(incomingMessage);
        }
    }["ChatWindow.useEffect"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChatWindow.useEffect": ()=>{
            // function handleIncomingMessage(e: MessageEvent) {
            //     const message: ServerMessage = JSON.parse(e.data);
            //     if (message.type === "start_message") {
            //         setIsGenerating(true);
            //         setIncomingMessage("");
            //     } else if (message.type === "end_message") {
            //         console.log(incomingMessage);
            //         setIsGenerating(false);
            //     } else {
            //         setIncomingMessage(`${incomingMessage}${message.token}`);
            //     }
            // }
            function handleStartMessage() {
                setIsGenerating(true);
                setIncomingMessage("");
            }
            function handleEndMessage() {
                setIsGenerating(false);
            }
            function handleIncomingToken(token) {
                console.log(token);
                setIncomingMessage({
                    "ChatWindow.useEffect.handleIncomingToken": (prev)=>`${prev}${token}`
                }["ChatWindow.useEffect.handleIncomingToken"]);
            }
            socket.on("incoming_token", handleIncomingToken);
            socket.on("start_message", handleStartMessage);
            socket.on("end_message", handleEndMessage);
            return ({
                "ChatWindow.useEffect": ()=>{
                    socket.off("incoming_token", handleIncomingToken);
                    socket.off("start_message", handleStartMessage);
                    socket.off("end_message", handleEndMessage);
                }
            })["ChatWindow.useEffect"];
        }
    }["ChatWindow.useEffect"], [
        messages,
        incomingMessage,
        isGenerating
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col min-h-screen",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-full flex flex-col justify-center min-h-screen",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-full flex justify-center flex-grow",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-full max-w-5xl",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Messages, {
                            messages: isGenerating ? [
                                ...messages,
                                {
                                    role: "assistant",
                                    content: incomingMessage
                                }
                            ] : messages
                        }, void 0, false, {
                            fileName: "[project]/components/ChatWindow.tsx",
                            lineNumber: 190,
                            columnNumber: 25
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/ChatWindow.tsx",
                        lineNumber: 189,
                        columnNumber: 21
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/components/ChatWindow.tsx",
                    lineNumber: 188,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "sticky bottom-0 w-full flex justify-center",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-full max-w-5xl",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MessageInput, {
                            isGenerating: isGenerating,
                            handleMessage: (m)=>{
                                if (isGenerating || m === "") return false;
                                const clientMessage = {
                                    type: "message",
                                    content: m
                                };
                                socket.emit("message", m);
                                setMessages([
                                    ...messages,
                                    {
                                        role: "user",
                                        content: m
                                    }
                                ]);
                                return true;
                            }
                        }, void 0, false, {
                            fileName: "[project]/components/ChatWindow.tsx",
                            lineNumber: 208,
                            columnNumber: 25
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/ChatWindow.tsx",
                        lineNumber: 207,
                        columnNumber: 21
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/components/ChatWindow.tsx",
                    lineNumber: 206,
                    columnNumber: 17
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/ChatWindow.tsx",
            lineNumber: 187,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/ChatWindow.tsx",
        lineNumber: 186,
        columnNumber: 9
    }, this);
}
_s1(ChatWindow, "F5hCfALMgs1EwDjnLz0x2Y2OUC4=");
_c1 = ChatWindow;
const Messages = ({ messages })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
        className: "px-5",
        children: messages.map((m, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                className: `p-5 flex flex-col gap-3 rounded ${m.role === "user" ? "" : "bg-slate-100 dark:bg-slate-800"}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "font-bold",
                        children: m.role === "user" ? "you:" : "assistant:"
                    }, void 0, false, {
                        fileName: "[project]/components/ChatWindow.tsx",
                        lineNumber: 251,
                        columnNumber: 21
                    }, this),
                    m.content.trim().split("```").map((chunk, chunkI)=>chunkI % 2 == 1 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                            className: "bg-gray-950 p-3 rounded text-white overflow-x-scroll",
                            children: chunk.trim()
                        }, `chunk: ${chunkI}`, false, {
                            fileName: "[project]/components/ChatWindow.tsx",
                            lineNumber: 259,
                            columnNumber: 33
                        }, this) : chunk.split("\n").map((t, i)=>t !== "" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: t
                            }, i, false, {
                                fileName: "[project]/components/ChatWindow.tsx",
                                lineNumber: 269,
                                columnNumber: 52
                            }, this) : ""))
                ]
            }, i, true, {
                fileName: "[project]/components/ChatWindow.tsx",
                lineNumber: 243,
                columnNumber: 17
            }, this))
    }, void 0, false, {
        fileName: "[project]/components/ChatWindow.tsx",
        lineNumber: 241,
        columnNumber: 9
    }, this);
};
_c2 = Messages;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "MessageInput");
__turbopack_context__.k.register(_c1, "ChatWindow");
__turbopack_context__.k.register(_c2, "Messages");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=components_ChatWindow_tsx_0da0f329._.js.map