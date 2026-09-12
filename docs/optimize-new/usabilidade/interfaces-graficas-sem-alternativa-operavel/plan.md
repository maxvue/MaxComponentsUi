# Plano de implementação — alternativas operáveis para interfaces gráficas

## Objetivo e resultado

Disponibilizar informação e operação equivalentes sem visão ou ponteiro em PDF, Chart, Maps, Dividers e preview/crop de Image, mantendo canvas/drag como opções adicionais.

## Escopo e fora de escopo

Cobrir leitura e operação alternativa nos cinco componentes citados. Não substituir canvas, mapa ou gestos visuais, nem redesenhar suas APIs de domínio além do necessário para expor ações equivalentes.

## Arquivos

- Alterar `MaxPdfView.vue`, `MaxChart.vue`, `MaxMaps.vue`, `MaxDividers.vue` e `MaxImage.vue`, seus tipos exportados e testes.
- Criar helpers de tabela/dados acessíveis apenas se compartilhados.
- Atualizar documentação/exemplos das novas props e slots.

## Dependências e ordem

1. Definir contrato textual por componente.
2. PDF/Chart leitura.
3. Maps/Dividers operação.
4. Image preview/crop.
5. Testes assistivos. Coordenar com focus trap e nomes de botões.

## Passos

1. PDF: habilitar text/annotation layers por padrão quando suportadas, nomear documento/páginas e fornecer link de download/abertura como fallback.
2. Chart: exigir nome ou legenda visível, derivar tabela acessível de labels/datasets e oferecer seleção equivalente via linhas/botões com o mesmo payload sem MouseEvent obrigatório.
3. Maps: adicionar campos nativos de latitude/longitude e/ou comandos de passo, sincronizados com marker e limites válidos.
4. Dividers: aplicar `aria-orientation`, `aria-valuemin/max/now` e setas/Home/End ajustando a mesma proporção do drag.
5. Image: tornar preview um button; fornecer controles de crop por teclado (setas + modificadores ou campos numéricos), instruções e valores anunciados.
6. Garantir que métodos alternativos resultem no mesmo estado/emits e não dupliquem ações.
7. Expor slots para descrições complexas sem exigir HTML oculto fixo.

## Migração e testes

Props/slots novos são aditivos; `select` do Chart deve ganhar payload compatível sem quebrar consumidores (campo originalEvent opcional somente em major ou evento alternativo). Unitários testam equivalência de estado/emits; browser testa teclado; testes de acessibilidade com axe e leitor validam nome/estrutura. Benchmark verifica que fallback de Chart não duplica canvas pesado, sem gate rígido.

## Aceite

Cada operação citada funciona só com teclado; PDF/Chart têm alternativa textual; valores de mapa/divisor/crop são anunciados e sincronizados; resultados/emits equivalem ao ponteiro; axe sem violações críticas.

## Riscos e rollback

Text layer pode afetar performance/layout; carregar progressivamente. Tabela grande pode ser verbosa; oferecer resumo + tabela expansível. Controles duplicados podem divergir; uma fonte de estado. Rollback permite ocultar fallback visual, nunca remover sua disponibilidade acessível sem alternativa.

## Validação final

Testes por componente, matriz teclado/leitor/zoom, comparação de emits ponteiro×teclado, suíte, type-check, performance PDF/Chart e `git diff --check`.
