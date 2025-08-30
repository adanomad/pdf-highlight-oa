// app/utils/supabase-upload.ts
export async function uploadPdfToSupabase(
    file: File,
    opts?: { pdfId?: string; folder?: string; filename?: string }
  ) {
    const fd = new FormData();
    fd.append("file", file);
    if (opts?.pdfId) fd.append("pdfId", opts.pdfId);
    if (opts?.folder) fd.append("folder", opts.folder);
    if (opts?.filename) fd.append("filename", opts.filename);
  
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Upload failed");
    return data as { path: string; publicUrl: string | null };
  }
  