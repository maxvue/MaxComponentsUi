# Subpaths documentados não existem no mapa de exports

## Resumo
README e documentação instruem importações por `/stores` e `/prime`, mas `package.json` exporta apenas raiz, `/preset` e `/resolver`. Node bloqueia esses imports antes de carregar qualquer arquivo.

## Severidade e prioridade
**Alta / P1.** Código copiado da documentação falha no consumidor.

## Evidências
- `package.json:7-20`: mapa `exports` não contém `./stores` nem `./prime`.
- `README.md:125-126` lista ambos como entrypoints.
- `docs/STORES.md:3-21` ensina `import ... from '@maxvue/max-components-ui/stores'`.
- `docs/PRIME.md:3-12` e `docs/AUTO-IMPORT.md:34,90` ensinam `/prime`.
- `node --input-type=module -e "import('@maxvue/max-components-ui/stores')"` retorna `ERR_PACKAGE_PATH_NOT_EXPORTED`; `/prime` retorna o mesmo.
- `src/index.ts:66` exporta stores pela raiz, mas não cria subentry; a fase atual declara remoção de PrimeVue.

## Afetados
Consumidores seguindo README/STORES/PRIME/AUTO-IMPORT e compatibilidade de versões.

## Causa-raiz
Mapa de exports foi alterado na migração sem sincronização/validação executável da documentação e dos entrypoints públicos.

## Impacto
Build de apps consumidores falha imediatamente. Para `/prime`, README, PRIME e AUTO-IMPORT prometem compatibilidade que já não existe; o resolver atual já retorna somente componentes do entry raiz.

## Reprodução
Executar os dois imports dinâmicos citados ou instalar tarball em projeto vazio e importar conforme docs.

## Direção de correção
Decidir contrato: implementar/exportar subpath sustentado ou atualizar docs com migração explícita. Testar todos os snippets contra o tarball, inclusive tipos.

## Critérios de aceite
- Todo subpath documentado resolve em Node/bundler e possui tipos, ou foi removido das docs com nota de migração.
- Documentação de auto-import não aponta a entry inexistente e corresponde ao resolver atual.
- Teste automatizado valida o tarball, não só imports do source.

## Contraevidências consideradas
Stores podem ser importadas da raiz hoje; isso oferece alternativa, mas não torna válido o caminho explicitamente documentado. A remoção intencional de `/prime` exige atualização coordenada, não restauração automática. `src/helpers/MaxComponentsUiResolver.ts` já não usa fallback PrimeVue e resolve pelo entry raiz, portanto não é código defeituoso neste achado.
