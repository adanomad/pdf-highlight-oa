"use client";
import { Uploader } from "@/components/Uploader";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();
    const handleUpload = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("http://localhost:5000/upload", {
            method: "POST",
            body: formData,
        });
        const data = await response.json();
        console.log(data);

        console.log("pushing to chat");
        router.push("/chat");
    };

    return (
        <div>
            <h1>Upload a PDF</h1>
            <Uploader onUpload={handleUpload} />
        </div>
    );
}
