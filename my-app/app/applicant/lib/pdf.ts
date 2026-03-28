import type { Buffer } from "node:buffer";

export async function extractPdfText(buffer: Buffer): Promise<{ text: string; error?: string }> {
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      const raw = (result.text ?? "").replace(/\s+/g, " ").trim();
      if (!raw) {
        return {
          text: "",
          error:
            "No extractable text in this PDF. Use a text-based PDF (not a scanned image), or paste a resume URL instead.",
        };
      }
      return { text: raw.slice(0, 14_000) };
    } finally {
      await parser.destroy();
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { text: "", error: `Could not read PDF: ${msg}` };
  }
}
