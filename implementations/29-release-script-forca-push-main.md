# 29 — Script de release faz push em main incondicionalmente e sem testes

**Severidade:** Média
**Categoria:** Processo / CI
**Arquivos:** `package.json` (script `release`)

## Problema

`npm version patch` + `git push origin main --follow-tags` roda incondicionalmente. Executado do branch `dev` (branch atual do repositório), o `npm version` commita/taga em `dev`, mas o push tenta `main` — estado inconsistente de tags. O pipeline também não roda testes/type-check antes de publicar.

## Correção sugerida

Guardar com checagem de branch (`[ "$(git branch --show-current)" = main ]`) e incluir `npm run type-check && npm test` antes do version/publish.
