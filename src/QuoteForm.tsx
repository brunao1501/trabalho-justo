import { useState, type FormEvent } from "react";
import { generateQuotePdf, quoteTotals, type Quote } from "./quotePdf";
type Props = { price: number; discount: number; materials: number; transport: number; other: number; valid: boolean };
type Details = Omit<Quote, "price" | "discount" | "materials" | "transport" | "other">;
function defaults(): Details {
  const now = new Date();
  return { number: "TJ-" + now.getFullYear() + "-" + String(now.getTime()).slice(-7),
    date: now.toLocaleDateString("pt-BR"), professional: "", contact: "", client: "",
    service: "", scope: "", deadline: "", payment: "", validity: "", notes: "", detailed: false };
}
const fields: {key: keyof Omit<Details,"detailed">;label:string;placeholder?:string;multiline?:boolean;optional?:boolean}[] = [
  {key:"professional",label:"Seu nome ou nome da empresa",placeholder:"Ex.: João — Serviços de Pintura"},
  {key:"contact",label:"Seu telefone ou e-mail"},
  {key:"client",label:"Nome do cliente"},
  {key:"number",label:"Número do orçamento"},
  {key:"date",label:"Data de emissão"},
  {key:"service",label:"Nome do serviço",placeholder:"Ex.: Pintura de uma parede interna"},
  {key:"scope",label:"O que está incluído?",placeholder:"Descreva entregas, materiais e limites do serviço.",multiline:true},
  {key:"deadline",label:"Prazo e agendamento",placeholder:"Ex.: 1 dia, em data a combinar"},
  {key:"payment",label:"Condições de pagamento",placeholder:"Ex.: 50% na aprovação e 50% na conclusão",multiline:true},
  {key:"validity",label:"Validade do orçamento",placeholder:"Ex.: Até 30/10/2026"},
  {key:"notes",label:"Observações (opcional)",multiline:true,optional:true}
];
export function QuoteForm(props:Props) {
  const [details,setDetails] = useState<Details>(defaults);
  const [message,setMessage] = useState("");
  const q:Quote = {...details, price:props.price, discount:props.discount, materials:props.materials, transport:props.transport, other:props.other};
  let totals:ReturnType<typeof quoteTotals>|undefined;
  let error="";
  try { if(!props.valid) throw Error("Corrija os campos da calculadora antes de gerar o PDF."); totals=quoteTotals(q); }
  catch(e) { error=e instanceof Error?e.message:"Confira os valores."; }
  const money=(n:number)=>(n/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  function download(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    try {
      if(error) throw Error(error);
      const bytes=generateQuotePdf(q);
      const blob=new Blob([new Uint8Array(bytes)],{type:"application/pdf"});
      const url=URL.createObjectURL(blob);
      const link=document.createElement("a");link.href=url;
      link.download="orcamento-" + (details.number.replace(/[^a-zA-Z0-9_-]/g,"-").slice(0,60)||"trabalho-justo") + ".pdf";
      document.body.append(link);link.click();link.remove();
      window.setTimeout(()=>URL.revokeObjectURL(url),60000);
      setMessage("PDF gerado. Se o navegador abrir uma prévia, use Compartilhar para salvar ou enviar ao cliente.");
    } catch(e) { setMessage(e instanceof Error?e.message:"Não foi possível gerar o PDF."); }
  }
  return <section className="quote-section" aria-labelledby="quote-title">
    <div className="heading"><span>04</span><div><h2 id="quote-title">Prepare o orçamento do cliente</h2><p>Use o preço que pretende cobrar, já com o desconto da etapa 3.</p></div></div>
    <p className="quote-help">Sua meta mensal, despesas fixas e reserva não aparecem no PDF. Confira os dados e os valores comerciais antes de enviar. Os dados não são salvos ao fechar ou recarregar.</p>
    <form onSubmit={download}>
      <div className="grid">{fields.map(f=><div className={"field" + (f.multiline?" quote-wide":"")} key={f.key}>
        <label htmlFor={"quote-"+f.key}>{f.label}</label>
        {f.multiline?<textarea id={"quote-"+f.key} value={details[f.key]} required={!f.optional} maxLength={4000} rows={3} placeholder={f.placeholder} onChange={e=>setDetails(d=>({...d,[f.key]:e.target.value}))}/>:
        <input className="quote-input" id={"quote-"+f.key} value={details[f.key]} required maxLength={160} placeholder={f.placeholder} onChange={e=>setDetails(d=>({...d,[f.key]:e.target.value}))}/>}
      </div>)}</div>
      <fieldset className="quote-options"><legend>Como apresentar os valores no PDF?</legend>
        <label><input type="radio" name="quote-mode" checked={!details.detailed} onChange={()=>setDetails(d=>({...d,detailed:false}))}/> Valor único pelo serviço</label>
        <label><input type="radio" name="quote-mode" checked={details.detailed} onChange={()=>setDetails(d=>({...d,detailed:true}))}/> Separar serviço, materiais, deslocamento e outros gastos</label>
      </fieldset>
      <p className="quote-help">No detalhamento, o valor do serviço é o preço da etapa 3 menos os gastos específicos informados. O desconto é aplicado uma vez sobre o subtotal. Valores arredondados para centavos.</p>
      {error?<p className="quote-error" role="status">{error}</p>:totals&&<div className="quote-preview" aria-live="polite"><h3>Prévia dos valores para o cliente</h3><dl>
        {details.detailed?<><div><dt>Mão de obra / serviço</dt><dd>{money(totals.labor)}</dd></div><div><dt>Materiais</dt><dd>{money(totals.materials)}</dd></div><div><dt>Deslocamento</dt><dd>{money(totals.transport)}</dd></div><div><dt>Outros gastos</dt><dd>{money(totals.other)}</dd></div></>:null}
        <div><dt>Subtotal</dt><dd>{money(totals.subtotal)}</dd></div><div><dt>Desconto ({props.discount}%)</dt><dd>{money(totals.discount)}</dd></div><div><dt><strong>Total a pagar</strong></dt><dd>{money(totals.total)}</dd></div>
      </dl></div>}
      <button className="quote-download" type="submit" disabled={Boolean(error)}>Gerar orçamento em PDF</button>
      <p className="quote-help">Funciona no dispositivo, sem enviar os dados para um servidor. No iPhone, use Compartilhar na prévia do PDF para enviar pelo WhatsApp. O documento não é nota fiscal.</p>
      {message&&<p role="status">{message}</p>}
    </form>
  </section>;
}
