import { NextResponse } from "next/server";
import { conversationDb } from "../../../utils/conversationUtils";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const conversation = await conversationDb.getConversation(params.id);
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }
    const messages = await conversationDb.getMessages(params.id);
    return NextResponse.json({ conversation, messages });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { role, content } = body;

    if (!role || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const message = await conversationDb.addMessage(
      params.id,
      role as "user" | "assistant",
      content
    );
    return NextResponse.json(message);
  } catch (error) {
    console.error("Error adding message:", error);
    return NextResponse.json(
      { error: "Failed to add message" },
      { status: 500 }
    );
  }
} 