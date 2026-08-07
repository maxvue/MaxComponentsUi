# 01 — Diretório `migration_plans/` deletado silenciosamente

**Severidade:** Crítica
**Categoria:** Processo / Migração PrimeVue
**Arquivos:** `migration_plans/` (inexistente), `migration_executor.md:115-147`, `CLAUDE.md`, `migration_plan.md`

## Problema

O diretório com os 33 planos de migração autossuficientes foi apagado inteiro no commit `8746a182` (`feat: adiciona MaxButtonConfirm/MaxButtonIconConfirm e migra MaxInputText do PrimeVue`), sem menção na mensagem do commit. Toda a documentação de controle (CLAUDE.md, `migration_plan.md` e os 33 links da fila em `migration_executor.md`) ainda referencia `migration_plans/[Nome].md`.

O protocolo do executor ("abra o plano e execute-o integralmente") está quebrado: nenhuma migração futura pode seguir o processo documentado.

## Evidência

- `ls migration_plans` → diretório inexistente.
- `git show --stat 8746a182` lista `migration_plans/*.md` com 100% de deleções (ex.: `InputBase.md` 399 linhas, `MaxButton.md` 545 linhas).
- Os planos estão íntegros no histórico (`git show 8746a182^:migration_plans/MaxInputText.md` funciona).

## Correção sugerida

Restaurar via:

```bash
git checkout 8746a182^ -- migration_plans/
```

Ou, se a remoção foi intencional, atualizar CLAUDE.md, `migration_plan.md` e `migration_executor.md` para o novo local dos planos.
