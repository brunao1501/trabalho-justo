import { test } from "node:test";
import assert from "node:assert/strict";
import {generateQuotePdf,quoteLines,quoteTotals,wrapLine,type Quote} from "../src/quotePdf.ts";
const q:Quote={number:"TJ-001",date:"20/10/2026",professional:"João",contact:"joao@example.com",client:"Márcia",service:"Pintura",scope:"Preparação e pintura",deadline:"Um dia",payment:"Pix",validity:"7 dias",notes:"",detailed:true,price:250,discount:10,materials:30,transport:20,other:0};
test("detalhamento soma ao subtotal e desconto incide uma única vez",()=>{
 const t=quoteTotals(q);assert.equal(t.labor,20000);assert.equal(t.labor+t.materials+t.transport+t.other,t.subtotal);assert.equal(t.total,22500);
});
test("não permite mão de obra negativa no detalhamento",()=>{
 assert.throws(()=>quoteTotals({...q,price:10}));assert.equal(quoteTotals({...q,price:10,detailed:false}).total,900);
});
test("rejeita inválidos e dados obrigatórios ausentes",()=>{
 for(const patch of [{price:NaN},{materials:-1},{discount:101}])assert.throws(()=>quoteTotals({...q,...patch}));
 assert.throws(()=>quoteLines({...q,client:" "}));
});
test("arredonda valores comerciais para centavos",()=>{const t=quoteTotals({...q,price:100.01,discount:10});assert.equal(t.subtotal,10001);assert.equal(t.discount,1000);assert.equal(t.total,9001);});
test("quebra palavras longas e linhas sem ultrapassar área útil",()=>{
 assert.ok(wrapLine("a".repeat(400)).every(s=>s.length<=82));
 assert.deepEqual(wrapLine("linha 1\nlinha 2"),["linha 1","linha 2"]);
});
test("PDF tem offsets corretos, múltiplas páginas e acentos codificados",()=>{
 const bytes=generateQuotePdf({...q,scope:"Preparação ".repeat(1000)});
 const pdf=new TextDecoder().decode(bytes);
 assert.ok(pdf.startsWith("%PDF-1.4"));assert.ok(pdf.includes("/WinAnsiEncoding"));
 const pageCount=Number(pdf.match(/\/Count (\d+)/)?.[1]);assert.ok(pageCount>1);
 const start=Number(pdf.match(/startxref\n(\d+)/)?.[1]);assert.equal(pdf.slice(start,start+4),"xref");
 const xref=pdf.slice(start).split("\n");const count=Number(xref[1].split(" ")[1]);
 for(let id=1;id<count;id++){const offset=Number(xref[id+2].slice(0,10));assert.ok(pdf.slice(offset).startsWith(id+" 0 obj"));}
 assert.ok(pdf.includes("\\343")); // ã in João
});
test("apenas campos comerciais entram no documento",()=>{
 const lines=quoteLines(q).join("\n");assert.ok(!lines.includes("reserva"));assert.ok(!lines.includes("meta mensal"));assert.ok(lines.includes("R$"));
});
