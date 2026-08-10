# MaxInputIconPicker tem dois nós raiz — o `Drawer` fica fora do `InputBase`

- **Categoria:** divergência
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxInputIconPicker.vue:1-74`
- **Domínio:** inputs-selecao-arquivo

## Problema

O CLAUDE.md estabelece: *"Qualquer novo componente de input deve usar `<InputBase>` como seu elemento mais externo"*, com uma exceção documentada nominal e fechada para `MaxInputCheckbox`, `MaxInputRadio` e `MaxInputToggle`.

`MaxInputIconPicker` não está nessa lista de exceções, mas o template tem **dois** nós raiz irmãos:

```vue
<template>
    <InputBase v-bind="props" ... @click.stop="openDrawer">
        <div class="icon-picker-trigger p-inputtext" ...> ... </div>
    </InputBase>

    <Drawer v-model:visible="visible" header="Escolha um ícone" position="bottom" class="max-icon-picker-drawer">
        ...
    </Drawer>
</template>
```

O `InputBase` não é o elemento mais externo — é um de dois irmãos. Consequências concretas:

1. **Atributos de fallthrough ficam ambíguos.** Com múltiplos nós raiz, o Vue não aplica `$attrs` automaticamente e emite aviso em desenvolvimento quando há attrs não declarados. O componente usa `useAttrs()` (linha 95) para ler `errMsg`/`error_message`/`error_msg` (linha 171), então há attrs em jogo — classes, `id` e `style` passados pela app não têm destino definido.
2. **Divergência de convenção não documentada.** As outras três exceções são justificadas em detalhe no CLAUDE.md; esta não é mencionada em lugar nenhum, então parece descuido e não decisão.

O ponto importante é que essa divergência é **evitável**, diferente das três exceções documentadas: o `Drawer` do PrimeVue já se teleporta para fora da árvore via `appendTo` (default `body`), então mantê-lo aninhado dentro do `InputBase` no template não muda onde ele é renderizado no DOM. O padrão correto já é praticado na própria biblioteca — `MaxInputSelect` mantém o `<Select>` (que também renderiza um overlay teleportado) dentro do `InputBase`.

## Impacto

Fallthrough de atributos indefinido: `class`, `style` e `id` passados pela app consumidora podem não chegar a lugar nenhum ou gerar avisos no console em desenvolvimento. Além disso, a violação silenciosa da regra arquitetural central da biblioteca erode a garantia de que "todo input tem InputBase como raiz" — garantia da qual a migração do PrimeVue depende para tratar os inputs de forma uniforme.

## Plano de correção

1. Mover o `<Drawer>` para dentro do `<InputBase>`, como irmão do `.icon-picker-trigger`, tornando o `InputBase` o único nó raiz. Como o `Drawer` usa `appendTo="body"` por padrão, a posição no DOM renderizado não muda.
2. Confirmar que o `@click.stop="openDrawer"` no `InputBase` (linha 9) não passa a capturar cliques dentro do drawer — se passar, mover o handler para o `.icon-picker-trigger` (linha 10), que é o alvo real da interação.
3. Verificar que o SCSS de `.max-icon-picker-drawer` (linha 333), hoje escrito como seletor global de topo, continua casando após a mudança (deve continuar, pois o drawer é teleportado e o estilo não tem escopo).
4. Se, após a análise, o time concluir que a separação é necessária, documentá-la explicitamente no CLAUDE.md junto às outras exceções — mas a rota preferida é eliminar a divergência.

## Verificação

- `wrapper.element` do componente montado deve ser um único elemento (não um fragmento) — teste em `tests/components/MaxInputIconPicker.test.ts`.
- Teste de fallthrough: montar com `attrs: { class: 'minha-classe', id: 'picker-1' }` e asserir que a classe e o id chegam ao elemento raiz.
- Teste de regressão: clicar no `.icon-picker-trigger` continua abrindo o drawer (fluxo já exercitado na linha 33 do teste atual).
- Nenhum aviso de "Extraneous non-emits event listeners" ou de fallthrough no console durante `npm run test`.
- `npx vitest run tests/components/MaxInputIconPicker.test.ts`.
