# MaxMsgLabels descarta o objeto de props e mistura idiomas na API

- **Categoria:** divergência
- **Severidade:** baixa
- **Arquivo(s):** `src/components/MaxMsgLabels.vue:16`, `src/components/MaxMsgLabels.vue:2-13`
- **Domínio:** tabela-layout-exibicao

## Problema

```ts
const _props = withDefaults(defineProps<{
    noErrors?: boolean;
    typeSelect?: string;
    obrigatorio?: boolean;
    msgError?: string;
    msg?: string;
}>(), { noErrors: false, obrigatorio: false });
```

O retorno é atribuído a `_props`, com o prefixo de descarte, mas o template **usa** as props diretamente (`noErrors` na linha 2, `typeSelect` na linha 2, `obrigatorio` na linha 3, `msgError` na linha 4, `msg` na linha 10). Isso funciona porque o compilador do `<script setup>` expõe as props ao template independentemente do nome da variável — mas o `_` sinaliza ao leitor (e às regras de lint) que o valor é descartado, o que é falso e enganoso. O restante da biblioteca usa consistentemente `const props = ...` e referencia `props.x` no template (ex.: `MaxGrid.vue:16`, `MaxTableFields.vue:113`, `MaxAiIcon.vue:37`).

Segundo ponto: a API mistura português e inglês no mesmo objeto de props — `obrigatorio` e `msgError`/`msg`/`noErrors`/`typeSelect`. A biblioteca é majoritariamente anglófona nas props públicas (`required` é o nome usado em `MaxTableFields.vue:38`, `MaxInputText`, etc.). Um consumidor que já usa `required` em todos os inputs precisa lembrar que aqui o nome é `obrigatorio`.

Terceiro: `typeSelect` é aplicado como **classe CSS** (`:class="typeSelect"`, linha 2) sem qualquer validação ou documentação de valores aceitos. O SCSS só define `.select` (linha 39). Qualquer outra string vira uma classe inerte, sem aviso.

## Impacto

- Convenção de nomenclatura quebrada, sugerindo incorretamente que as props não são usadas.
- API bilíngue inconsistente com o resto da biblioteca.
- `typeSelect` é um contrato implícito e não documentado entre a prop e o SCSS.

## Plano de correção

1. Renomear `_props` para `props` e referenciar explicitamente `props.x` no template, alinhando com os demais componentes.
2. Adicionar `required` como alias de `obrigatorio` (mantendo o antigo por compatibilidade) e marcar `obrigatorio` como deprecado no JSDoc.
3. Tipar `typeSelect` como união literal dos valores realmente suportados pelo SCSS (`'select'`) em vez de `string`, ou documentar explicitamente que é um gancho de classe livre.
4. Adicionar JSDoc a todas as props — o componente hoje não tem nenhum, ao contrário do padrão da biblioteca.

## Verificação

- `npm run lint` e `npm run type-check` sem regressões.
- `npx vitest run tests/components/MaxMsgLabels.test.ts` (7 testes existentes devem continuar passando).
- Teste asserindo que `required` e `obrigatorio` produzem o mesmo resultado.
