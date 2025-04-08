import { NextResponse } from "next/server";
import { conversationDb } from "../../utils/conversationUtils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pdfId, pdfName } = body;

    if (!pdfId || !pdfName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const conversation = await conversationDb.createConversation(pdfId, pdfName);
    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const conversations = await conversationDb.getConversations();
    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
} 