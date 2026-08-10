# `locales/pt-br.ts` não tem teste, nem tipo, nem as chaves de acessibilidade do PrimeVue

- **Categoria:** falta-de-teste
- **Severidade:** média
- **Arquivo(s):** `src/locales/pt-br.ts:1-19`, `src/index.ts:7`
- **Domínio:** helpers-composables

## Problema

O locale é um `export default` de objeto literal, sem anotação de tipo nenhuma:

```ts
// src/locales/pt-br.ts:1
export default {
    accept: 'Aceitar',
    reject: 'Cancelar',
    ...
    fileSizeTypes: ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
};
```

Ele é importado em `src/index.ts:7` e aplicado globalmente pelo `install()`, ou seja, faz parte do comportamento padrão da lib em toda app consumidora. Não existe `tests/locales/`.

Problemas verificáveis:

1. **Sem tipagem contra o contrato do PrimeVue.** O objeto não declara `satisfies` nem implementa nenhuma interface. Uma chave escrita errada (`monthNamesShort` → `monthNameShort`) não gera erro de compilação; o PrimeVue simplesmente cai no default em inglês em runtime.

2. **Cobertura incompleta do contrato.** O locale traz 15 chaves. O contrato de locale do PrimeVue inclui várias outras relevantes para acessibilidade e para componentes já usados nesta lib — notadamente `emptyMessage`, `emptySearchMessage`, `emptyFilterMessage`, `choose`/`upload`/`cancel` (upload), `chooseYear`/`chooseMonth`/`chooseDate`/`prevDecade`/`nextDecade`/`prevYear`/`nextYear`/`prevMonth`/`nextMonth` (navegação de datepicker) e o bloco `aria`. Sem elas, um leitor de tela anuncia os rótulos em inglês num app em português.

3. **`firstDayOfWeek: 0`** (linha 9) define domingo como primeiro dia. É a convenção brasileira, então está correto — mas não há comentário nem teste fixando essa escolha, e é exatamente o tipo de valor que alguém "corrige" para 1 (padrão ISO) sem perceber a regressão.

4. **Arrays de tamanho fixo sem verificação.** `dayNames` precisa ter 7 entradas, `monthNames` 12. Uma entrada removida por acidente desloca todos os dias/meses subsequentes — um bug de calendário silencioso e severo. Nada garante os tamanhos.

5. Os três arrays de dias (`dayNames`, `dayNamesShort`, `dayNamesMin`, linhas 4-6) precisam começar no mesmo dia (domingo) e estar alinhados entre si. `dayNamesMin` (`['D','S','T','Q','Q','S','S']`) tem entradas repetidas por natureza, o que torna um desalinhamento praticamente invisível em inspeção visual.

## Impacto

Um calendário exibindo o mês errado ou dias deslocados é um bug de dados que atinge todas as apps consumidoras simultaneamente e não é detectável por nenhum teste atual. Rótulos ARIA em inglês degradam a acessibilidade num produto em pt-BR.

## Plano de correção

1. Criar `tests/locales/pt-br.test.ts` assertando: `dayNames`, `dayNamesShort` e `dayNamesMin` têm exatamente 7 entradas; `monthNames` e `monthNamesShort` têm 12; `dayNames[0] === 'Domingo'`; `monthNames[0] === 'Janeiro'` e `[11] === 'Dezembro'`; `firstDayOfWeek === 0`; `dateFormat === 'dd/mm/yy'`; nenhuma string vazia em nenhum array.
2. Adicionar tipagem: importar o tipo de locale do PrimeVue e aplicar `satisfies`, para que chaves inválidas ou faltantes sejam erro de compilação. Se o tipo não for exportado publicamente, declarar uma interface local com as chaves conhecidas.
3. Preencher as chaves ausentes de mensagens vazias e de navegação do datepicker, e o bloco `aria`.
4. Comentar a escolha de `firstDayOfWeek: 0` como deliberada (convenção brasileira).

## Verificação

- Testes a criar/ajustar: `tests/locales/pt-br.test.ts` (novo)
- Comandos: `npx vitest run tests/locales/pt-br.test.ts`, `npm run type-check`, `npm run lint`
