# 16 — Resolver retorna imports de `/prime` que o prime/index.ts não exporta

**Severidade:** Alta
**Categoria:** Bug / Build
**Arquivos:** `src/helpers/MaxComponentsUiResolver.ts:19-29`, `src/prime/index.ts`

## Problema

Quando o `PrimeVueResolver` reconhece um nome, o resolver retorna `{ name, from: '@maxvue/max-components-ui/prime' }` **sem verificar se `src/prime/index.ts` re-exporta esse nome**. Não são exportados, entre outros: `Toast` (cru do PrimeVue), `FloatLabel`, `IconField`, `InputIcon`, `InputText` (cru), `InputNumber`, `InputMask`, `InputGroup`, `Fluid`, `Chart`, `Inplace`, `FileUpload`, `AccordionTab`.

Uso de `<FloatLabel>` num app consumidor gera import de export inexistente.

Problemas secundários:
- Descarta o `result` do PrimeVueResolver e usa o `name` cru.
- Instancia `PrimeVueResolver()` a cada chamada de `resolve` (desperdício).

## Correção sugerida

- Validar o nome contra a lista real de exports de `prime/index.ts` (ou gerar essa lista no manifesto) antes de retornar.
- Mover a instanciação do `PrimeVueResolver()` para fora da função `resolve`.
