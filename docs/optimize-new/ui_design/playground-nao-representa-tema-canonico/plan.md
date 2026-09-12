# Plano de implementação — playground como matriz do design system

## Objetivo e resultado esperado

Transformar o playground em catálogo verificável da identidade Max: shell tokenizado, tema claro/escuro, larguras predefinidas e cenários por componente/estado, com áreas experimentais separadas.

## Escopo e fora de escopo

- Escopo: estrutura do catálogo, cobertura pelo manifesto, controles de tema/viewport/estado e remoção de estilos de shell concorrentes.
- Fora: converter o playground em documentação pública, automatizar toda revisão visual ou proibir cores que sejam dados legítimos do exemplo.

## Arquivos-alvo

- `playground/src/main.ts` e `playground/src/App.vue`.
- Criar `playground/src/styles.scss`, `playground/src/catalog.ts`, `playground/src/components/PlaygroundToolbar.vue` e `playground/src/components/ScenarioCard.vue`.
- Criar `playground/src/scenarios/*.vue`, agrupados por família.
- Criar `tests/architecture/playgroundCoverage.test.ts`.
- Atualizar `README.md`/`CONTRIBUTING.md` com o fluxo de revisão.

## Dependências e ordem

1. Importar o tema distribuído e criar shell/toolbar canônicos.
2. Extrair exemplos existentes para cenários, sem reescrever comportamento.
3. Gerar matriz a partir de `src/components-manifest.json` e preencher lacunas por família.
4. Adicionar estados críticos, query params e regressão visual.
5. Integrar planos de tokens, tipografia, camadas e movimento antes de congelar baselines.

## Passos detalhados

1. Carregar `src/themes/all.scss` no entry do playground; usar `--font-sans`, superfícies, bordas, raios e sombras canônicos.
2. Remover gradiente roxo/fonte de sistema do shell e mover estilos inline de layout para classes semânticas. Manter cores customizadas somente quando rotuladas como dado do componente.
3. Toolbar alterna `.dark`, largura de preview (240/320/768/desktop), densidade e filtro/família sem editar código.
4. Persistir seleção em query params para reproduzir links de revisão; limpar efeitos no unmount.
5. Definir catálogo tipado que relacione cada componente canônico do manifesto a ao menos um cenário e marque aliases sem duplicar demos.
6. Para famílias críticas, cobrir default, hover/focus via roteiro, disabled, loading, erro, vazio, conteúdo longo e responsividade; separar exemplos que dependem de API/credenciais.
7. Área “experimental” deve ter rótulo e superfície distinta, sem contar como baseline canônico.
8. Teste arquitetural compara catálogo e manifesto, falhando para componente sem cenário ou referência inexistente.

## Migração e compatibilidade

- Nenhum código publicado ou API de componente muda.
- Valores reativos e exemplos atuais devem ser preservados durante a extração.
- O playground continua em `npm run dev:playground`; query params são aditivos.

## Testes pertinentes

- Teste de cobertura: 100% dos componentes canônicos do manifesto com cenário; aliases apontam ao canônico.
- Smoke de renderização por família sem warnings/exceções.
- Screenshots representativos em claro/escuro e 320/desktop, com baselines após os demais planos visuais.
- A11y: percurso por teclado da toolbar e auditoria dos estados focus/disabled/error.
- Benchmark: registrar tempo inicial e memória com catálogo lazy; cenários pesados não devem montar quando filtrados/fechados.

## Critérios de aceite

- Shell não contém gradiente roxo/fonte concorrente e usa tokens distribuídos.
- Tema e quatro larguras alternam pela UI/query param.
- Cobertura do manifesto é 100%, com matriz crítica documentada.
- Nenhum cenário comum depende de estilo inline de marca não rotulado.
- Smoke, teste arquitetural, screenshots, type-check e build do playground passam.

## Riscos, rollback e validação final

- Riscos: montar 113 componentes degradar a vitrine e baselines congelarem erros atuais. Mitigar com cenários lazy/filtrados e aprovar identidade antes das imagens.
- Rollback: manter catálogo e tema, desabilitando somente cenário problemático com justificativa; não restaurar shell divergente.
- Validar manifesto, filtros, URL reproduzível, temas, viewports, teclado, warnings e build.
