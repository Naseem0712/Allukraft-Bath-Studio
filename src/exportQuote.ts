import type { CustomerDetails, CompanyProfile, QuoteEntry, UnitId } from "./model";
import { GST_RATE, companyTitle, hardwareColourLabel, money, packageQuoteLines, profileLabel, quoteSubtotal, sizeLabel, splitMarks, todayLabel } from "./model";

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

async function rasterCap(src: string, maxPx: number, alpha = 1): Promise<string | null> {
  if (!src) return null;
  const image = new Image();
  image.crossOrigin = "anonymous";
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("image"));
      image.src = src;
    });
  } catch {
    return null;
  }
  const longest = Math.max(image.width, image.height, 1);
  const scale = Math.min(1, maxPx / longest);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.globalAlpha = alpha;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

/** Helvetica has no rupee. Every other character, including bullets and symbols, stays as typed. */
function pdfSafeText(text: string): string {
  return text.replace(/\u20B9/g, "Rs. ");
}

function fitsWinAnsi(text: string): boolean {
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (code > 255) return false;
    if (code >= 0x7f && code < 0xa0) return false;
  }
  return true;
}

type LineSlice = { text: string; left: number; top: number; right: number; bottom: number };

/** One visual line of a text node, taken from the laid-out boxes so bold stays inline. */
function lineSlices(node: Text): LineSlice[] {
  const full = node.data;
  const lines: LineSlice[] = [];
  let current: LineSlice | null = null;
  for (let i = 0; i < full.length; ) {
    const code = full.codePointAt(i) ?? 0;
    const next = i + (code > 0xffff ? 2 : 1);
    const range = document.createRange();
    range.setStart(node, i);
    range.setEnd(node, next);
    const rect = range.getClientRects()[0];
    const ch = full.slice(i, next);
    i = next;
    if (ch === "\n") {
      if (current) lines.push(current);
      current = null;
      continue;
    }
    if (!rect) {
      if (current && ch.trim() !== "") current.text += ch;
      continue;
    }
    if (rect.width < 0.05) {
      if (ch.trim() === "") continue;
      if (current) current.text += ch;
      else current = { text: ch, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
      continue;
    }
    if (!current || Math.abs(rect.top - current.top) > 1.5) {
      if (current) lines.push(current);
      current = { text: ch, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
    } else {
      current.text += ch;
      current.left = Math.min(current.left, rect.left);
      current.right = Math.max(current.right, rect.right);
      current.top = Math.min(current.top, rect.top);
      current.bottom = Math.max(current.bottom, rect.bottom);
    }
  }
  if (current) lines.push(current);
  return lines.filter((line) => line.text.trim().length > 0);
}

function rasterLine(text: string, fontPx: number, bold: boolean, widthPx: number, heightPx: number): string | null {
  const scale = 3;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil((widthPx + 4) * scale));
  canvas.height = Math.max(1, Math.ceil((heightPx + 2) * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(scale, scale);
  ctx.font = `${bold ? 700 : 400} ${fontPx}px "Segoe UI Emoji", "Segoe UI Symbol", "Apple Color Emoji", "Noto Color Emoji", "Segoe UI", sans-serif`;
  ctx.fillStyle = "#111111";
  ctx.textBaseline = "top";
  ctx.fillText(text, 0, 1);
  return canvas.toDataURL("image/png");
}

/** Copy paint onto the clone in user units so the PDF lines match the quote page. */
function paintForPdf(live: SVGSVGElement, clone: SVGSVGElement, displayWidthMm: number) {
  const box = live.viewBox?.baseVal;
  const vbW = box && box.width > 0 ? box.width : live.clientWidth || 720;
  const perPx = (25.4 / 96) * (vbW / Math.max(1, displayWidthMm));
  // The preview stroke lives in the SVG stylesheet. svg2pdf would keep that
  // pixel value and shrink it with the viewBox, so the file would not match
  // the screen. Drop the style and keep the computed width copied below.
  clone.querySelectorAll("style").forEach((node) => node.remove());
  const sources = [...live.querySelectorAll("*")].filter((el) => el.tagName.toLowerCase() !== "style");
  const copies = [...clone.querySelectorAll("*")];
  sources.forEach((src, index) => {
    const dst = copies[index];
    if (!(dst instanceof Element)) return;
    const style = getComputedStyle(src);
    const width = parseFloat(style.strokeWidth);
    if (style.stroke && style.stroke !== "none" && Number.isFinite(width) && width > 0) {
      dst.setAttribute("stroke", style.stroke);
      dst.setAttribute("stroke-width", String(Math.max(0.35, width * perPx)));
      dst.removeAttribute("vector-effect");
    }
    if (style.fill && style.fill !== "none") dst.setAttribute("fill", style.fill);
    if (src.tagName === "text") {
      const size = parseFloat(style.fontSize);
      dst.setAttribute("fill", style.fill && style.fill !== "none" ? style.fill : "#111111");
      dst.setAttribute("stroke", "none");
      if (Number.isFinite(size)) dst.setAttribute("font-size", String(size * perPx));
      dst.setAttribute("font-family", "Helvetica, Arial, sans-serif");
    }
  });
}

async function shrinkSvgImages(svg: SVGSVGElement) {
  const images = [...svg.querySelectorAll("image")];
  for (const image of images) {
    const href = image.getAttribute("href") || image.getAttribute("xlink:href") || "";
    if (!href) continue;
    const small = await rasterCap(href, 720);
    if (!small) continue;
    image.setAttribute("href", small);
    image.removeAttribute("xlink:href");
  }
}

export async function exportPdf(pages: HTMLElement[], filename: string): Promise<void> {
  const { jsPDF } = await import("jspdf");
  await import("svg2pdf.js");
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const drawSvg = (pdf as InstanceType<typeof jsPDF> & { svg: (element: SVGSVGElement, options: { x: number; y: number; width: number; height: number }) => Promise<unknown> }).svg.bind(pdf);
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-20000px";
  host.style.top = "0";
  document.body.appendChild(host);
  try {
    for (let index = 0; index < pages.length; index += 1) {
      if (index > 0) pdf.addPage();
      const page = pages[index];
      const box = page.getBoundingClientRect();
      const k = 210 / Math.max(1, box.width);
      const xOf = (left: number) => (left - box.left) * k;
      const yOf = (top: number) => (top - box.top) * k;
      const wOf = (width: number) => width * k;

      const mark = page.querySelector<HTMLImageElement>("img.a4-watermark");
      if (mark?.src) {
        const faded = await rasterCap(mark.src, 640, 0.07);
        const rect = mark.getBoundingClientRect();
        if (faded && rect.width > 1) pdf.addImage(faded, "PNG", xOf(rect.left), yOf(rect.top), wOf(rect.width), wOf(rect.height));
      }

      for (const svg of page.querySelectorAll("svg")) {
        const rect = svg.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) continue;
        const clone = svg.cloneNode(true) as SVGSVGElement;
        clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        paintForPdf(svg, clone, wOf(rect.width));
        await shrinkSvgImages(clone);
        host.appendChild(clone);
        await drawSvg(clone, { x: xOf(rect.left), y: yOf(rect.top), width: wOf(rect.width), height: wOf(rect.height) });
        clone.remove();
      }

      const logo = page.querySelector<HTMLImageElement>("img.a4-logo");
      if (logo?.src) {
        const data = await rasterCap(logo.src, 480);
        const rect = logo.getBoundingClientRect();
        if (data && rect.width > 1) pdf.addImage(data, "PNG", xOf(rect.left), yOf(rect.top), wOf(rect.width), wOf(rect.height));
      }

      pdf.setDrawColor(17, 17, 17);
      pdf.setLineWidth(0.15);
      for (const row of page.querySelectorAll("tr")) {
        const rect = row.getBoundingClientRect();
        if (rect.width < 2) continue;
        pdf.line(xOf(rect.left), yOf(rect.bottom), xOf(rect.right), yOf(rect.bottom));
      }

      for (const el of page.querySelectorAll("h1, h2, h3, p, th, td, figcaption, li, span, strong, em, a")) {
        if (el.closest("svg") || el.closest(".a4-watermark")) continue;
        if (!(el instanceof HTMLElement)) continue;
        const nodes = [...el.childNodes].filter((node): node is Text => node.nodeType === Node.TEXT_NODE);
        if (!nodes.some((node) => node.data.trim())) continue;
        const bold = el.matches("h1, h2, h3, th, strong") || Number.parseInt(getComputedStyle(el).fontWeight, 10) >= 600;
        const size = el.matches("h1") ? 13 : el.matches("h2, h3") ? 11 : 8;
        const fontPx = parseFloat(getComputedStyle(el).fontSize) || 12;
        pdf.setFont("helvetica", bold ? "bold" : "normal");
        pdf.setFontSize(size);
        pdf.setTextColor(17, 17, 17);
        for (const node of nodes) {
          for (const line of lineSlices(node)) {
            const shown = pdfSafeText(line.text);
            const x = xOf(line.left);
            const y = yOf(line.top) + size * 0.32;
            if (fitsWinAnsi(shown)) {
              pdf.text(shown, x, y);
              continue;
            }
            const widthPx = Math.max(4, line.right - line.left);
            const heightPx = Math.max(fontPx, line.bottom - line.top);
            const image = rasterLine(shown, fontPx, bold, widthPx, heightPx);
            if (!image) continue;
            pdf.addImage(image, "PNG", xOf(line.left), yOf(line.top), wOf(widthPx + 4), wOf(heightPx + 2));
          }
        }
      }
    }
  } finally {
    host.remove();
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
    canvas.width = width * 4;
    canvas.height = height * 4;
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
        const cells: (string | number)[] = [name, line.size, line.kind === "handle" || line.kind === "lock" || line.kind === "hardware" ? "—" : Number(line.area.toFixed(2))];
        if (options.include.amounts) cells.push(money(line.rate), money(line.amount));
        cells.forEach((value, index) => {
          sheet.getCell(row, index + 1).value = value;
        });
        row += 1;
      }
      if (options.include.amounts) {
        const total = lines.reduce((sum, line) => sum + line.amount, 0);
        sheet.getCell(row, 1).value = "Shower total";
        sheet.getCell(row, 5).value = money(total);
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
    sheet.getCell(row, 5).value = money(subtotal);
    sheet.getCell(row, 1).font = { bold: true };
    row += 1;
    sheet.getCell(row, 1).value = "GST 18%";
    sheet.getCell(row, 5).value = money(gst);
    row += 1;
    sheet.getCell(row, 1).value = "Grand total";
    sheet.getCell(row, 5).value = money(subtotal + gst);
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
