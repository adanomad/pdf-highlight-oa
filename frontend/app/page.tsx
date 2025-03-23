"use client";
import { useEffect, useState, useRef } from "react";
import { Uploader } from "@/components/Uploader";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
    const router = useRouter();
    const count = useRef(0);

    const [threads, useThreads] = useState<{ id: string; title: string }[]>([]);

    useEffect(() => {
        const getThreads = () => {
            fetch("http://localhost:5000/threads")
                .then((res) => res.json())
                .then((data) => {
                    useThreads(data);
                });
        };

        getThreads();
    }, []);

    useEffect(() => {
        console.log(threads);
    }, [threads]);

    const handleUpload = async (file: File) => {
        if (count.current > 0) {
            return;
        }
        console.log("UPLOADING FILE");
        console.log(count.current);
        count.current += 1;
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("http://localhost:5000/upload", {
            method: "POST",
            body: formData,
        });
        const data = await response.json();
        console.log(data);

        console.log("pushing to chat");
        router.push(`/chat/${data.threadId}`);
    };

    return (
        <div>
            <div className="m-8">
                <Uploader onUpload={handleUpload} />
            </div>
            {threads.length > 0 && (
                <div className="m-8 p-8 flex flex-col border border-slate-700 rounded-xl gap-4 bg-slate-800">
                    <h2>Or Continue a Previous Thread</h2> <hr />{" "}
                    <ul>
                        {threads.map((thread) => (
                            <li key={thread.id}>
                                <Link
                                    className="underline"
                                    href={`/chat/${thread.id}`}
                                >
                                    {thread.title}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
