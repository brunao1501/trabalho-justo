export type Quote = {
  number: string; date: string; professional: string; contact: string; client: string;
  service: string; scope: string; deadline: string; payment: string; validity: string;
  notes: string; detailed: boolean; price: number; discount: number;
  materials: number; transport: number; other: number;
};
export function quoteTotals(q: Quote) {
  for (const value of [q.price, q.discount, q.materials, q.transport, q.other]) {
    if (!Number.isFinite(value) || value < 0) throw Error("Confira os valores da calculadora.");
  }
  if (q.discount > 100) throw Error("O desconto não pode ultrapassar 100%.");
  const subtotal = Math.round(q.price * 100);
  const discount = Math.round(subtotal * q.discount / 100);
  const materials = Math.round(q.materials * 100);
  const transport = Math.round(q.transport * 100);
  const other = Math.round(q.other * 100);
  const labor = subtotal - materials - transport - other;
  if (q.detailed && labor < 0) throw Error("Para detalhar, o preço deve cobrir os gastos informados. Ajuste o preço ou escolha valor único.");
  return { subtotal, discount, total: subtotal - discount, materials, transport, other, labor };
}
const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export function quoteLines(q: Quote): string[] {
  if (![q.professional, q.contact, q.client, q.service, q.scope, q.deadline, q.payment, q.validity, q.number, q.date].every(s => s.trim())) {
    throw Error("Preencha os dados obrigatórios do orçamento.");
  }
  const t = quoteTotals(q);
  return [
    "ORÇAMENTO DE SERVIÇO", "Trabalho Justo | Seu tempo tem valor.", "",
    "Orçamento: " + q.number, "Emissão: " + q.date, "",
    "PROFISSIONAL / EMPRESA", q.professional, "Contato: " + q.contact, "",
    "CLIENTE", q.client, "", "SERVIÇO", q.service, "",
    "O QUE ESTÁ INCLUÍDO", q.scope, "", "PRAZO DE EXECUÇÃO", q.deadline, "",
    "VALORES",
    ...(q.detailed ? [
      "Mão de obra / serviço: " + money(t.labor),
      "Materiais: " + money(t.materials), "Deslocamento: " + money(t.transport),
      "Outros gastos: " + money(t.other)
    ] : ["Serviço completo: " + money(t.subtotal)]),
    "Subtotal: " + money(t.subtotal),
    "Desconto (" + q.discount + "%): " + money(t.discount),
    "TOTAL A PAGAR: " + money(t.total), "",
    "CONDIÇÕES DE PAGAMENTO", q.payment, "",
    "VALIDADE DO ORÇAMENTO", q.validity,
    ...(q.notes.trim() ? ["", "OBSERVAÇÕES", q.notes] : []),
    "", "Execução sujeita à aprovação do cliente e ao agendamento.",
    "Este orçamento não é nota fiscal."
  ];
}
// PDF text uses Windows-1252 standard fonts. Unsupported symbols become ?.
// Every text byte is an octal escape: user input cannot inject PDF operators.
function pdfText(s: string): string {
  const extra: Record<string, number> = { "€":128, "‘":145, "’":146, "“":147, "”":148, "–":150, "—":151, "•":149, "…":133 };
  return Array.from(s.normalize("NFC")).map(c => {
    const n = c.charCodeAt(0);
    const byte = extra[c] ?? (n >= 32 && n <= 255 ? n : 63);
    return "\\" + byte.toString(8).padStart(3, "0");
  }).join("");
}
export function wrapLine(text: string, width = 82): string[] {
  const result: string[] = [];
  for (const paragraph of text.replace(/\r/g, "").split("\n")) {
    const words = paragraph.trim().split(/\s+/);
    let line = "";
    for (let word of words) {
      while (word.length > width) {
        if (line) { result.push(line); line = ""; }
        result.push(word.slice(0, width)); word = word.slice(width);
      }
      if (!word) continue;
      if (line && line.length + word.length + 1 > width) { result.push(line); line = ""; }
      line += (line ? " " : "") + word;
    }
    result.push(line);
  }
  return result;
}
export function generateQuotePdf(q: Quote): Uint8Array {
  const lines = quoteLines(q).flatMap(line => wrapLine(line));
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += 42) pages.push(lines.slice(i, i + 42));
  const objects: string[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = "<< /Type /Pages /Count " + pages.length + " /Kids [" + pages.map((_,i) => (5 + i * 2) + " 0 R").join(" ") + "] >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
  pages.forEach((page,i) => {
    const pageId = 5 + i * 2, contentId = pageId + 1;
    const content = "0.08 0.25 0.21 rg 0 790 595 52 re f\n" +
      "BT /F2 16 Tf 1 1 1 rg 45 809 Td (" + pdfText("trabalho justo") + ") Tj ET\n" +
      "BT /F1 10 Tf 0.12 0.2 0.17 rg 45 760 Td 16 TL\n" +
      page.map((line,index) => (index ? "T* " : "") + "(" + pdfText(line) + ") Tj").join("\n") +
      "\nET\nBT /F1 9 Tf 0.35 0.4 0.35 rg 45 40 Td (" + pdfText("Página " + (i+1) + " de " + pages.length) + ") Tj ET";
    objects[pageId] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents " + contentId + " 0 R >>";
    objects[contentId] = "<< /Length " + content.length + " >>\nstream\n" + content + "\nendstream";
  });
  let pdf = "%PDF-1.4\n", offsets = [0];
  for (let i=1;i<objects.length;i++) {
    offsets[i] = pdf.length; pdf += i + " 0 obj\n" + objects[i] + "\nendobj\n";
  }
  const xref = pdf.length;
  pdf += "xref\n0 " + objects.length + "\n0000000000 65535 f \n";
  for(let i=1;i<objects.length;i++) pdf += String(offsets[i]).padStart(10,"0") + " 00000 n \n";
  pdf += "trailer\n<< /Size " + objects.length + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF\n";
  return Uint8Array.from(pdf, c => c.charCodeAt(0));
}
