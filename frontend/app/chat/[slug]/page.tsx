// "use client";
import { ChatWindow } from "@/components/ChatWindow";
import Link from "next/link";

export default async function Chat({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    return (
        <>
            <header className="m-8">
                <Link className="underline" href="/">
                    <h1 className="text-xl font-bold">Home</h1>
                </Link>
                <hr />
            </header>
            <ChatWindow threadId={slug} />
        </>
    );
}
