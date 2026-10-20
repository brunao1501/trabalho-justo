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
// Conservative Helvetica width estimates keep text inside its column.
// Accented Portuguese letters share the width of their base letter.
export function textWidth(text: string, size = 10): number {
  const narrow = "ilI.,:;!'|";
  const wide = "MW@%";
  return Array.from(text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")).reduce((sum,c) =>
    sum + (c === " " ? .29 : narrow.includes(c) ? .30 : wide.includes(c) ? 1 : /[A-Z]/.test(c) ? .75 : .60) * size, 0);
}
export function wrapText(text: string, width: number, size = 10): string[] {
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r/g, "").split("\n")) {
    let line = "";
    for (const word of paragraph.trim().split(/\s+/)) {
      if (!word) continue;
      if (line && textWidth(line + " " + word, size) > width) { lines.push(line); line = ""; }
      for (const char of word) {
        if (line && textWidth(line + char, size) > width) { lines.push(line); line = ""; }
        line += char;
      }
      line += " ";
      line = line.trimEnd() + " ";
    }
    lines.push(line.trimEnd());
  }
  return lines;
}
export function generateQuotePdf(q: Quote): Uint8Array {
  quoteLines(q); // Validate required commercial fields; private planning data is never used.
  const totals = quoteTotals(q);
  const green = "0.082 0.247 0.208", muted = "0.34 0.42 0.36";
  const ink = "0.125 0.23 0.204", cream = "0.965 0.973 0.949", lime = "0.843 0.957 0.541";
  const pages: string[] = [];
  let commands: string[] = [], y = 0;
  function rect(x:number, top:number, width:number, height:number, color:string) {
    commands.push(color + " rg " + x + " " + (842-top-height) + " " + width + " " + height + " re f");
  }
  function text(value:string, x:number, top:number, size=10, bold=false, color=ink) {
    commands.push("BT /" + (bold?"F2":"F1") + " " + size + " Tf " + color + " rg 1 0 0 1 " + x + " " + (842-top-size) + " Tm (" + pdfText(value) + ") Tj ET");
  }
  function line(top:number) { rect(44,top,507,.6,"0.86 0.89 0.84"); }
  function startPage() {
    commands = [];
    const first = pages.length === 0;
    rect(0,0,595,first?114:80,green);
    rect(44,first?29:23,22,5,lime); rect(44,first?40:34,22,5,lime);
    text("trabalho justo",77,first?23:18,20,true,"1 1 1");
    text("Seu tempo tem valor.",78,first?49:45,9,false,"0.80 0.87 0.81");
    if(first) { text("ORÇAMENTO DE SERVIÇO",44,80,12,true,"1 1 1"); }
    y = first?132:98;
  }
  function finishPage() { pages.push(commands.join("\n")); }
  function ensure(height:number) {
    if(y+height > 771) { finishPage(); startPage(); }
  }
  function block(label:string, value:string) {
    const lines = wrapText(value,479,10);
    let offset=0;
    while(offset<lines.length) {
      ensure(58);
      const room=Math.max(1,Math.floor((771-y-43)/14));
      const part=lines.slice(offset,offset+room);
      const height=29+part.length*14;
      rect(44,y,507,height,cream); rect(44,y,3,height,"0.69 0.79 0.58");
      text(label+(offset?" (continuação)":""),58,y+10,8,true,muted);
      part.forEach((v,i)=>text(v,58,y+26+i*14,10));
      y+=height+9;offset+=part.length;
    }
  }
  startPage();
  // A calm metadata strip replaces the old typewriter-like report.
  const numberLines=wrapText(q.number,260,9);
  const dateLines=wrapText(q.date,175,9);
  const metaHeight=18+Math.max(numberLines.length,dateLines.length)*12;
  text("NÚMERO DO ORÇAMENTO",44,y,7.5,true,muted);
  text("DATA DE EMISSÃO",350,y,7.5,true,muted);
  numberLines.forEach((v,i)=>text(v,44,y+14+i*12,9,true));
  dateLines.forEach((v,i)=>text(v,350,y+14+i*12,9));
  y+=metaHeight+17;
  const professional=wrapText(q.professional,217,11);
  const contact=wrapText(q.contact,217,9);
  const client=wrapText(q.client,217,11);
  const partyHeight=Math.max(28+professional.length*15+contact.length*13,28+client.length*15)+12;
  ensure(partyHeight+12);
  rect(44,y,247,partyHeight,cream);rect(304,y,247,partyHeight,cream);
  text("QUEM PRESTA O SERVIÇO",58,y+11,7.5,true,muted);
  professional.forEach((v,i)=>text(v,58,y+28+i*15,11,true));
  contact.forEach((v,i)=>text(v,58,y+31+professional.length*15+i*13,9,false,muted));
  text("PREPARADO PARA",318,y+11,7.5,true,muted);
  client.forEach((v,i)=>text(v,318,y+28+i*15,11,true));
  y+=partyHeight+16;
  block("SERVIÇO",q.service);
  block("O QUE ESTÁ INCLUÍDO",q.scope);
  const rows: [string,number][] = q.detailed ? [
    ["Mão de obra / serviço",totals.labor],["Materiais",totals.materials],
    ["Deslocamento",totals.transport],["Outros gastos",totals.other]
  ] : [["Serviço completo",totals.subtotal]];
  // Keep the price table and total together, including across page boundaries.
  ensure(32+rows.length*22+46+64);
  text("INVESTIMENTO NO SERVIÇO",44,y,9,true,muted);y+=20;
  rows.forEach(([label,amount],i)=>{
    if(i%2===0)rect(44,y-3,507,22,cream);
    text(label,56,y+2,10);const amountText=money(amount);
    text(amountText,537-textWidth(amountText,10),y+2,10,true);y+=22;
  });
  line(y+2);y+=10;
  text("Subtotal",56,y,9,false,muted);const sub=money(totals.subtotal);
  text(sub,537-textWidth(sub,9),y,9);y+=16;
  const discountLabel="Desconto ("+q.discount.toLocaleString("pt-BR")+"%)";
  text(discountLabel,56,y,9,false,muted);const discounted="- "+money(totals.discount);
  text(discounted,537-textWidth(discounted,9),y,9);y+=20;
  rect(44,y,507,55,green);text("TOTAL A PAGAR",59,y+12,8,true,"0.84 0.91 0.84");
  const totalText=money(totals.total);
  const totalSize=Math.min(23,390/Math.max(1,textWidth(totalText,1)));
  text(totalText,59,y+26,totalSize,true,"1 1 1");y+=67;
  const conditions = [
    {label:"PRAZO",value:q.deadline},
    {label:"PAGAMENTO",value:q.payment},
    {label:"VALIDADE",value:q.validity}
  ];
  const conditionLines=conditions.map(c=>wrapText(c.value,143,9));
  if(conditionLines.every(lines=>lines.length<=4)) {
    const height=35+Math.max(...conditionLines.map(lines=>lines.length))*13;
    ensure(height+9);
    conditions.forEach((c,i)=>{
      const x=44+i*173;rect(x,y,161,height,cream);
      text(c.label,x+9,y+10,7,true,muted);
      conditionLines[i].forEach((v,j)=>text(v,x+9,y+27+j*13,9));
    });y+=height+9;
  } else {
    block("PRAZO E AGENDAMENTO",q.deadline);
    block("CONDIÇÕES DE PAGAMENTO",q.payment);
    block("VALIDADE DO ORÇAMENTO",q.validity);
  }
  if(q.notes.trim())block("OBSERVAÇÕES",q.notes);
  if(y+27<=771) {
    text("Confirme com o profissional para combinar o início.",44,y,8,false,muted);y+=13;
    text("Execução sujeita à aprovação e ao agendamento.",44,y,8,false,muted);
  }
  finishPage();
  const objects: string[] = [];
  objects[1]="<< /Type /Catalog /Pages 2 0 R >>";
  objects[2]="<< /Type /Pages /Count "+pages.length+" /Kids ["+pages.map((_,i)=>(5+i*2)+" 0 R").join(" ")+"] >>";
  objects[3]="<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objects[4]="<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
  pages.forEach((page,i)=>{
    const footer="\n0.86 0.89 0.84 rg 44 55 507 0.6 re f\n"+
      "BT /F1 8 Tf "+muted+" rg 1 0 0 1 44 38 Tm ("+pdfText("Trabalho Justo | Este orçamento não é nota fiscal.")+") Tj ET\n"+
      "BT /F1 8 Tf "+muted+" rg 1 0 0 1 463 38 Tm ("+pdfText("Página "+(i+1)+" de "+pages.length)+") Tj ET";
    const content=page+footer, pageId=5+i*2;
    objects[pageId]="<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents "+(pageId+1)+" 0 R >>";
    objects[pageId+1]="<< /Length "+content.length+" >>\nstream\n"+content+"\nendstream";
  });
  let pdf="%PDF-1.4\n";const offsets=[0];
  for(let i=1;i<objects.length;i++){offsets[i]=pdf.length;pdf+=i+" 0 obj\n"+objects[i]+"\nendobj\n";}
  const xref=pdf.length;pdf+="xref\n0 "+objects.length+"\n0000000000 65535 f \n";
  for(let i=1;i<objects.length;i++)pdf+=String(offsets[i]).padStart(10,"0")+" 00000 n \n";
  pdf+="trailer\n<< /Size "+objects.length+" /Root 1 0 R >>\nstartxref\n"+xref+"\n%%EOF\n";
  return Uint8Array.from(pdf,c=>c.charCodeAt(0));
}
