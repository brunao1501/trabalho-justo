# Trabalho Justo

Simulador de preços para autônomos, desenvolvido como projeto de portfólio de Bruno. A proposta é tornar visíveis os custos e o tempo comprometido para apoiar decisões de orçamento.

## Versão 0.2

- Explicações em linguagem direta, dicas por campo e exemplo guiado de pintura.
- Aplicativo web instalável (PWA), com ícones e funcionamento offline após preparação inicial.
- Aviso de atualização que preserva a escolha do usuário antes de recarregar.
- Referência por hora com remuneração, despesas fixas e reserva.
- Estimativa por serviço incluindo execução, deslocamento e custos diretos.
- Comparação com proposta e desconto, com cálculo explicado.
- Interface responsiva em português, sem cadastro.
- Dados fictícios iniciais; alterações ficam somente na memória da página e são perdidas ao recarregar. Sem coleta ou envio dos valores.

## Executar

Requisito: Node.js 24 LTS.

```bash
npm install
npm run dev
```

Abra o endereço exibido no terminal. Para validar:

```bash
npm test
npm run build
```

## Regras de negócio

```text
referência/hora = (remuneração + despesas fixas + reserva) / horas vendáveis
referência/serviço = (execução + deslocamento) × referência/hora + custos diretos
proposta com desconto = proposta × (1 − desconto/100)
retorno/hora após custos diretos = (proposta com desconto − custos diretos) / tempo total
```

As despesas fixas são rateadas na hora; não devem ser repetidas nos custos diretos. Deslocamento consome tempo e pode gerar despesas de transporte: são componentes distintos. As horas mensais vendáveis precisam incluir o deslocamento cobrado e excluir horas administrativas.

Valores são calculados sem arredondamento intermediário e exibidos em BRL com duas casas decimais. Pequenas diferenças na soma dos valores exibidos podem ocorrer. Uma futura versão transacional deverá adotar representação decimal ou centavos com política explícita de arredondamento.

O retorno após custos diretos não é lucro líquido: ainda cobre remuneração, despesas fixas e reserva. Tributos e taxas percentuais não são calculados nesta versão. A estimativa não define preço de mercado e depende das premissas informadas.

## Organização

- `src/calculator.ts`: cálculo e validação independentes da interface.
- `src/main.tsx`: formulário e resultado em React.
- `src/styles.css`: layout responsivo e estados de foco.
- `tests/calculator.test.ts`: testes das regras com o test runner do Node.

React + TypeScript + Vite. Sem API ou banco nesta primeira etapa.

## Próximos marcos

1. Validar as premissas com três autônomos de uma atividade.
2. Comparar custos e tempos previstos com valores reais.
3. Adicionar API Node.js e PostgreSQL quando necessário.
4. Exportar propostas e preparar publicação com custos documentados.

## Missão de aprendizado

Execute a aplicação, simule um serviço e explique por que o deslocamento altera o preço. Depois modifique um cenário de teste e confira o resultado. XP somente após a conclusão das atividades.

## Licença

Ainda não foi definida uma licença de distribuição. Código público para apresentação e avaliação do projeto.

## Instalação e uso offline

A versão de desenvolvimento (`npm run dev`) não ativa o service worker. Para verificar a versão de produção:

```bash
npm run build
npx vite preview --host 127.0.0.1
```

Abra o endereço indicado, aguarde “Calculadora preparada para uso offline” e só então teste sem conexão. No celular, publique em hospedagem HTTPS na raiz do domínio. A configuração de caminhos desta versão pressupõe a raiz `/`; subpastas exigem ajuste de base, manifesto e escopo.

A instalação depende do dispositivo e navegador. O botão aparece quando o navegador disponibiliza a instalação. Em iOS, use Safari → Compartilhar → Adicionar à Tela de Início. Há orientações dentro da própria interface.

Offline é o armazenamento dos arquivos da aplicação, não das simulações. Os valores informados continuam apenas na memória e são perdidos ao fechar ou recarregar. Atualizações exibem um aviso antes de recarregar. Não há publicação em lojas nem hospedagem pública configurada por este repositório.

## Atualizar uma cópia baixada como ZIP no Windows

Pare o servidor com Ctrl+C, baixe o novo ZIP no GitHub e extraia em uma nova pasta. Abra o terminal nessa pasta, execute `npm install` e depois `npm run dev`. Assim você evita misturar arquivos antigos com novos.
