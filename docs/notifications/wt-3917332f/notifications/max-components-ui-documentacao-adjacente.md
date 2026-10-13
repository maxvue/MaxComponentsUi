# Documentação adjacente desatualizada fora do escopo MaxGrid

- Data: 2026-10-13; revisão `3b9c5ce94b68f7cae3186152a70f2bd80016cecd`.
- Achados por leitura, sem execução ou alterações nas fontes.

## Tema e configuração legados

- Localização: `README.md:89–112,166`.
- Evidência: configuração avançada apresenta customização PrimeVue/Aura; as instruções canônicas `AGENTS.md`, seção 3, declaram independência concluída e proíbem reintrodução de dependências/imports PrimeVue.
- Impacto: consumidores podem interpretar instruções históricas como contrato atual.
- Encaminhamento: tarefa específica de revisão do tema/bootstrap e suas opções. O plano MaxGrid não reescreve a documentação global de tema. Trechos legados não devem ser copiados para os novos exemplos.

## MaxGridCols no playground e no catálogo

- Localização: `playground/src/catalog.ts:122`, `playground/src/scenarios/layout-grid.vue:28–46`, `COMPONENTS.md:1194–1199` e `src/components/MaxGridCols.vue:1–19`.
- Evidência: o catálogo descreve colunas automáticas/flexíveis; a implementação usa CSS Grid com `repeat(24, 1fr)`. O playground apresenta estados `disabled`, `error` e `severity`, mas o componente não os implementa. O catálogo Markdown menciona `useAttrs()` que não existe nesse SFC.
- Impacto: material demonstrativo/documental do componente irmão pode induzir uso incorreto.
- Encaminhamento: revisar MaxGridCols separadamente. A atualização do bloco MaxGrid não autoriza modificar blocos vizinhos ou o runtime do irmão.

## Convenção de tags no input usado como referência

- Localização: `src/components/MaxInputText.vue:2–22`.
- Evidência: tags de abertura têm atributos distribuídos em múltiplas linhas, enquanto `AGENTS.md`, seção 5.1, exige abertura em linha única.
- Impacto: copiar literalmente o arquivo reproduziria a divergência de convenção nos novos exemplos.
- Encaminhamento: manter os novos exemplos conformes; não formatar o componente nesta tarefa documental.
