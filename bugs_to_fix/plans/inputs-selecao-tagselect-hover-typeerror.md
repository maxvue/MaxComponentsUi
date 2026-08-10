# `@mouseenter` do MaxTagSelect lança TypeError quando a opção não é encontrada

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxTagSelect.vue:9`
- **Domínio:** inputs-selecao-arquivo

## Problema

No slot `#option` do `<Select>`:

```vue
@mouseenter="options.find(o => o['value'] === slotProps.option['value'])['hover'] = true"
@mouseleave="options.find(o => o['value'] === slotProps.option['value'])['hover'] = false"
```

Três defeitos numa linha:

1. **Sem guard de `undefined`.** `Array.prototype.find` retorna `undefined` quando nada casa, e o código indexa o resultado imediatamente. Basta a opção renderizada não estar em `options.value` — o que acontece quando `loadOptions` substitui a lista enquanto o overlay está aberto (`optionsField` muda em `before_show`, linhas 164-174), ou quando há duas opções com o mesmo `value` — para lançar `TypeError: Cannot set properties of undefined`.

2. **Chave `'value'` cravada.** A busca usa literalmente `o['value']`, ignorando a prop `optionValue` (declarada na linha 57, default `'value'`). Qualquer app que passe `option-value="id"` faz `find` comparar campos inexistentes em ambos os lados, `find` retorna `undefined`, e cai no defeito 1 — ou seja, com `optionValue` customizado o hover **sempre** lança.

3. **Mutação da fonte de um computed a partir do template.** `options` é um `computed` (linhas 136-141) que já faz uma mutação questionável no getter (`options?.map((option: any) => option.hover ??= false)`, linha 138, escrevendo em `props.options`). O handler escreve de volta nesse mesmo array, mutando um objeto que pertence ao componente pai.

O estado `hover` só alimenta `getStyleColor(slotProps.option, slotProps.option['hover'] ?? false, false)` na mesma linha — um efeito puramente visual que CSS `:hover` resolveria sem tocar em dado algum.

## Impacto

Com `optionValue` customizado, passar o mouse sobre qualquer opção do dropdown lança uma exceção no handler. Mesmo com o default `'value'`, há uma janela de crash durante o carregamento assíncrono de opções. E o componente escreve num array de props do pai, o que pode provocar avisos de mutação e efeitos colaterais em quem passa uma lista compartilhada.

## Plano de correção

1. Eliminar o estado `hover` em JavaScript: mover o efeito para CSS puro com `.label-tag-div:hover`, usando variáveis CSS calculadas por `getStyleColor` (a versão "escurecida" pode ser expressa com `color-mix` ou uma custom property setada uma única vez no `:style`). Isso remove os três defeitos de uma vez e é a correção estruturalmente correta.
2. Se por algum motivo o estado precisar continuar em JS, no mínimo: extrair para um método nomeado no `<script setup>` (fora do template), respeitar `props.optionValue` em vez do literal `'value'`, e usar optional chaining no resultado do `find`.
3. Remover a mutação `option.hover ??= false` do getter do computed (linha 138) — computeds devem ser puros; hoje esse getter escreve em `props.options`.

## Verificação

- Novo teste em `tests/components/MaxTagSelect.test.ts`: montar com `optionValue: 'id'` e opções `[{ id: 1, label: 'A' }]`, disparar `mouseenter` na opção renderizada e asserir que nenhuma exceção é lançada (hoje lança).
- Teste de que `props.options` não é mutado após a montagem (o objeto passado não deve ganhar a chave `hover`).
- Verificação visual no playground de que o realce de hover das opções continua funcionando.
- `npx vitest run tests/components/MaxTagSelect.test.ts` — deve também elevar a cobertura de funções, hoje em 77,2%.
