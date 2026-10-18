import { useState } from "react";
import ShowerFigure from "./scene";
import { exportExcel, exportPdf, fileBase, printQuote, type PrintInclude } from "./exportQuote";
import {
  BRAND_LOGO,
  EXTRA_LABEL,
  GST_RATE,
  actualSqFt,
  ceilingFinish,
  ceilingModuleMm,
  eachItem,
  elevationShower,
  formatLength,
  legMaterialLabel,
  handleOptionName,
  handleSizeText,
  hardwareColourLabel,
  inr,
  productGlassAmount,
  productRate,
  profileLabel,
  quoteSubtotal,
  showerAmount,
  sizeLabel,
  splitMarks,
  stripMarks,
  sqmFromSqFt,
  todayLabel,
  wastageAmountOf,
  wastageExtraSqFt,
  type CompanyProfile,
  type CustomerDetails,
  type FileNameMode,
  type PlacedItem,
  type QuoteEntry,
  type Shower,
  type UnitId,
} from "./model";

const INCLUDE_ALL: PrintInclude = {
  elevation: true,
  plan: true,
  details: true,
  amounts: true,
  handleName: true,
  handlePhoto: true,
  lockName: true,
  terms: true,
};

interface QuoteDocumentProps {
  rows: QuoteEntry[];
  unit: UnitId;
  company: CompanyProfile;
  customer: CustomerDetails;
  quoteNo: string;
  fileMode: FileNameMode;
  onCompany: (profile: CompanyProfile) => void;
  onCustomer: (customer: CustomerDetails) => void;
  onQuoteNo: (value: string) => void;
  onFileMode: (mode: FileNameMode) => void;
  onClose: () => void;
}

export default function QuoteDocument({
  rows,
  unit,
  company,
  customer,
  quoteNo,
  fileMode,
  onCompany,
  onCustomer,
  onQuoteNo,
  onFileMode,
  onClose,
}: QuoteDocumentProps) {
  const [busy, setBusy] = useState("");
  const [include, setInclude] = useState<PrintInclude>(INCLUDE_ALL);
  const date = todayLabel();
  const pages = pageBodies({ rows, unit, company, customer, quoteNo, date, include });
  const base = fileBase(fileMode, customer.name, quoteNo);

  async function onPdf() {
    const nodes = [...document.querySelectorAll<HTMLElement>(".a4-page")];
    if (!nodes.length) return;
    setBusy("pdf");
    try {
      await exportPdf(nodes, base);
    } finally {
      setBusy("");
    }
  }

  async function onExcel() {
    const figures = [...document.querySelectorAll<SVGSVGElement>("svg[data-export]")];
    setBusy("excel");
    try {
      await exportExcel({ filename: base, company, customer, quoteNo, rows, unit, figures, include });
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="doc-root" data-testid="quote-preview">
      <div className="doc-tools no-print">
        <div className="doc-tools-head">
          <div>
            <p className="eyebrow">A4 quote</p>
            <h2>Generate quote</h2>
          </div>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="doc-form">
          <section>
            <h3>Company</h3>
            <label className="stack">
              Logo
              <input
                data-testid="logo-upload"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  void readLogo(file).then((logo) => onCompany({ ...company, logo }));
                }}
              />
            </label>
            <label className="stack">
              Company name
              <input data-testid="company-name" value={company.name} onChange={(event) => onCompany({ ...company, name: event.target.value })} />
            </label>
            <div className="edge-checks">
              <label className="check">
                <input data-testid="mark-tm" type="checkbox" checked={company.markTm} onChange={(event) => onCompany({ ...company, markTm: event.target.checked })} />
                TM
              </label>
              <label className="check">
                <input data-testid="mark-reg" type="checkbox" checked={company.markReg} onChange={(event) => onCompany({ ...company, markReg: event.target.checked })} />
                ®
              </label>
            </div>
            <label className="stack">
              Address
              <textarea rows={2} value={company.address} onChange={(event) => onCompany({ ...company, address: event.target.value })} />
            </label>
            <div className="field-row">
              <label className="stack">
                GST
                <input
                  data-testid="company-gst"
                  value={company.gst}
                  onChange={(event) => onCompany({ ...company, gst: event.target.value.toUpperCase() })}
                  style={{ textTransform: "uppercase" }}
                />
              </label>
              <label className="stack">
                Email
                <input value={company.email} onChange={(event) => onCompany({ ...company, email: event.target.value })} />
              </label>
            </div>
            <label className="stack">
              Website
              <input value={company.website} onChange={(event) => onCompany({ ...company, website: event.target.value })} />
            </label>
          </section>
          <section>
            <h3>Customer</h3>
            <label className="stack">
              Customer name
              <input data-testid="customer-name" value={customer.name} onChange={(event) => onCustomer({ ...customer, name: event.target.value })} />
            </label>
            <label className="stack">
              Address
              <textarea data-testid="customer-address" rows={2} value={customer.address} onChange={(event) => onCustomer({ ...customer, address: event.target.value })} />
            </label>
            <div className="field-row">
              <label className="stack">
                Contact person
                <input value={customer.contact} onChange={(event) => onCustomer({ ...customer, contact: event.target.value })} />
              </label>
              <label className="stack">
                Customer GST
                <input value={customer.gst} onChange={(event) => onCustomer({ ...customer, gst: event.target.value.toUpperCase() })} style={{ textTransform: "uppercase" }} />
              </label>
            </div>
            <div className="field-row">
              <label className="stack">
                Quote number
                <input data-testid="quote-number" value={quoteNo} onChange={(event) => onQuoteNo(event.target.value)} />
              </label>
              <label className="stack">
                Date
                <input data-testid="quote-date" value={date} readOnly />
              </label>
            </div>
            <fieldset className="file-mode">
              <legend>Download file name</legend>
              <label className="check">
                <input data-testid="filename-customer" type="radio" name="file-mode" checked={fileMode === "customer"} onChange={() => onFileMode("customer")} />
                Customer name
              </label>
              <label className="check">
                <input data-testid="filename-quote" type="radio" name="file-mode" checked={fileMode === "quote"} onChange={() => onFileMode("quote")} />
                Quote number
              </label>
            </fieldset>
          </section>
          <section>
            <h3>Description, terms, and bank</h3>
            <label className="stack">
              Quote description
              <textarea data-testid="quote-description" rows={4} value={company.description} onChange={(event) => onCompany({ ...company, description: event.target.value })} />
            </label>
            <label className="stack">
              Terms
              <textarea rows={5} value={company.terms} onChange={(event) => onCompany({ ...company, terms: event.target.value })} />
            </label>
            <p className="hint">Use *bold* or **bold** in the terms and in a shower note. Both print in bold.</p>
            <fieldset className="include-ticks">
              <legend>Include in the file</legend>
              {(
                [
                  ["elevation", "Design / elevation"],
                  ["plan", "Plan"],
                  ["details", "Details"],
                  ["amounts", "Amounts"],
                  ["handleName", "Handle name"],
                  ["handlePhoto", "Handle photo"],
                  ["lockName", "Lock name"],
                  ["terms", "Terms"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="check">
                  <input
                    data-testid={`include-${key}`}
                    type="checkbox"
                    checked={include[key]}
                    onChange={(event) => setInclude((current) => ({ ...current, [key]: event.target.checked }))}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <label className="stack">
              Bank details
              <textarea rows={3} value={company.bank} onChange={(event) => onCompany({ ...company, bank: event.target.value })} />
            </label>
          </section>
        </div>
        <div className="doc-actions">
          <button type="button" className="primary" data-testid="print-quote" onClick={printQuote}>
            Print
          </button>
          <button type="button" data-testid="excel-quote" onClick={() => void onExcel()} disabled={busy !== ""}>
            {busy === "excel" ? "Preparing Excel…" : "Excel"}
          </button>
          <button type="button" data-testid="pdf-quote" onClick={() => void onPdf()} disabled={busy !== ""}>
            {busy === "pdf" ? "Preparing PDF…" : "PDF"}
          </button>
          <span className="hint">File: {base}.pdf / {base}.xlsx</span>
        </div>
      </div>
      <div className="doc-pages">
        {pages.map((page, index) => (
          <article key={page.key} className="a4-page" data-testid="a4-page">
            {index === 0 ? <PageHead company={company} /> : null}
            <div className="a4-body">{page.body}</div>
            <PageMark company={company} />
            <footer className="a4-foot">
              <span data-testid="doc-footer">This is a computer generated document</span>
              <a data-testid="app-link" href="https://www.allukraft.com">
                ALLUKRAFT<sup>™</sup> Bath Studio
              </a>
              <span data-testid="page-number">
                Page {index + 1} of {pages.length}
              </span>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}

function PageHead({ company }: { company: CompanyProfile }) {
  return (
    <header className="a4-head" data-testid="company-header">
      <img src={company.logo || BRAND_LOGO} alt="" className="a4-logo" data-testid="quote-logo" />
      <div>
        <strong data-testid="company-title">
          <CompanyMark company={company} />
        </strong>
        {company.address && <p>{company.address}</p>}
        <p>
          {[company.gst && `GST ${company.gst}`, company.email, company.website].filter(Boolean).join(" · ")}
        </p>
      </div>
    </header>
  );
}

function CompanyMark({ company, fallback = "Company" }: { company: CompanyProfile; fallback?: string }) {
  const name = stripMarks(company.name) || fallback;
  return (
    <>
      {name}
      {company.markTm ? <sup>™</sup> : null}
      {company.markReg ? <sup>®</sup> : null}
    </>
  );
}

function oneLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function PageMark({ company }: { company: CompanyProfile }) {
  return <img src={company.logo || BRAND_LOGO} alt="" className="a4-watermark" data-testid="logo-watermark" />;
}

function pageBodies({
  rows,
  unit,
  company,
  customer,
  quoteNo,
  date,
  include,
}: {
  rows: QuoteEntry[];
  unit: UnitId;
  company: CompanyProfile;
  customer: CustomerDetails;
  quoteNo: string;
  date: string;
  include: PrintInclude;
}) {
  const subtotal = quoteSubtotal(rows);
  const gst = subtotal * GST_RATE;
  const pages = [
    {
      key: "cover",
      body: <CoverPage customer={customer} quoteNo={quoteNo} date={date} description={company.description} />,
    },
    ...[...rows].sort((a, b) => a.serial - b.serial).flatMap((entry) => [
      {
        key: `shower-${entry.serial}`,
        body: <ProductPage entry={entry} unit={unit} company={company} include={include} />,
      },
    ]),
    {
      key: "close",
      body: (
        <ClosePage
          company={company}
          customer={customer}
          include={include}
          subtotal={subtotal}
          gst={gst}
          grand={subtotal + gst}
        />
      ),
    },
  ];
  return pages;
}

function CoverPage({
  customer,
  quoteNo,
  date,
  description,
}: {
  customer: CustomerDetails;
  quoteNo: string;
  date: string;
  description: string;
}) {
  return (
    <div className="cover-page" data-testid="cover-page">
      <div className="party-grid">
        <div className="quote-meta">
          <p className="eyebrow">Quotation {quoteNo}</p>
          <p className="doc-date" data-testid="shown-date">Date {date}</p>
        </div>
        <div className="customer-block" data-testid="customer-block">
          <p data-testid="customer-name-line">
            <strong>M/s {oneLine(customer.name) || "—"}</strong>
          </p>
          {oneLine(customer.address) ? <p>{oneLine(customer.address)}</p> : null}
          {oneLine(customer.contact) ? <p>Contact: {oneLine(customer.contact)}</p> : null}
          {oneLine(customer.gst) ? <p>GST: {oneLine(customer.gst)}</p> : null}
        </div>
      </div>
      <h3 className="doc-title">Description</h3>
      <p className="terms cover-desc" data-testid="quote-description-text">
        <Rich text={description || "—"} />
      </p>
    </div>
  );
}

function ProductPage({
  entry,
  unit,
  company,
  include,
}: {
  entry: QuoteEntry;
  unit: UnitId;
  company: CompanyProfile;
  include: PrintInclude;
}) {
  const shower = entry.shower;
  const area = actualSqFt(shower);
  const waste = wastageExtraSqFt(shower);
  const glass = shower.material.glass;
  const doors = eachItem(shower).filter((row) => row.item.kind === "door");
  return (
    <div className="product-page" data-testid="product-page">
      <h3 className="doc-title" data-testid="product-title">S.No {entry.serial}{shower.location.trim() ? ` · ${shower.location.trim()}` : ""}</h3>
      <div className="quote-pair" data-testid="quote-drawings">
        <div className="quote-left">
          {include.elevation && (
            <figure className="quote-front" data-testid="elevation-square">
              <figcaption>Elevation</figcaption>
              <ShowerFigure
                shower={shower}
                unit={unit}
                width={720}
                height={640}
                mode="elevation"
                watermark={company.logo || BRAND_LOGO}
                exportAs={`elevation-${entry.serial}`}
              />
            </figure>
          )}
          {include.elevation && shower.sides.map((side) => (
            <figure key={side.id} className="quote-return" data-testid="return-square">
              <figcaption>{side.name}</figcaption>
              <ShowerFigure
                shower={elevationShower(shower, side)}
                unit={unit}
                width={720}
                height={640}
                mode="elevation"
                watermark={company.logo || BRAND_LOGO}
                exportAs={`return-${entry.serial}-${side.id}`}
                dimScope={side.id}
              />
            </figure>
          ))}
          {shower.ceiling.enabled && (
            <figure className="quote-ceiling" data-testid="ceiling-square">
              <figcaption>Ceiling · {ceilingFinish(shower.ceiling).name} · module {formatLength(ceilingModuleMm(shower.ceiling), unit)} {unit}</figcaption>
              <ShowerFigure
                shower={shower}
                unit={unit}
                width={720}
                height={480}
                mode="plan"
                watermark={company.logo || BRAND_LOGO}
                highlightCeiling
              />
            </figure>
          )}
        </div>
        {include.plan && (
          <figure className="quote-plan" data-testid="plan-square">
            <figcaption>Plan</figcaption>
            <ShowerFigure
              shower={shower}
              unit={unit}
              width={720}
              height={640}
              mode="plan"
              watermark={company.logo || BRAND_LOGO}
              exportAs={`plan-${entry.serial}`}
              highlightIds={shower.sides.map((side) => side.id)}
              highlightCeiling={shower.ceiling.enabled}
            />
          </figure>
        )}
      </div>
      <div className="spec-split" data-testid="details-block">
        {include.details && (
          <table className="bill spec-table" data-testid="spec-table">
            <tbody>
              <tr>
                <th>Location</th>
                <td>{shower.location.trim() || "—"}</td>
              </tr>
              {shower.product === "cubicle" ? (
                <>
                  <tr data-testid="spec-hpl">
                    <th>Panels</th>
                    <td>HPL</td>
                  </tr>
                  <tr data-testid="spec-gap">
                    <th>Bottom gap</th>
                    <td>{formatLength(shower.cubicle.gap, unit)} {unit}</td>
                  </tr>
                  <tr data-testid="spec-legs">
                    <th>Legs</th>
                    <td>{shower.cubicle.legQty} × {formatLength(shower.cubicle.legHeight, unit)} {unit} · {legMaterialLabel(shower.cubicle)}</td>
                  </tr>
                  <tr data-testid="spec-rail">
                    <th>Top rail</th>
                    <td>{shower.cubicle.railMaterial} · {formatLength(shower.width, unit)} {unit}</td>
                  </tr>
                </>
              ) : (
                <tr>
                  <th>Glass</th>
                  <td>{[glass.thickness && `${glass.thickness} mm`, glass.colour, glass.brand, glass.tough === "nontough" ? "Non-toughened" : "Toughened glass"].filter(Boolean).join(" · ") || "—"}</td>
                </tr>
              )}
              <tr>
                <th>Profiles</th>
                <td>{shower.product === "cubicle" ? "Slim edge" : `${profileLabel(shower.material)} · ${shower.material.colour} · ${shower.material.origin}`}</td>
              </tr>
              <tr>
                <th>Doors</th>
                <td>
                  {doors.length
                    ? doors.map((row) => `${row.runId === "front" ? "" : `${row.runName} `}${row.item.doorStyle === "sliding" ? "Sliding" : "Openable"} ${formatDoor(row.item, unit)}`).join("; ")
                    : "—"}
                </td>
              </tr>
              <tr>
                <th>Hardwares</th>
                <td>{hardwareRows(shower, unit, include)}</td>
              </tr>
              <tr>
                <th>Area</th>
                <td>{area.toFixed(2)} sq ft · {sqmFromSqFt(area).toFixed(2)} sq m</td>
              </tr>
              <tr>
                <th>Wastage</th>
                <td>{waste.toFixed(2)} sq ft · {sqmFromSqFt(waste).toFixed(2)} sq m</td>
              </tr>
              {shower.extraWork.kind !== "none" && (
                <tr data-testid="extra-work-line">
                  <th>Extra work</th>
                  <td>{EXTRA_LABEL[shower.extraWork.kind]} · {shower.extraWork.areaSqFt.toFixed(2)} sq ft · {inr(shower.extraWork.amount)}</td>
                </tr>
              )}
              <tr>
                <th>Notes</th>
                <td><Rich text={shower.notes.trim() || "—"} /></td>
              </tr>
            </tbody>
          </table>
        )}
        <div className="amount-stack">
          <table className="bill amount-table" data-testid="amount-table">
            <tbody>
              <tr data-testid="qty-table">
                <th>Qty</th>
                <td>1</td>
              </tr>
              {include.amounts && (
                <>
                  <tr>
                    <th>Rate / sq ft</th>
                    <td>{inr(productRate(shower))}</td>
                  </tr>
                  <tr>
                    <th>Actual area</th>
                    <td>{area.toFixed(2)} sq ft</td>
                  </tr>
                  <tr data-testid="package-line">
                    <th>Amount</th>
                    <td>{inr(productGlassAmount(shower))}</td>
                  </tr>
                  <tr data-testid="wastage-line">
                    <th>Wastage</th>
                    <td>{inr(wastageAmountOf(shower))}</td>
                  </tr>
                  <tr>
                    <th>Product total</th>
                    <td>{inr(showerAmount(shower))}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="doc-spec">{sizeLabel(shower, unit)}</p>
    </div>
  );
}

function ClosePage({
  company,
  customer,
  include,
  subtotal,
  gst,
  grand,
}: {
  company: CompanyProfile;
  customer: CustomerDetails;
  include: PrintInclude;
  subtotal: number;
  gst: number;
  grand: number;
}) {
  return (
    <div className="close-page" data-testid="close-page">
      {include.amounts && (
        <div className="totals-wrap">
          <table className="bill totals-table" data-testid="totals-table">
            <tbody>
              <tr>
                <th>Subtotal</th>
                <td>{inr(subtotal)}</td>
              </tr>
              <tr>
                <th>GST 18%</th>
                <td data-testid="gst-amount">{inr(gst)}</td>
              </tr>
              <tr className="grand">
                <th>Grand total</th>
                <td data-testid="grand-total">{inr(grand)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      {include.terms && (
        <>
          <h3 className="doc-title">Terms</h3>
          <p className="terms">
            <Rich text={company.terms} />
          </p>
        </>
      )}
      <h3 className="doc-title">Bank details</h3>
      <p className="terms">{company.bank || "—"}</p>
      <div className="sign-row" data-testid="sign-row">
        <div className="sign-col">
          <p>
            For <CompanyMark company={company} />
          </p>
          <span className="sign-line" />
          <p>Authorised signatory</p>
        </div>
        <div className="sign-col">
          <p>For M/s {oneLine(customer.name) || "—"}</p>
          <span className="sign-line" />
          <p>Accepted</p>
        </div>
      </div>
    </div>
  );
}

function formatDoor(item: PlacedItem, unit: UnitId): string {
  const fill = item.doorFillName.trim() ? ` · ${item.doorFillName.trim()}` : "";
  return `${formatLength(item.width, unit)} × ${formatLength(item.height, unit)} ${unit}${fill}`;
}

function hardwareRows(shower: Shower, unit: UnitId, include: PrintInclude): string {
  const doors = eachItem(shower).filter((row) => row.item.kind === "door");
  if (!doors.length) return "—";
  const colour = hardwareColourLabel(shower.material);
  return doors
    .map((row) => {
      const item = row.item;
      const place = row.runId === "front" ? "" : `${row.runName}: `;
      if (item.doorStyle === "openable") {
        const handle = item.handleKind !== "none" && include.handleName ? `, ${handleOptionName(item)}` : "";
        return `${place}${item.hingeName} × ${item.hingeCount}, ${colour}${handle}`;
      }
      const handle = include.handleName ? handleOptionName(item) : "Handle";
      return `${place}Wheel ${item.wheelName.trim() || "wheel"}, soft-closing ${item.softClose ? "yes" : "no"}, ${handle}, ${handleSizeText(item, unit)}, ${colour}`;
    })
    .join("; ");
}

function Rich({ text }: { text: string }) {
  return (
    <>
      {splitMarks(text).map((part, index) =>
        part.bold ? <strong key={index}>{part.text}</strong> : <span key={index}>{part.text}</span>,
      )}
    </>
  );
}

function readLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("logo"));
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const max = 1400;
        const scale = Math.min(1, max / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      image.onerror = () => resolve(String(reader.result));
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
