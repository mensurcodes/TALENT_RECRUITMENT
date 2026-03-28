import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { RubricEvaluation } from "../types";
import { deriveWeakestPoints } from "./evaluationParse";

const MARGIN = 50;
const LINE = 14;
const MAX_W = 92;

function wrapWords(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

function drawParagraph(
  page: PDFPage,
  font: PDFFont,
  fontBold: PDFFont,
  text: string,
  size: number,
  x: number,
  yStart: number,
  maxWidthChars: number,
  boldTitle?: string,
): number {
  let y = yStart;
  if (boldTitle) {
    page.drawText(boldTitle, { x, y, size: size + 1, font: fontBold, color: rgb(0.1, 0.15, 0.25) });
    y -= LINE + 4;
  }
  for (const line of wrapWords(text, maxWidthChars)) {
    page.drawText(line, { x, y, size, font, color: rgb(0.2, 0.22, 0.28) });
    y -= LINE;
  }
  return y - 8;
}

export type AssessmentReportMeta = {
  applicantName: string;
  jobTitle: string;
  companyName: string;
  recruiterName: string;
  interviewId: number;
  submittedAt: string | null;
  evaluation: RubricEvaluation;
};

/** Shared document for applicant download and recruiter export (same structure). */
export async function buildAssessmentReportPdf(meta: AssessmentReportMeta): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([612, 792]);
  let y = 760;

  const title = "Assessment report";
  page.drawText(title, {
    x: MARGIN,
    y,
    size: 20,
    font: fontBold,
    color: rgb(0.12, 0.28, 0.55),
  });
  y -= 28;

  page.drawText(`${meta.jobTitle} · ${meta.companyName}`, {
    x: MARGIN,
    y,
    size: 12,
    font: fontBold,
    color: rgb(0.15, 0.17, 0.2),
  });
  y -= 18;
  page.drawText(`Interview ID: ${meta.interviewId} · Candidate: ${meta.applicantName}`, {
    x: MARGIN,
    y,
    size: 10,
    font,
    color: rgb(0.35, 0.38, 0.42),
  });
  y -= 14;
  if (meta.submittedAt) {
    page.drawText(
      `Submitted: ${new Date(meta.submittedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`,
      { x: MARGIN, y, size: 10, font, color: rgb(0.35, 0.38, 0.42) },
    );
    y -= 14;
  }
  page.drawText(`Recruiter: ${meta.recruiterName}`, { x: MARGIN, y, size: 10, font, color: rgb(0.35, 0.38, 0.42) });
  y -= 28;

  const ev = meta.evaluation;
  const scoreLine = `Overall score: ${ev.overallScore} / ${ev.maxScore}`;
  page.drawText(scoreLine, { x: MARGIN, y, size: 14, font: fontBold, color: rgb(0.1, 0.2, 0.45) });
  y -= 24;

  y = drawParagraph(page, font, fontBold, ev.summary, 11, MARGIN, y, MAX_W, "Summary");

  const weakest = deriveWeakestPoints(ev);
  if (weakest.length) {
    if (y < 120) {
      page = doc.addPage([612, 792]);
      y = 760;
    }
    page.drawText("Focus areas (weakest points)", {
      x: MARGIN,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0.45, 0.2, 0.15),
    });
    y -= 18;
    for (const item of weakest) {
      const bullet = `• ${item}`;
      for (const line of wrapWords(bullet, MAX_W - 2)) {
        if (y < 60) {
          page = doc.addPage([612, 792]);
          y = 760;
        }
        page.drawText(line, { x: MARGIN, y, size: 10, font, color: rgb(0.25, 0.2, 0.2) });
        y -= LINE;
      }
      y -= 4;
    }
    y -= 12;
  }

  if (ev.strengths.length) {
    if (y < 140) {
      page = doc.addPage([612, 792]);
      y = 760;
    }
    page.drawText("Strengths", { x: MARGIN, y, size: 12, font: fontBold, color: rgb(0.12, 0.35, 0.25) });
    y -= 18;
    for (const s of ev.strengths) {
      for (const line of wrapWords(`• ${s}`, MAX_W)) {
        if (y < 50) {
          page = doc.addPage([612, 792]);
          y = 760;
        }
        page.drawText(line, { x: MARGIN, y, size: 10, font, color: rgb(0.22, 0.26, 0.24) });
        y -= LINE;
      }
      y -= 4;
    }
    y -= 8;
  }

  if (ev.rubricBreakdown.length) {
    if (y < 160) {
      page = doc.addPage([612, 792]);
      y = 760;
    }
    page.drawText("Rubric breakdown", { x: MARGIN, y, size: 12, font: fontBold, color: rgb(0.15, 0.17, 0.22) });
    y -= 18;
    for (const row of ev.rubricBreakdown) {
      const head = `${row.criterion}: ${row.score} / ${row.max}`;
      if (y < 50) {
        page = doc.addPage([612, 792]);
        y = 760;
      }
      page.drawText(head, { x: MARGIN, y, size: 10, font: fontBold, color: rgb(0.2, 0.22, 0.28) });
      y -= LINE;
      if (row.note) {
        for (const line of wrapWords(row.note, MAX_W)) {
          if (y < 45) {
            page = doc.addPage([612, 792]);
            y = 760;
          }
          page.drawText(line, { x: MARGIN + 8, y, size: 9, font, color: rgb(0.35, 0.38, 0.42) });
          y -= LINE - 1;
        }
      }
      y -= 6;
    }
  }

  const foot =
    "Confidential — Talent Recruitment. This PDF matches the recruiter assessment export layout (without private recruiter notes).";
  const footY = 36;
  doc.getPages().forEach((p) => {
    p.drawText(foot, {
      x: MARGIN,
      y: footY,
      size: 7,
      font,
      color: rgb(0.55, 0.55, 0.58),
    });
  });

  return doc.save();
}
