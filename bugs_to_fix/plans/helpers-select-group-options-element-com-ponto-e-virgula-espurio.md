# `SelectGroupOptionsElement` tem um `[];` espúrio após o fecho da interface

- **Categoria:** bug
- **Severidade:** baixa
- **Arquivo(s):** `src/types/index.ts:169-176`, `:220`
- **Domínio:** helpers-composables

## Problema

```ts
// src/types/index.ts:169-172
export interface SelectGroupOptionsElement {
    label: string;
    items: SelectItem[];
}[];
```

O `[];` após a chave de fechamento (linha 172) é sintaticamente ignorado pelo TypeScript — declarações de interface não aceitam sufixo de array, e o parser simplesmente descarta. É um vestígio de quando o tipo provavelmente era um `type X = {...}[]`.

A intenção original importa: se `SelectGroupOptionsElement` deveria ser **um array** de `{label, items}`, então a linha seguinte está duplamente errada:

```ts
// src/types/index.ts:174
export interface SelectGroupOptions extends Array<SelectGroupOptionsElement> {}
```

`SelectGroupOptions` seria um array de arrays de grupos — dois níveis de aninhamento em vez de um. Como o `[];` é descartado, o comportamento efetivo hoje é o correto (`SelectGroupOptions` = array de grupos), mas apenas por acidente: o código expressa uma coisa e o compilador faz outra.

O mesmo padrão aparece em `MaxTableColumn`:

```ts
// src/types/index.ts:220
};
```

Um `;` após o fecho de uma interface (linha 220, encerrando a interface aberta na linha 181). Também inofensivo, também sinal de que estes tipos foram convertidos de `type` para `interface` sem limpeza.

## Impacto

Nenhum em runtime — TypeScript descarta ambos. O risco é de leitura: um desenvolvedor que interprete o `[];` literalmente vai modelar `SelectGroupOptions` errado, ou "consertar" o tipo para o aninhamento duplo e quebrar todos os selects agrupados da lib. É armadilha de manutenção num arquivo que define a API pública.

## Plano de correção

1. Remover o `[];` da linha 172, deixando `}` apenas.
2. Remover o `;` supérfluo da linha 220.
3. Confirmar com `npm run type-check` que nada muda — a ausência de qualquer erro novo comprova que os sufixos eram inertes.
4. Verificar se o ESLint (`@stylistic`) tem regra que capture esse padrão; se sim, entender por que não foi acionada; se não, considerar habilitá-la.

## Verificação

- Testes a criar/ajustar: nenhum (mudança puramente sintática em declaração de tipo).
- Comandos: `npm run type-check` (deve permanecer sem erros, antes e depois), `npm run lint`, `npm run build`
