# Inventário R16 — `--background-650`

Data: 2026-09-15. A busca é executada sobre `src` com `rg -- '--background-650' src`.
Usos em conteúdo habilitado foram migrados para tokens semânticos com contraste
WCAG AA nos fundos canônicos claro e escuro. Os únicos usos em componentes que
permanecem são exceções não informativas ou estados indisponíveis.

| Arquivo | Seletor/estado | Classificação | Decisão |
|---|---|---|---|
| `MaxAccordionItem.vue` | cabeçalho `.max-accordion-item-header-disabled` | disabled | Mantido: não é conteúdo disponível. |
| `MaxInputOTP.vue` | célula `:disabled` | disabled | Mantido: campo indisponível. Separador e placeholder usam tokens semânticos. |
| `MaxSideMenuMobile.vue` | `.mobile-app-version` | metadado não interativo | Mantido: versão é informação auxiliar do shell, fora de controles e fluxos de tarefa. |
| `themes/params.scss` | `[disabled]` legado | compatibilidade de estado disabled | Mantido para consumidores legados; não se aplica a conteúdo habilitado. |
| `themes/tokens.scss` | `--max-content-disabled` | token de estado disabled | Mantido por definição do papel semântico. |
| `themes/colors.scss` | definição da variável | primitiva | Mantido como token público compatível. |

Migrações verificadas: placeholders (`MaxBaseInput`, `MaxChips`,
`MaxInputTextArea`, `MaxInputOTP`) usam `--max-content-placeholder`; sublabels,
weekday, mensagem de tabela e `MaxEmptyDiv` usam `--max-content-secondary`; hover de aba usa
`--background-775`. O teste arquitetural deriva alvos de Tab dos templates e
os associa ao seletor de foco local ou à rede global canônica; o teste Chromium
mede Tab, temas claro/escuro, forced-colors e zoom de 200%.
