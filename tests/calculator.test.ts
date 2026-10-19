import { test } from "node:test";
import assert from "node:assert/strict";
import { calculate, example } from "../src/calculator.ts";
test("referência inclui tempo, deslocamento e custos diretos sem duplicar fixos", () => {
  const r = calculate({ ...example, discount: 0 });
  assert.equal(r.rate, 40);
  assert.equal(r.hours, 5);
  assert.equal(r.reference, 250);
  assert.equal(r.difference, 0);
});
test("desconto reduz proposta e retorno por hora", () => {
  const r = calculate(example);
  assert.equal(r.proposed, 225);
  assert.equal(r.difference, -25);
  assert.equal(r.effectiveRate, 35);
});
test("desconto de 100% evidencia custos não cobertos", () => {
  const r = calculate({ ...example, discount: 100 });
  assert.equal(r.proposed, 0);
  assert.equal(r.remaining, -50);
});
test("rejeita valores inválidos", () => {
  for (const patch of [
    { billableHours: 0 },
    { billableHours: 745 },
    { serviceHours: 0, travelHours: 0 },
    { materials: -1 },
    { income: NaN },
    { transport: Infinity },
    { discount: 101 },
  ])
    assert.throws(() => calculate({ ...example, ...patch }));
});
test("não arredonda valor da hora antes do serviço", () => {
  const r = calculate({
    ...example,
    income: 100,
    expenses: 0,
    reserve: 0,
    billableHours: 3,
    serviceHours: 3,
    travelHours: 0,
    materials: 0,
    transport: 0,
  });
  assert.equal(r.reference, 100);
});
test("permite somente deslocamento e custos zero", () => {
  const r = calculate({
    ...example,
    serviceHours: 0,
    materials: 0,
    transport: 0,
  });
  assert.equal(r.reference, 40);
});
