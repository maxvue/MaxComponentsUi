# Relatório de preservação — R20 / F26

- **Papel:** `PRES5-R20`
- **Agente:** `/root/pres5_r20`
- **Parent ID:** `/root`
- **Início:** `2026-09-15T17:51:05-03:00`
- **Término:** `2026-09-15T17:52:06-03:00`
- **HEAD auditado:** `33e69a23db34796ed3f0d09dcde16ef012eccb41`
- **Modo:** somente leitura; nenhuma alteração de código de produção.
- **Veredito:** **ACEITO**

## Escopo exclusivo

Preservação de R20/F26: a anatomia visual compartilhada das tabelas continua centralizada em `_table-anatomy.scss`, consumida por `MaxTable` e `MaxTableFields`, sem reintroduzir no `MaxTable.vue` as regras fundamentais de container, cabeçalho, linha, zebra e célula.

## Evidência inspecionada

- `src/themes/_table-anatomy.scss` exporta os mixins canônicos `table-container`, `table-header-row`, `table-header-cell`, `table-body-row`, `table-row-zebra`, `table-cell-base` e `table-cell-input-feedback`.
- `src/components/MaxTable.vue` importa o módulo e inclui esses mixins; as propriedades fundamentais não voltaram a ser declaradas inline nos blocos `thead > tr` e `tbody > tr`.
- `src/components/MaxTableFields.vue` também importa o mesmo módulo compartilhado.
- A auditoria AST não depende apenas de texto: restringe aliases legados a tag, pai imediato, ancestral, classe canônica associada e cardinalidade exata; também rejeita seletores `.p-*` no `<style>`.

## Execuções independentes

```bash
npx vitest run tests/architecture/tableAnatomyConsistency.test.ts --reporter=verbose
```

Saída relevante:

```text
Test Files  1 passed (1)
     Tests  15 passed (15)
```

Os testes incluem mutações adversariais que obrigatoriamente falham ao duplicar ou mover alias, colocá-lo numa `div` plausível, trocar a tag de célula, inserir seletor legado no estilo, inserir alias não catalogado ou remover a classe canônica irmã.

```bash
npx vitest run tests/components/MaxTable.test.ts tests/components/MaxTableFields.test.ts --reporter=verbose
```

Saída relevante:

```text
Test Files  2 passed (2)
     Tests  78 passed (78)
```

Esta segunda execução preserva o comportamento funcional de ambas as tabelas, incluindo renderização, slots, ordenação, seleção, estados loading/empty, virtualização e feedback de célula.

## Conclusão

R20/F26 permanece preservado no HEAD auditado. A centralização dos mixins e o guard estrutural com mutações detectáveis impedem a divergência que este bloco havia corrigido.
