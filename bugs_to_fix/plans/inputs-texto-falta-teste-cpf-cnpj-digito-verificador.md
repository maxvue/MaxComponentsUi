# Falta de teste: dígito verificador de CPF/CNPJ e transição automática entre as máscaras

- **Categoria:** falta-de-teste
- **Severidade:** média
- **Arquivo(s):** `tests/components/MaxInputCpfCnpj.test.ts:53-87`, `src/components/MaxInputCpfCnpj.vue:57-88`
- **Domínio:** inputs-texto

## Problema

A suíte atual valida o caminho feliz e um caso degenerado, mas não exercita o dígito verificador de fato:

- CPF válido: só `'52998224725'` (linha 54)
- CPF inválido: só `'11111111111'` (linha 61) e `'12345678900'` (linha 75) — o primeiro é rejeitado pela regra de "todos os dígitos iguais", que é um atalho anterior ao cálculo dos DVs
- CNPJ válido: só `'11222333000181'` (linha 68)
- CNPJ inválido: só `'11111111111111'` (linha 144) e `'123456789012'` (linha 113), este último com 12 dígitos, ou seja, reprovado por tamanho e não por DV

Nenhum teste cobre o caso que realmente exercita o algoritmo: **um documento com o comprimento certo, dígitos variados, e apenas o dígito verificador errado**. Ex.: `'52998224724'` (CPF válido com o último dígito alterado) ou `'11222333000182'` (CNPJ idem). Se `cpfIsValid`/`cnpjIsValid` de `@maxvue/max-use` (que delegam a `validateBr` do `js-brasil`, ver `../MaxUse/src/Helpers/Validations/documents.ts:13-31`) fosse trocado por uma checagem só de tamanho, a suíte inteira continuaria verde.

Também não é coberto:

1. **A troca automática de máscara no 12º dígito.** `maskValue` (`MaxInputCpfCnpj.vue:66-74`) muda de CPF para CNPJ quando `onlyNumbers(temp_value).length > 11`. O teste da linha 80-87 atribui `temp_value` diretamente para dois valores isolados, sem passar pela transição real digitando através da fronteira — o ponto exato onde uma máscara mal configurada quebraria.
2. **O token recursivo `@`.** A máscara de CPF é `'###.###.###-##@'` com `'@': { pattern: /[0-9]/, optional: true, recursive: true }` (linha 78), justamente o mecanismo que permite continuar digitando além de 11 dígitos para chegar ao CNPJ. Nenhum teste verifica que digitar o 12º dígito é aceito pelo input.
3. **A não-emissão de `complete` para comprimento intermediário válido.** `watch` na linha 109-112 só emite com 11 ou 14 dígitos; não há teste para 12 ou 13 dígitos.

## Impacto

A validação de documento é o comportamento central deste componente e a parte mais fácil de quebrar numa migração (a lib está migrando para longe do PrimeVue, e `@maxvue/max-use` é dependência local sujeita a mudança). Hoje a suíte não protegeria contra uma regressão no cálculo do DV nem contra uma máscara que impeça a transição CPF→CNPJ.

## Plano de correção

1. Adicionar casos de DV incorreto, com comprimento correto:
   ```ts
   it('rejeita CPF com dígito verificador errado', ...)   // '52998224724'
   it('rejeita CNPJ com dígito verificador errado', ...)  // '11222333000182'
   ```
2. Adicionar um segundo CPF e um segundo CNPJ válidos, para não depender de um único vetor.
3. Testar a transição de máscara digitando através da fronteira: montar com a diretiva `vMaska` real (não o stub `InputText: { template: '<input />' }` usado hoje na linha 22, que remove a máscara do teste), preencher 11 dígitos, afirmar máscara de CPF, digitar o 12º, afirmar máscara de CNPJ e que o dígito foi aceito.
4. Testar que `complete` **não** é emitido com 12 ou 13 dígitos.
5. Considerar o mesmo reforço em `tests/components/MaxInputCep.test.ts`, que também só usa `'01001000'` como CEP válido.

## Verificação

- `npx vitest run tests/components/MaxInputCpfCnpj.test.ts` com os novos casos.
- Checagem de mutação manual: alterar temporariamente `done` (`MaxInputCpfCnpj.vue:83-88`) para retornar `onlyNumbers(temp_value.value).length === 11` e confirmar que a suíte **falha** — hoje ela passaria.
- `npm run test:coverage` e conferir que os branches de `maskValue` (CPF/CNPJ/auto) ficam cobertos.
