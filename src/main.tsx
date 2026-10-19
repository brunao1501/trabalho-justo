import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { calculate, example, type Inputs } from "./calculator";
import "./styles.css";
import { InstallApp } from "./InstallApp";
const money = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const initial = () =>
  Object.fromEntries(
    Object.entries(example).map(([k, v]) => [k, String(v)]),
  ) as Record<keyof Inputs, string>;
type Field = { key: keyof Inputs; label: string; hint?: string; unit?: string };
const monthly: Field[] = [
  {
    key: "income",
    label: "Quanto você quer receber por mês?",
    hint: "Sua remuneração pessoal. Exemplo: R$ 3.000 para suas necessidades.",
  },
  {
    key: "expenses",
    label: "Quanto você gasta por mês para trabalhar?",
    hint: "Ex.: aluguel do espaço, ferramentas e internet profissional. Não repita esses gastos no serviço.",
  },
  {
    key: "reserve",
    label: "Quanto deseja guardar por mês?",
    hint: "Ex.: R$ 600 para imprevistos, férias e períodos sem clientes.",
  },
  {
    key: "billableHours",
    label: "Quantas horas por mês pode dedicar aos clientes?",
    unit: "h",
    hint: "Ex.: 5 horas por dia × 20 dias = 100 horas. Inclua deslocamentos dos serviços; exclua administração e busca de clientes.",
  },
];
const service: Field[] = [
  {
    key: "serviceHours",
    label: "Quanto tempo leva para fazer o serviço?",
    unit: "h",
    hint: "Ex.: 4 horas. Para meia hora, informe 0,5.",
  },
  {
    key: "travelHours",
    label: "Quanto tempo leva para ir e voltar?",
    unit: "h",
    hint: "Some a ida e a volta. Seu tempo de deslocamento também entra na conta.",
  },
  {
    key: "materials",
    label: "Quanto vai gastar com materiais?",
    hint: "Ex.: tinta, produtos de limpeza ou peças consumidas neste trabalho.",
  },
  {
    key: "transport",
    label: "Quanto vai gastar para se deslocar?",
    hint: "Ex.: passagem, combustível e estacionamento. É diferente do tempo de viagem.",
  },
  {
    key: "otherCosts",
    label: "Quais outros gastos terá neste serviço?",
    hint: "Ex.: aluguel de uma ferramenta só para esse trabalho. Se não houver, informe zero.",
  },
];
function App() {
  const [values, setValues] = useState(initial);
  let result: ReturnType<typeof calculate> | undefined;
  let error = "";
  try {
    if (Object.values(values).some((v) => v.trim() === ""))
      throw Error("Preencha todos os campos para atualizar a estimativa.");
    result = calculate(
      Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, Number(v)]),
      ) as Inputs,
    );
  } catch (e) {
    error = e instanceof Error ? e.message : "Confira os valores.";
  }
  const field = ({ key, label, hint, unit }: Field) => (
    <div className="field" key={key}>
      <label htmlFor={key}>{label}</label>
      <div className="input">
        <span aria-hidden="true">{unit || "R$"}</span>
        <input
          id={key}
          type="number"
          inputMode="decimal"
          min={key === "billableHours" ? 0.01 : 0}
          max={
            key === "discount" ? 100 : key === "billableHours" ? 744 : undefined
          }
          step="any"
          value={values[key]}
          onChange={(e) => setValues({ ...values, [key]: e.target.value })}
          aria-describedby={hint ? key + "-hint" : undefined}
        />
      </div>
      {hint && <small id={key + "-hint"}>{hint}</small>}
    </div>
  );
  return (
    <>
      <header>
        <a className="brand" href="#inicio">
          <b className="mark">=</b> trabalho<span>justo</span>
        </a>
        <span className="version">PROJETO ABERTO · V0.2</span>
      </header>
      <main id="inicio">
        <section className="hero">
          <span className="eyebrow">AUTONOMIA COMEÇA COM CLAREZA</span>
          <h1>
            Seu tempo tem valor.
            <br />
            <em>Conheça o seu.</em>
          </h1>
          <p>
            Descubra quanto cobrar pelo seu serviço. Informe sua meta mensal, o
            tempo disponível e os gastos do trabalho. A calculadora mostra um
            valor de referência e explica cada parte da conta.
          </p>
          <div className="benefits">
            <span>✓ Sem cadastro</span>
            <span>✓ Cálculo transparente</span>
            <span>✓ Dados apenas nesta página</span>
          </div>
        </section>
        <section className="how-it-works" aria-labelledby="how-title">
          <h2 id="how-title">Como funciona, na prática</h2>
          <ol>
            <li>
              <strong>Planeje seu mês.</strong> Informe quanto precisa receber,
              gastar e guardar.
            </li>
            <li>
              <strong>Descreva o serviço.</strong> Some as horas de execução,
              deslocamento e gastos específicos.
            </li>
            <li>
              <strong>Compare e decida.</strong> Veja a referência e teste o
              efeito de um desconto.
            </li>
          </ol>
          <p>
            O valor final é uma decisão sua. Tributos e taxas percentuais ainda
            não entram no cálculo.
          </p>
          <details>
            <summary>Ver um exemplo explicado: um serviço de pintura</summary>
            <p>
              Uma pessoa quer receber R$ 3.000, tem R$ 400 de despesas
              profissionais e deseja guardar R$ 600. Precisa cobrir{" "}
              <strong>R$ 4.000 no mês</strong>.
            </p>
            <p>
              Com 100 horas disponíveis para clientes, sua referência é{" "}
              <strong>R$ 40 por hora</strong>. Um serviço com 4 horas de
              execução e 1 hora de deslocamento compromete 5 horas:{" "}
              <strong>R$ 200 pelo tempo</strong>.
            </p>
            <p>
              Somando R$ 30 de materiais e R$ 20 de transporte, a referência
              fica em <strong>R$ 250</strong>. Cobrar R$ 250 com 10% de desconto
              resulta em R$ 225, ou R$ 25 abaixo do planejamento.
            </p>
            <p>
              Os campos começam com esses dados fictícios. Troque pelos seus
              valores; eles não são salvos ao fechar ou recarregar.
            </p>
          </details>
        </section>
        <InstallApp />
        <div className="workspace">
          <div className="forms">
            <section className="card">
              <div className="heading">
                <span>01</span>
                <div>
                  <h2>Sua referência mensal</h2>
                  <p>
                    Vamos distribuir sua meta mensal pelas horas dedicadas aos
                    clientes.
                  </p>
                </div>
              </div>
              <div className="grid">{monthly.map(field)}</div>
            </section>
            <section className="card">
              <div className="heading">
                <span>02</span>
                <div>
                  <h2>O próximo serviço</h2>
                  <p>Informe o tempo e os gastos de um único serviço.</p>
                </div>
              </div>
              <div className="grid">{service.map(field)}</div>
            </section>
            <section className="card">
              <div className="heading">
                <span>03</span>
                <div>
                  <h2>E se eu der um desconto?</h2>
                  <p>Entenda o efeito na sua proposta.</p>
                </div>
              </div>
              <div className="grid">
                {field({
                  key: "offeredPrice",
                  label: "Quanto pretende cobrar?",
                  hint: "Valor total antes do desconto. Compare com a referência ao lado.",
                })}
                {field({
                  key: "discount",
                  label: "Desconto na proposta",
                  unit: "%",
                })}
              </div>
              <button type="button" onClick={() => setValues(initial())}>
                Restaurar exemplo
              </button>
            </section>
          </div>
          <aside aria-label="Resultado da simulação">
            <section className="result" aria-live="polite" aria-atomic="true">
              <span className="eyebrow">SUA ESTIMATIVA</span>
              {error ? (
                <p role="status">{error}</p>
              ) : (
                result && (
                  <>
                    <h2 className="price">{money(result.reference)}</h2>
                    <p className="subtitle">Referência para este serviço</p>
                    <p className="result-explainer">
                      Este valor distribui sua meta mensal pelo tempo deste
                      trabalho e acrescenta os gastos específicos do serviço.
                    </p>
                    <div className="rate">
                      {money(result.rate)} <span>/ hora de referência</span>
                    </div>
                    <h3>De onde vem esse valor</h3>
                    <dl>
                      <div>
                        <dt>
                          Tempo · {result.hours.toLocaleString("pt-BR")} h
                        </dt>
                        <dd>{money(result.timeValue)}</dd>
                      </div>
                      <div>
                        <dt>Gastos deste serviço</dt>
                        <dd>{money(result.costs)}</dd>
                      </div>
                      <div className="total">
                        <dt>Referência total</dt>
                        <dd>{money(result.reference)}</dd>
                      </div>
                    </dl>
                    <div
                      className={
                        "comparison " + (result.difference < 0 ? "below" : "")
                      }
                    >
                      <h3>
                        {result.difference < 0
                          ? "Abaixo da sua referência"
                          : "Dentro da sua referência"}
                      </h3>
                      <p>
                        Com o desconto, sua proposta fica em{" "}
                        <strong>{money(result.proposed)}</strong>.
                      </p>
                      <p>
                        Diferença: <strong>{money(result.difference)}</strong>
                      </p>
                    </div>
                    <dl className="metrics">
                      <div>
                        <dt>Valor após os gastos do serviço</dt>
                        <dd>{money(result.remaining)}</dd>
                      </div>
                      <div>
                        <dt>Valor por hora após esses gastos</dt>
                        <dd>{money(result.effectiveRate)}</dd>
                      </div>
                    </dl>
                    <p className="note">
                      Esse retorno ainda cobre remuneração, despesas fixas e
                      reserva. Não representa lucro líquido.
                    </p>
                  </>
                )
              )}
            </section>
            <details>
              <summary>Entenda a fórmula</summary>
              <p>
                Referência por hora = (remuneração + despesas fixas + reserva) ÷
                horas vendáveis.
              </p>
              <p>
                Referência do serviço = (execução + deslocamento) × referência
                por hora + custos diretos.
              </p>
              <p>
                Tributos e taxas percentuais não são calculados nesta versão. A
                estimativa não determina o preço de mercado.
              </p>
            </details>
          </aside>
        </div>
        <section className="closing">
          <h2>Mais clareza para decidir.</h2>
          <p>
            O preço final é seu. Use a estimativa para planejar, negociar e
            valorizar seu trabalho.
          </p>
        </section>
      </main>
      <footer>
        <span>Trabalho Justo · Construído para valorizar quem faz.</span>
        <a
          href="https://github.com/brunao1501/trabalho-justo"
          target="_blank"
          rel="noreferrer"
        >
          Explore o projeto no GitHub ↗
        </a>
      </footer>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
