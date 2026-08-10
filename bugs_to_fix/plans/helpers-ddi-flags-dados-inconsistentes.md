# `country_ddi_flags`: entrada sem `label`, nomes com erro de digitação e `ddi`/`value` duplicados

- **Categoria:** falha
- **Severidade:** média
- **Arquivo(s):** `src/constants/ddiFlags.ts:25`, `:23`, `:187`, `:194`, `:1-8`
- **Domínio:** helpers-composables

## Problema

**1. Uma única entrada sem `label`.** Todas as 236 entradas trazem `label` exceto uma:

```ts
// src/constants/ddiFlags.ts:25
{ ddi: 247, name: 'Ascensão', sigla: 'AC', value: 247 },
```

Comparar com a linha vizinha (24): `{ ddi: 297, name: 'Aruba', label: 'Aruba', sigla: 'AW', value: 297 }`. Como `label` é opcional no tipo (`DDIFlag`, linha 4), o TypeScript aceita — mas qualquer consumidor que renderize `item.label` mostra vazio só para Ascensão. Verificado por varredura: é a única ocorrência.

**2. Erros de digitação em nomes exibidos ao usuário**, todos com `name` e `label` igualmente errados:

- linha 23: `'Armêia'` — deveria ser `'Armênia'`
- linha 187: `'Quêia'` — deveria ser `'Quênia'`
- linha 194: `'Romêia'` — deveria ser `'Romênia'`

O padrão é idêntico nos três (perda do `n` antes de `ia`), sugerindo um processamento de acentuação defeituoso na origem dos dados.

**3. `ddi` e `value` são sempre idênticos** nas 236 entradas (verificável por inspeção: `{ ddi: 93, ..., value: 93 }`, `{ ddi: 27, ..., value: 27 }`, e assim por diante). O tipo declara os dois campos separadamente (linhas 2 e 6) sem explicar a diferença. É duplicação pura, com risco de divergirem numa edição futura.

**4. `sigla` não é chave única de DDI.** Vários países compartilham `ddi: 1` (linhas 17, 18, 29, 31, 36, 50, 68, 77, 89, 93 e outras) — correto, é o NANP. Mas isso significa que uma busca por `ddi` devolve múltiplos resultados. O teste `'DDI do Brasil (55) é único na lista'` (`tests/constants/ddiFlags.test.ts:32`) na verdade filtra por `sigla === 'BR'`, não por DDI — o nome do teste não descreve o que ele verifica.

**5. Nenhum teste cobre os itens 1-3.** O caso `'todos os itens possuem campos obrigatórios preenchidos'` (`tests/constants/ddiFlags.test.ts:19`) checa `ddi`, `name`, `sigla` e `value` — deliberadamente **não** checa `label`, que é o campo faltante.

## Impacto

Um select de DDI (usado por `MaxInputPhone`/`MaxPhoneField`) exibe uma opção em branco para Ascensão se renderizar por `label`, e mostra três nomes de países grafados incorretamente para o usuário final da app consumidora.

## Plano de correção

1. Adicionar `label: 'Ascensão'` à entrada da linha 25.
2. Corrigir os três nomes: `Armêia`→`Armênia` (linha 23), `Quêia`→`Quênia` (187), `Romêia`→`Romênia` (194), em `name` e `label`.
3. Decidir sobre a duplicação `ddi`/`value`: ou tornar `value` opcional com fallback para `ddi`, ou documentar no tipo (linhas 1-8) por que ambos existem.
4. Renomear o teste `'DDI do Brasil (55) é único na lista'` para refletir que ele verifica unicidade de **sigla**, e adicionar um teste real sobre a multiplicidade de `ddi: 1`.

## Verificação

- Testes a criar/ajustar: `tests/constants/ddiFlags.test.ts` — adicionar: todas as entradas têm `label` não vazio; `label === name` em todas as entradas; `ddi === value` em todas as entradas; nenhum `name` contendo o padrão `êia`.
- Comandos: `npx vitest run tests/constants/ddiFlags.test.ts`, `npm run type-check`, `npm run lint`
