# Plano de implementação — gate de qualidade imutável

## Objetivo e resultado

Criar um comando único que falhe por tipos, testes tipados, lint, build ou testes, sem modificar o checkout, e usá-lo em CI e release.

## Escopo e fora de escopo

- Separar verificação de autofix.
- Criar tsconfig de testes e workflow de PR/push.
- Corrigir as falhas atuais necessárias para o gate nascer verde.
- Não alterar regras de lint/cobertura para mascarar violações; cobertura detalhada pertence ao achado próprio.

## Arquivos

- Alterar `package.json`, `tsconfig.json`/`vitest.config.ts` e configs ESLint/Stylelint se necessário.
- Criar `tsconfig.test.json` e `.github/workflows/quality.yml`.
- Corrigir arquivos apontados pelos gates em commits/etapas separados, incluindo `src/stores/useLogin.Store.ts`.
- Atualizar documentação de contribuição/release.

## Dependências e ordem

1. Resolver o grafo duplicado de Vue do achado P0.
2. Criar comandos check-only.
3. Tipar testes e corrigir débitos.
4. Compor `verify`.
5. Ativar CI/release.

## Passos

1. Definir `lint:check` com ESLint/Stylelint sem `--fix` e `lint:fix` separado.
2. Criar `type-check:test` incluindo tests, setup e configs, com tipos Vitest/DOM.
3. Corrigir erros existentes sem casts abrangentes.
4. Definir `verify` com instalação limpa validada no CI, type-check source/testes, lint, testes e build.
5. Alterar `release`/`prepublishOnly` para depender do gate.
6. Criar workflow com cache por lockfile, Node fixado e checkout limpo; ao final, falhar se `git diff` não estiver vazio.
7. Evitar execução duplicada desnecessária de `vue-tsc` no build após estabilizar scripts.

## Migração e testes

Comandos antigos de fix podem ser preservados como alias documentado, mas `lint` deve tornar-se check-only ou ter renomeação comunicada. Testar intencionalmente cada gate em fixture/mutação e confirmar código não zero. A11y/benchmark não se aplicam diretamente.

## Aceite

- `npm run verify` cobre todas as etapas e passa em checkout limpo.
- `npm run lint:check` não altera nenhum arquivo.
- Erro em source, teste, lint ou build derruba o gate.
- CI e release chamam `verify`.
- Testes estão incluídos em checagem TypeScript.

## Riscos e rollback

Ativação imediata pode bloquear PRs por dívida existente; corrigir antes ou introduzir ratchet temporário explícito. Scripts encadeados podem duplicar custo; medir duração. Rollback desativa workflow, nunca volta a lint mutante como gate.

## Validação final

Executar instalação limpa, `npm run verify`, comparar `git status` antes/depois e simular uma falha por etapa.
