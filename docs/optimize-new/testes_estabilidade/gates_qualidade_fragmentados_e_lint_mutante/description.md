# Gates de qualidade fragmentados e lint oficial mutante

## Resumo
Não há comando/CI que valide conjuntamente tipos, build, testes e lint. O único script de lint aplica `--fix`, não serve como verificação imutável, e o release nem o executa. Hoje testes passam enquanto type-check, build e ESLint falham.

## Severidade e prioridade
**Alta / P1.** Branch/pacote pode parecer saudável por um gate parcial e acumular correções automáticas não revisadas.

## Evidências
- `package.json:31-40`: scripts são separados; `lint` é `eslint . --fix && stylelint ... --fix` e não existe `verify`/`lint:check`.
- `package.json:36`: `release` chama type-check/build/test, mas omite lint.
- Não existe `.github/workflows` no inventário.
- `npx eslint .` sai 1 em `src/stores/useLogin.Store.ts:175` (`curly`); stylelint sem fix passa.
- `npm test` passa 2.481 casos, enquanto `npm run type-check` e `npm run build` saem 1.
- `tsconfig.json:2-13` não inclui `tests`; Vitest transpila testes sem checá-los e não há `tsconfig.test.json`.

## Afetados
CI/release, source TypeScript/Vue, 176 arquivos de teste e manutenção automática.

## Causa-raiz
Formatação, lint e validação foram fundidos em um comando mutante; gates foram criados isoladamente e nunca compostos em política automatizada. A suíte não tem projeto TS próprio.

## Impacto
Executar `npm test` sozinho fornece falso sinal. CI não pode chamar o script oficial de lint sem modificar checkout; testes/mocks podem conter erros de tipo e releases ignoram violações lint.

## Reprodução
Executar, separadamente, `npm test`, `npm run type-check`, `npm run build`, `npx eslint .` e `npx stylelint "src/**/*.{scss,vue}"` e comparar códigos de saída.

## Direção de correção
Criar comandos imutáveis `lint:check`/`verify`, separar `format/fix`, adicionar tsconfig de testes e workflow que rode instalação limpa, type-check, build, lint, testes e audit.

## Critérios de aceite
- Um único gate imutável falha se qualquer etapa falhar.
- `lint` de verificação não altera arquivos; correção tem comando separado.
- Testes passam por checagem TypeScript.
- Release/CI usam o gate completo.

## Contraevidências consideradas
O script `release` já impede publicação manual pelos erros atuais de type-check. Isso é proteção parcial, não cobre lint, instalação limpa nem PRs que executem apenas testes.
