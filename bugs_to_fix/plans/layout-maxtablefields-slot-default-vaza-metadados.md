# MaxTableFields imprime metadados de depuração no fallback do slot de coluna

- **Categoria:** falha
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxTableFields.vue:29-33`
- **Domínio:** tabela-layout-exibicao

## Problema

O conteúdo padrão do slot customizado de célula concatena o valor com o **nome do slot** e o **nome do campo**:

```vue
<slot v-if="col.slot && !col.input" :name="col.slot ?? col.field" ...>
    <div class="default-slot">
        {{ getFieldValue(row, col.field) }} {{ col.slot }} {{ col.field }}
    </div>
</slot>
```

Quando o consumidor declara `col.slot` mas não fornece o template correspondente (erro de digitação no nome do slot, slot condicional, ou uso deliberado do fallback), a célula renderiza algo como `João nome-cliente name` em vez de apenas `João`. É claramente resíduo de depuração.

O mesmo padrão aparece comentado na linha 70 (`<!-- {{ getFieldValue(row, col.field) }} {{ col.field }} -->`), reforçando que se trata de código de debug esquecido — com o efeito colateral de que colunas **sem** `slot` e **sem** `input` renderizam célula vazia (linhas 69-71), que é outro comportamento provavelmente indesejado: uma coluna somente-leitura simples não exibe nada.

## Impacto

- Nomes internos de slot/campo expostos na interface do usuário final.
- Colunas de exibição pura (sem `slot` e sem `input`) renderizam vazio, obrigando o consumidor a declarar um slot só para mostrar texto.

## Plano de correção

1. Reduzir o fallback do slot ao valor do campo:
   ```vue
   <div class="default-slot">{{ getFieldValue(row, col.field) }}</div>
   ```
2. Restaurar o ramo `v-else` (linhas 69-71) para exibir o valor do campo como texto, que é o comportamento documentado no próprio comentário ("Sem input: exibe o valor como texto"), removendo o bloco comentado.

## Verificação

- Teste com uma coluna `{ field: 'name', slot: 'inexistente' }` sem o slot correspondente, asserindo que o texto da célula é exatamente o valor do campo.
- Teste com uma coluna `{ field: 'name', header: 'Nome' }` (sem `slot`, sem `input`), asserindo que o valor aparece na célula.
- `npx vitest run tests/components/MaxTableFields.test.ts`.
