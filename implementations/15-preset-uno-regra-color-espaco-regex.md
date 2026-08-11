# 15 — presetMaxUno: regex do shortcut `color-*` com espaço literal nunca casa

**Severidade:** Alta
**Categoria:** Bug
**Arquivos:** `src/presetMaxUno.ts:24`

## Problema

O shortcut `[/^ color-(.+)$/, ...]` tem **um espaço literal após `^`** — nomes de utilitário nunca começam com espaço, então a regra `color-*` nunca casa. `color-blue-500` (citado no CLAUDE.md como classe suportada) só funciona se o presetWind3 a cobrir, com semântica diferente (sem `var(--...)` nem `!important`).

## Evidência

```bash
node -e "console.log(/^ color-(.+)$/.test('color-blue-500'))"  # false
```

## Correção sugerida

Remover o espaço: `/^color-(.+)$/`. Verificar visualmente no playground se cores de tema (`color-background-300` etc.) passam a aplicar `var(--...)`.
