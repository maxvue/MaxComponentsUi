# Toolbars de edição não expõem agrupamento nem estado de alternância

## Resumo
As toolbars de código e Markdown são `div`s genéricas e os comandos que representam alternâncias comunicam estado somente por classe visual. O uso de botões nativos mantém a operação básica por Tab/Enter/Espaço.

## Severidade e prioridade
Média — P2. WCAG 1.3.1 e 4.1.2.

## Evidências
- `src/components/MaxInputCodeToolbar.vue:2,111-140`: o agrupamento não tem nome/papel e `wordWrap`, `minimap` e `isFullscreen` usam somente a classe `active`, sem `aria-pressed`.
- `src/components/MaxInputMarkdownToolbar.vue:2,8-135,149-208`: o agrupamento não tem nome/papel e comandos de estado (`bold`, `italic`, listas, citação, código, link e tabela) usam somente a classe `active`.

## Afetados
`MaxInputCodeToolbar` e `MaxInputMarkdownToolbar`.

## Causa-raiz
A migração para botões nativos preservou operação básica, mas não modelou no DOM o agrupamento e o estado dos comandos persistentes.

## Impacto e reprodução
Leitor de tela não anuncia, por exemplo, que “Negrito” ou “Quebra automática” está pressionado, e não identifica o conjunto de comandos como barra de ferramentas.

## Direção de correção
Adicionar `role="toolbar"` com nome e `aria-pressed` apenas aos comandos que representam estado persistente. Roving tabindex e setas/Home/End podem ser adotados como aprimoramento do padrão toolbar, desde que preservem controles nativos internos como o `select`.

## Critérios de aceite
- Toolbars possuem papel e nome acessível.
- Toggles anunciam estado sem transformar ações momentâneas em botões pressionáveis.
- A navegação nativa por Tab continua funcional; se roving for adotado, setas/Home/End percorrem comandos habilitados sem prender o foco.

## Contraevidências
Botões nativos continuam utilizáveis por Tab/Enter/Espaço. Roving tabindex, setas e alvo de 44 px são recomendações de ergonomia/APG, não falhas WCAG demonstradas aqui; os botões de 28 px superam o mínimo de 24 px da WCAG 2.2 AA. Acordeões e `MaxChips` não fazem parte do escopo comprovado.
