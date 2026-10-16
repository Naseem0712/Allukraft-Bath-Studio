import type { CustomerDetails, CompanyProfile, QuoteEntry, UnitId } from "./model";
import { GST_RATE, companyTitle, hardwareColourLabel, packageQuoteLines, profileLabel, quoteSubtotal, sizeLabel, splitMarks, todayLabel } from "./model";

export interface PrintInclude {
  elevation: boolean;
  plan: boolean;
  details: boolean;
  amounts: boolean;
  handleName: boolean;
  handlePhoto: boolean;
  lockName: boolean;
  terms: boolean;
}

export function fileBase(mode: "customer" | "quote", customer: string, quoteNo: string): string {
  const raw = (mode === "customer" ? customer : quoteNo).trim() || "quote";
  return raw.replace(/[^\w\-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "quote";
}

export function printQuote(): void {
  window.print();
}

export async function exportPdf(pages: HTMLElement[], filename: string): Promise<void> {
  const [{ jsPDF }, html2canvas] = await Promise.all([import("jspdf"), import("html2canvas")]);
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  for (let index = 0; index < pages.length; index += 1) {
    const canvas = await html2canvas.default(pages[index], {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });
    const img = canvas.toDataURL("image/jpeg", 0.92);
    const pageW = 210;
    const pageH = 297;
    const ratio = canvas.height / canvas.width;
    let drawW = pageW;
    let drawH = pageW * ratio;
    let x = 0;
    let y = 0;
    if (drawH > pageH) {
      drawH = pageH;
      drawW = pageH / ratio;
      x = (pageW - drawW) / 2;
    } else {
      y = 0;
    }
    if (index > 0) pdf.addPage();
    pdf.addImage(img, "JPEG", x, y, drawW, drawH);
  }
  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

async function fadedLogo(dataUrl: string): Promise<string | null> {
  if (!dataUrl) return null;
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("logo"));
    image.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = 520;
  canvas.height = 520;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, 520, 520);
  ctx.globalAlpha = 0.18;
  const scale = Math.min(460 / image.width, 460 / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.drawImage(image, (520 - w) / 2, (520 - h) / 2, w, h);
  return canvas.toDataURL("image/png");
}

async function svgToPng(svg: SVGSVGElement): Promise<string | null> {
  try {
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("svg"));
      image.src = url;
    });
    const canvas = document.createElement("canvas");
    const width = Math.max(600, svg.clientWidth || 680);
    const height = Math.max(220, svg.clientHeight || 360);
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

function imageId(dataUrl: string): { base64: string; extension: "png" | "jpeg" } {
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
  const extension = match?.[1] === "jpeg" || match?.[1] === "jpg" ? "jpeg" : "png";
  return { base64: match?.[2] ?? dataUrl.split(",")[1] ?? "", extension };
}

export async function exportExcel(options: {
  filename: string;
  company: CompanyProfile;
  customer: CustomerDetails;
  quoteNo: string;
  rows: QuoteEntry[];
  unit: UnitId;
  figures: SVGSVGElement[];
  include: PrintInclude;
}): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Quote", {
    pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    headerFooter: {
      oddFooter: "&LThis is a computer generated document · ALLUKRAFT™ Bath Studio&RPage &P of &N",
      evenFooter: "&LThis is a computer generated document · ALLUKRAFT™ Bath Studio&RPage &P of &N",
    },
  });
  sheet.columns = [
    { width: 42 },
    { width: 10 },
    { width: 22 },
    { width: 14 },
    { width: 16 },
    { width: 14 },
    { width: 16 },
  ];
  const date = todayLabel();
  let row = 1;
  if (options.company.logo) {
    const id = workbook.addImage(imageId(options.company.logo));
    const box = await containSize(options.company.logo, 210, 120).catch(() => ({ width: 160, height: 72 }));
    sheet.addImage(id, { tl: { col: 0, row: 0 }, ext: box });
    row = 8;
  }
  sheet.getCell(row, 1).value = companyTitle(options.company);
  sheet.getCell(row, 1).font = { bold: true, size: 16 };
  row += 1;
  for (const line of [options.company.address, options.company.gst && `GST ${options.company.gst}`, options.company.email, options.company.website]) {
    if (!line) continue;
    sheet.getCell(row, 1).value = line;
    row += 1;
  }
  row += 1;
  sheet.getCell(row, 1).value = `Quote ${options.quoteNo}`;
  sheet.getCell(row, 3).value = `Date ${date}`;
  row += 2;
  const customerLines = [
    `M/s ${options.customer.name.trim() || "—"}`,
    options.customer.address.trim(),
    options.customer.contact.trim() && `Contact: ${options.customer.contact.trim()}`,
    options.customer.gst.trim() && `GST: ${options.customer.gst.trim()}`,
  ];
  for (const line of customerLines) {
    if (!line) continue;
    sheet.getCell(row, 1).value = line;
    if (line.startsWith("M/s")) sheet.getCell(row, 1).font = { bold: true };
    row += 1;
  }
  row += 1;
  sheet.getCell(row, 1).value = "Description";
  sheet.getCell(row, 1).font = { bold: true };
  row += 1;
  sheet.getCell(row, 1).value = rich(options.company.description || "—");
  row += 1;
  const faded = options.company.logo ? await fadedLogo(options.company.logo).catch(() => null) : null;
  if (faded) {
    const id = workbook.addImage(imageId(faded));
    sheet.addImage(id, { tl: { col: 2, row: Math.max(8, row) }, ext: { width: 280, height: 280 } });
  }
  for (const entry of options.rows) {
    row += 2;
    sheet.getCell(row, 1).value = `S.No ${entry.serial}${entry.shower.location.trim() ? ` · ${entry.shower.location.trim()}` : ""}  ${sizeLabel(entry.shower, options.unit)}`;
    sheet.getCell(row, 1).font = { bold: true, size: 13 };
    row += 1;
    sheet.getCell(row, 1).value = `${profileLabel(entry.shower.material)} · ${entry.shower.material.colour} · Hardware ${hardwareColourLabel(entry.shower.material)}`;
    row += 1;
    if (entry.shower.notes.trim()) {
      sheet.getCell(row, 1).value = rich(entry.shower.notes);
      row += 1;
    }
    if (options.include.details) {
      const header = sheet.getRow(row);
      const headers = ["Description", "Size", "Area (sq ft)"];
      if (options.include.amounts) headers.push("Rate", "Amount");
      headers.forEach((label, index) => {
        header.getCell(index + 1).value = label;
        header.getCell(index + 1).font = { bold: true };
      });
      row += 1;
      const lines = packageQuoteLines(entry.shower, options.unit);
      for (const line of lines) {
        const name =
          line.kind === "handle" && !options.include.handleName
            ? "Handle"
            : line.kind === "lock" && !options.include.lockName
              ? "Lock"
              : line.description;
        const cells: (string | number)[] = [name, line.size, line.kind === "handle" || line.kind === "lock" ? "—" : Number(line.area.toFixed(2))];
        if (options.include.amounts) cells.push(line.rate, Math.round(line.amount));
        cells.forEach((value, index) => {
          sheet.getCell(row, index + 1).value = value;
        });
        row += 1;
      }
      if (options.include.amounts) {
        const total = lines.reduce((sum, line) => sum + line.amount, 0);
        sheet.getCell(row, 1).value = "Shower total";
        sheet.getCell(row, 5).value = Math.round(total);
        sheet.getCell(row, 1).font = { bold: true };
        sheet.getCell(row, 5).font = { bold: true };
        row += 1;
      }
    }
  }
  row += 2;
  for (const figure of options.figures) {
    const png = await svgToPng(figure);
    if (!png) continue;
    const id = workbook.addImage(imageId(png));
    sheet.addImage(id, { tl: { col: 0, row: row - 1 }, ext: { width: 460, height: 240 } });
    row += 16;
  }
  row += 1;
  if (options.include.amounts) {
    const subtotal = quoteSubtotal(options.rows);
    const gst = subtotal * GST_RATE;
    sheet.getCell(row, 1).value = "Subtotal";
    sheet.getCell(row, 5).value = Math.round(subtotal);
    sheet.getCell(row, 1).font = { bold: true };
    row += 1;
    sheet.getCell(row, 1).value = "GST 18%";
    sheet.getCell(row, 5).value = Math.round(gst);
    row += 1;
    sheet.getCell(row, 1).value = "Grand total";
    sheet.getCell(row, 5).value = Math.round(subtotal + gst);
    sheet.getCell(row, 1).font = { bold: true };
    sheet.getCell(row, 5).font = { bold: true };
    row += 2;
  }
  if (options.include.terms) {
    sheet.getCell(row, 1).value = "Terms";
    sheet.getCell(row, 1).font = { bold: true };
    row += 1;
    sheet.getCell(row, 1).value = rich(options.company.terms);
    sheet.getRow(row).height = 64;
  }
  row += 2;
  sheet.getCell(row, 1).value = "Bank details";
  sheet.getCell(row, 1).font = { bold: true };
  row += 1;
  sheet.getCell(row, 1).value = options.company.bank;
  row += 2;
  sheet.getCell(row, 1).value = `For ${companyTitle(options.company)}`;
  sheet.getCell(row, 4).value = `For M/s ${options.customer.name.trim() || "—"}`;
  row += 3;
  sheet.getCell(row, 1).value = "Authorised signatory";
  sheet.getCell(row, 4).value = "Accepted";
  row += 2;
  sheet.getCell(row, 1).value = {
    richText: [
      { text: "This is a computer generated document · ", font: { italic: true, size: 11, color: { argb: "FF64748B" } } },
      { text: "ALLUKRAFT™ Bath Studio", font: { italic: true, size: 11, color: { argb: "FF1565C0" }, underline: true } },
    ],
  };
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = options.filename.endsWith(".xlsx") ? options.filename : `${options.filename}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

function rich(text: string): { richText: { text: string; font: { bold?: boolean; size: number } }[] } {
  return {
    richText: splitMarks(text).map((part) => ({ text: part.text, font: { bold: part.bold, size: 11 } })),
  };
}

async function containSize(dataUrl: string, maxW: number, maxH: number): Promise<{ width: number; height: number }> {
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("logo"));
    image.src = dataUrl;
  });
  const scale = Math.min(maxW / Math.max(1, image.width), maxH / Math.max(1, image.height));
  return { width: Math.max(24, image.width * scale), height: Math.max(24, image.height * scale) };
}
