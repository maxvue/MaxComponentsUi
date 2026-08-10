# MaxInputDatePicker declara props de select (`options`, `loadOptions`, `optionValue`…) que não usa

- **Categoria:** divergência
- **Severidade:** baixa
- **Arquivo(s):** `src/components/MaxInputDatePicker.vue:60-75`, `src/components/MaxInputDatePicker.vue:12`, `src/components/MaxInputDatePicker.vue:3`
- **Domínio:** inputs-selecao-arquivo

## Problema

A interface `Props` do date picker (linhas 19-98) inclui um bloco inteiro de props copiado de um componente de seleção:

```ts
/** Lista de opções simples [{ name, value, icon, sub_label }] */
options?: any[];
/** Lista de opções agrupadas [{ label, items: [] }] */
groupOptions?: SelectGroupOptions;
...
/** Valor selecionado */
loadOptions?: () => Promise<any[]>;
/** Flag que informa o campo do valor */
optionValue?: string;
/** Flag que informa o campo do label */
optionLabel?: string;
/** Flag que informa o campo do name */
optionName?: string;
```

Nenhuma dessas seis props é referenciada no `<script setup>` nem no template. O componente renderiza um `<DatePicker>` do PrimeVue (linha 3) que não tem qualquer noção de "opções".

Evidências de que é código copiado sem revisão:
- A linha 12 importa `SelectGroupOptions` de `../types` só para tipar `groupOptions` — um import de tipo de select num date picker.
- O JSDoc de `loadOptions` (linha 68) diz **"Valor selecionado"**, comentário claramente arrastado de outra prop durante a cópia.
- A linha 25 documenta `class?: string` como *"Lista de opções simples [{ name, value, icon, sub_label }]"* — mesmo comentário errado, em outra prop.
- Vários comentários repetem *"Ícone claro comparado ao fundo"* para `iconPos`, `inLine` (linhas 81-83), que não têm relação com ícones claros.

O agravante prático é o `v-bind="props"` da linha 3: **todas** as props declaradas são repassadas ao `<DatePicker>` do PrimeVue, incluindo `options`, `optionValue`, `optionLabel`, `optionName`, `groupOptions` e `loadOptions`. O PrimeVue não as reconhece, então elas caem como atributos de fallthrough no DOM — potencialmente gerando atributos HTML inválidos no elemento renderizado (`optionvalue="value"` etc.) e avisos no console.

## Impacto

API pública enganosa: o autocomplete do editor sugere `options` e `loadOptions` a quem escreve `<MaxInputDatePicker`, levando o desenvolvedor a crer que existe um modo de seleção que simplesmente não existe. Documentação interna incorreta (três JSDoc com o texto de outra prop) prejudica quem for migrar o componente. E o repasse via `v-bind="props"` polui o DOM com atributos sem significado.

## Plano de correção

1. Remover as seis props de seleção da interface `Props` (linhas 60-75): `options`, `groupOptions`, `loadOptions`, `optionValue`, `optionLabel`, `optionName`.
2. Remover o import de `SelectGroupOptions` (linha 12), que fica órfão.
3. Corrigir os JSDoc arrastados: `class` (linha 25), `iconPos` e `inLine` (linhas 81-83) devem descrever o que realmente fazem.
4. Verificar se `value?: any` (linha 21) ainda faz sentido, dado que o componente usa `defineModel` (linha 15) — provavelmente é outro resíduo.
5. Confirmar, com um grep nas apps consumidoras, que ninguém passa essas props ao date picker antes de removê-las (é remoção de API pública, ainda que de API que nunca funcionou).

## Verificação

- `npm run type-check` passa após a remoção.
- Novo teste em `tests/components/MaxInputDatePicker.test.ts`: montar o componente e asserir que o elemento raiz não contém atributos `optionvalue`/`optionlabel`/`options` no DOM.
- Testes existentes do date picker permanecem verdes.
- `npx vitest run tests/components/MaxInputDatePicker.test.ts`.
