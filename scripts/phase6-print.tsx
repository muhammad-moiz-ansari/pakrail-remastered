import { readFileSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import TicketPrint, {
  TicketDocumentView,
} from "../src/components/ticket-print";
import { ticketDocument } from "../src/lib/ticket-document";
const booking = JSON.parse(
  readFileSync(".local/phase6/ticket-fixture.json", "utf8"),
);
const ticket = ticketDocument(booking);
if (!ticket) throw Error("Invalid fixture");
assert.equal(renderToStaticMarkup(createElement(TicketPrint, { booking })), "");
const logo = readFileSync("public/logo.png").toString("base64");
const markup = renderToStaticMarkup(
  createElement(TicketDocumentView, { ticket }),
).replace('src="/logo.png"', `src="data:image/png;base64,${logo}"`);
const css = readFileSync("src/app/ticket-print.css", "utf8");
writeFileSync(
  ".local/phase6/ticket.html",
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Phase 6 synthetic fixture - ticket print QA</title><style>${css}</style></head><body><div><p>Explicit synthetic QA fixture. No provider payment.</p><button onclick="window.print()">Print QA ticket</button></div>${markup}</body></html>`,
);
writeFileSync(
  ".local/phase6/ticket-screen.html",
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Phase 6 print CSS screen emulation</title><style>${css.replace("@media print", "@media all")}</style></head><body>${markup}</body></html>`,
);
console.log(
  "Rendered existing ticket component and CSS from synthetic QA snapshot; no private contact fields included.",
);
