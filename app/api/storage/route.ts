// app/api/index/route.ts
import { storageMethod } from "../../utils/env";
import { StorageMethod } from "../../utils/types";
import { uploadPdf } from "../../utils/supabase";

export async function POST(req: Request) {
  let response;

  try {
    const formData = await req.formData();
    
    const pdfFile = formData.get("pdfFile") as Blob;
    const pdfId = formData.get("pdfId") as string;
    const pdfName = formData.get("pdfName") as string;

    if (!pdfFile) {
      throw new Error("Missing PDF in request body");
    }

    if (storageMethod === StorageMethod.supabase) {
      const publicURL = await uploadPdf(pdfFile, pdfId, pdfName);
      response = new Response(JSON.stringify({ publicURL }), {
        status: 200,
      });
    } else {
      throw new Error("Only Supabase storage method is supported");
    }

  } catch (error) {
    console.error("Upload error:", error);
    response = new Response(JSON.stringify({ error: error }), { status: 500 });
  } finally {
    return response;
  }
}
