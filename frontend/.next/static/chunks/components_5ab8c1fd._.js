(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push(["static/chunks/components_5ab8c1fd._.js", {

"[project]/components/Messages.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "Messages": (()=>Messages)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-client] (ecmascript) <export default as ChevronDown>");
;
var _s = __turbopack_context__.k.signature();
;
;
const AIContext = ({ message })=>{
    _s();
    const actualMessage = message.split("\n").slice(1).join("\n");
    const chunks = actualMessage.split("\n\n\n");
    // return (
    //     <div className="p-5 bg-slate-100 dark:bg-slate-800">
    //         <p className="font-bold">Context:</p>
    //         <ol>
    //             {chunks.map((chunk, i) => (
    //                 <li key={i}>...{chunk}...</li>
    //             ))}
    //         </ol>
    //     </div>
    // );
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const toggleSection = ()=>{
        setOpen(!open);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "border rounded-md overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                className: "flex justify-between items-center w-full p-4 text-left transition-colors duration-200",
                onClick: ()=>toggleSection(),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "font-medium",
                        children: "PDF Context:"
                    }, void 0, false, {
                        fileName: "[project]/components/Messages.tsx",
                        lineNumber: 73,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                        className: `transition-transform duration-300 ${open ? "transform rotate-180" : ""}`,
                        size: 20
                    }, void 0, false, {
                        fileName: "[project]/components/Messages.tsx",
                        lineNumber: 74,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/Messages.tsx",
                lineNumber: 69,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `overflow-y-scroll transition-all duration-300 ${open ? "max-h-40" : "max-h-0"}`,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "p-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "font-bold",
                            children: "Context:"
                        }, void 0, false, {
                            fileName: "[project]/components/Messages.tsx",
                            lineNumber: 87,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                            className: "flex flex-col gap-2",
                            children: chunks.map((chunk, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: [
                                        "...",
                                        chunk,
                                        "..."
                                    ]
                                }, i, true, {
                                    fileName: "[project]/components/Messages.tsx",
                                    lineNumber: 90,
                                    columnNumber: 29
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/components/Messages.tsx",
                            lineNumber: 88,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/Messages.tsx",
                    lineNumber: 86,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/Messages.tsx",
                lineNumber: 81,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/Messages.tsx",
        lineNumber: 68,
        columnNumber: 9
    }, this);
};
_s(AIContext, "xG1TONbKtDWtdOTrXaTAsNhPg/Q=");
_c = AIContext;
const Messages = ({ messages })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
        className: "px-5",
        children: messages.map((m, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                className: `p-5 flex flex-col gap-3 rounded ${m.role === "user" ? "" : "bg-slate-100 dark:bg-slate-800"}`,
                children: [
                    m.role !== "context" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "font-bold",
                        children: m.role === "user" ? "You:" : "Assistant:"
                    }, void 0, false, {
                        fileName: "[project]/components/Messages.tsx",
                        lineNumber: 116,
                        columnNumber: 25
                    }, this),
                    m.role === "context" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AIContext, {
                        message: m.content
                    }, void 0, false, {
                        fileName: "[project]/components/Messages.tsx",
                        lineNumber: 121,
                        columnNumber: 25
                    }, this) : m.content.trim().split("```").map((chunk, chunkI)=>chunkI % 2 == 1 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                            className: "bg-gray-950 p-3 rounded text-white overflow-x-scroll",
                            children: chunk.trim()
                        }, `chunk: ${chunkI}`, false, {
                            fileName: "[project]/components/Messages.tsx",
                            lineNumber: 128,
                            columnNumber: 37
                        }, this) : chunk.split("\n").map((t, i)=>t !== "" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: t
                            }, i, false, {
                                fileName: "[project]/components/Messages.tsx",
                                lineNumber: 138,
                                columnNumber: 56
                            }, this) : ""))
                ]
            }, i, true, {
                fileName: "[project]/components/Messages.tsx",
                lineNumber: 107,
                columnNumber: 17
            }, this))
    }, void 0, false, {
        fileName: "[project]/components/Messages.tsx",
        lineNumber: 105,
        columnNumber: 9
    }, this);
};
_c1 = Messages;
var _c, _c1;
__turbopack_context__.k.register(_c, "AIContext");
__turbopack_context__.k.register(_c1, "Messages");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/components/MessageInput.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "MessageInput": (()=>MessageInput)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
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
                fileName: "[project]/components/MessageInput.tsx",
                lineNumber: 64,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                className: `bg-blue-500 text-white rounded-md p-2 px-6 font-semibold ${isGenerating ? "cursor-not-allowed" : ""}`,
                type: "submit",
                children: isGenerating ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-7 h-7 animate-spin bg-transparent border-4 rounded-full border-t-transparent"
                }, void 0, false, {
                    fileName: "[project]/components/MessageInput.tsx",
                    lineNumber: 81,
                    columnNumber: 21
                }, this) : "send"
            }, void 0, false, {
                fileName: "[project]/components/MessageInput.tsx",
                lineNumber: 74,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/MessageInput.tsx",
        lineNumber: 63,
        columnNumber: 9
    }, this);
};
_s(MessageInput, "3NuXMehGm/8n+NZo6zvRgE7w+00=");
_c = MessageInput;
var _c;
__turbopack_context__.k.register(_c, "MessageInput");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/components/ChatWindow.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "ChatWindow": (()=>ChatWindow)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Messages$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Messages.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$MessageInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/MessageInput.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/socket.io-client/build/esm/index.js [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/socket.io-client/build/esm/index.js [app-client] (ecmascript) <locals>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
const socket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["io"])("http://localhost:5000");
const ChatWindow = ({ threadId })=>{
    _s();
    const [messages, setMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isGenerating, setIsGenerating] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [incomingMessage, setIncomingMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChatWindow.useEffect": ()=>{
            console.log("bro");
            socket.on("connect", {
                "ChatWindow.useEffect": ()=>{
                    console.log("connected to socket");
                    socket.emit("join_thread", threadId);
                }
            }["ChatWindow.useEffect"]);
            const getThread = {
                "ChatWindow.useEffect.getThread": async ()=>{
                    console.log("THREAD ID", threadId);
                    const response = await fetch(`http://localhost:5000/thread/${threadId}`);
                    const data = await response.json();
                    console.log(data);
                    setMessages(data.messages);
                }
            }["ChatWindow.useEffect.getThread"];
            getThread();
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
            socket.emit("join_thread", threadId);
        }
    }["ChatWindow.useEffect"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChatWindow.useEffect": ()=>{
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
            function handleIncomingContext(context) {
                console.log(context);
                setMessages({
                    "ChatWindow.useEffect.handleIncomingContext": (prev)=>[
                            ...prev,
                            {
                                role: "context",
                                content: context
                            }
                        ]
                }["ChatWindow.useEffect.handleIncomingContext"]);
            }
            socket.on("context", handleIncomingContext);
            socket.on("incoming_token", handleIncomingToken);
            socket.on("start_message", handleStartMessage);
            socket.on("end_message", handleEndMessage);
            return ({
                "ChatWindow.useEffect": ()=>{
                    socket.off("context", handleIncomingContext);
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
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Messages$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Messages"], {
                                messages: isGenerating ? [
                                    ...messages,
                                    {
                                        role: "assistant",
                                        content: incomingMessage
                                    }
                                ] : messages
                            }, void 0, false, {
                                fileName: "[project]/components/ChatWindow.tsx",
                                lineNumber: 109,
                                columnNumber: 25
                            }, this),
                            messages.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-5 text-center",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xl",
                                    children: "pdf has been uploaded and processed, ask it a question!"
                                }, void 0, false, {
                                    fileName: "[project]/components/ChatWindow.tsx",
                                    lineNumber: 124,
                                    columnNumber: 33
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/ChatWindow.tsx",
                                lineNumber: 123,
                                columnNumber: 29
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ChatWindow.tsx",
                        lineNumber: 108,
                        columnNumber: 21
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/components/ChatWindow.tsx",
                    lineNumber: 107,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "sticky bottom-0 w-full flex justify-center",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-full max-w-5xl",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$MessageInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MessageInput"], {
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
                            lineNumber: 135,
                            columnNumber: 25
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/ChatWindow.tsx",
                        lineNumber: 134,
                        columnNumber: 21
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/components/ChatWindow.tsx",
                    lineNumber: 133,
                    columnNumber: 17
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/ChatWindow.tsx",
            lineNumber: 106,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/ChatWindow.tsx",
        lineNumber: 105,
        columnNumber: 9
    }, this);
};
_s(ChatWindow, "YccSzwN7eSBSGVcZ6sZMCRZWLf0=");
_c = ChatWindow;
var _c;
__turbopack_context__.k.register(_c, "ChatWindow");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=components_5ab8c1fd._.js.map