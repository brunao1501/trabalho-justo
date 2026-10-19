export const example = {income:3000,expenses:400,reserve:600,billableHours:100,serviceHours:4,travelHours:1,materials:30,transport:20,otherCosts:0,offeredPrice:250,discount:10};
export type Inputs = typeof example;
export function calculate(i:Inputs){
 for(const v of Object.values(i)) if(!Number.isFinite(v)||v<0) throw Error('Use somente valores finitos maiores ou iguais a zero.');
 if(i.billableHours<=0||i.billableHours>744) throw Error('As horas mensais devem ser maiores que zero e no máximo 744.');
 const hours=i.serviceHours+i.travelHours;
 if(hours<=0) throw Error('Informe algum tempo de execução ou deslocamento.');
 if(i.discount>100) throw Error('O desconto máximo é 100%.');
 const rate=(i.income+i.expenses+i.reserve)/i.billableHours;
 const costs=i.materials+i.transport+i.otherCosts;
 const timeValue=hours*rate;
 const reference=timeValue+costs;
 const proposed=i.offeredPrice*(1-i.discount/100);
 return {hours,rate,costs,timeValue,reference,proposed,difference:proposed-reference,remaining:proposed-costs,effectiveRate:(proposed-costs)/hours};
}
