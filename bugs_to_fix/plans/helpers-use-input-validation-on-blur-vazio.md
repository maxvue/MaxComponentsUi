# `useInputValidation().onBlur` é uma função vazia exposta como API pública

- **Categoria:** melhoria
- **Severidade:** média
- **Arquivo(s):** `src/helpers/useInputValidation.ts:31`, `:72-77`
- **Domínio:** helpers-composables

## Problema

O composable declara `onBlur` na sua interface de retorno (linha 31) e o entrega ao consumidor, mas o corpo é literalmente vazio:

```ts
// src/helpers/useInputValidation.ts:72-77
const onBlur = () => {
    // Ponto de extensao: hoje a validacao e sempre reativa (computed),
    // entao nao ha estado a atualizar aqui. Exposto para que
    // componentes que queiram um gate de "so valida apos blur"
    // possam evoluir esse comportamento sem mudar o contrato publico.
};
```

O JSDoc do composable (linhas 45-48) reforça a promessa: *"`onBlur` e exposto para quem quiser acionar a validacao apenas apos o usuario sair do campo"*. Essa afirmação é falsa — a validação é sempre reativa (`isValid` é um `computed`, linha 53), então chamar `onBlur` não muda nada. Um consumidor que ligue `@blur="onBlur"` acreditando estar adiando a validação terá o comportamento oposto: erros aparecem enquanto o usuário ainda digita.

O teste que existe confirma o vazio em vez de cobrir comportamento: `tests/helpers/useInputValidation.test.ts:112` — `'onBlur existe e pode ser chamado sem lancar erro'`.

Problema relacionado no mesmo arquivo: a opção `targetValue` (linhas 7-8) está declarada como *"exposto para uso futuro por quem consome o composable"* e **nunca é lida** no corpo da função. É uma opção morta na API pública.

## Impacto

O gate "validar somente após o blur" é o comportamento esperado da maioria dos formulários — mostrar "Valor inválido" no primeiro caractere digitado é ruído. Como o composable promete esse recurso e não o entrega, os componentes que migrarem para ele (o propósito declarado nas linhas 34-36: *"logica ... hoje reimplementada (com pequenas divergencias) em varios componentes"*) herdam validação eager sem perceber.

## Plano de correção

1. Implementar de fato o gate: adicionar `const touched = ref(false)`; `onBlur` faz `touched.value = true`; `caution`/`error` retornam o estado neutro enquanto `touched === false`.
2. Tornar o gate opcional via nova opção `validateOnBlur?: boolean` (default `false`, preservando o comportamento atual dos componentes já migrados) para não quebrar consumidores existentes.
3. Remover `targetValue` da interface de opções, ou implementar a comparação que o nome sugere. Uma opção morta em API pública é passivo de manutenção.
4. Corrigir o JSDoc das linhas 45-48 para descrever o comportamento real após a mudança.

## Verificação

- Testes a criar/ajustar: `tests/helpers/useInputValidation.test.ts` — substituir o caso `:112` por: com `validateOnBlur: true`, `error` é `null` antes do primeiro `onBlur()` mesmo com valor inválido, e passa a ser a mensagem depois; com `validateOnBlur: false` (default) o comportamento atual dos 16 casos existentes permanece idêntico.
- Comandos: `npx vitest run tests/helpers/useInputValidation.test.ts`, `npm run type-check`, `npm run lint`
