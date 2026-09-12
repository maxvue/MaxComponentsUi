# Botões de ícone recebem nome genérico em contextos distintos

## Resumo
`MaxIconButton` inventa o nome “Botão de ação” quando não reconhece o nome técnico do ícone. Consumidores dinâmicos frequentemente não passam label/title, criando várias ações indistinguíveis.

## Severidade e prioridade
Alta — P1. WCAG 2.4.6 e 4.1.2.

## Evidências
- `src/components/MaxIconButton.vue:60-75`: heurística limitada e fallback genérico.
- `src/components/MaxTopToolbar.vue:31-42` e `MaxTopToolbarSubmenu.vue:27-36`: itens dinâmicos passam ícone/ação, não seu tooltip/label como nome.
- `src/components/MaxMenuVerticalItem.vue:13-19`: botão interno recebe ícone/rota sem nome contextual.
- `tests/unit/MaxIconButton.spec.ts:76-117`: o fallback genérico é explicitamente esperado.

## Afetados
MaxIconButton e consumidores icon-only dinâmicos em toolbars, menus, tabelas e tabs.

## Causa-raiz
Nome acessível foi inferido de identificador técnico em vez de exigido do contrato da ação.

## Impacto e reprodução
Renderizar dois ícones desconhecidos sem label e navegar com leitor: ambos são anunciados “Botão de ação”, sem distinguir finalidade.

## Direção de correção
Exigir nome acessível para icon-only; propagar label/tooltip do item; manter heurística apenas como compatibilidade com aviso de desenvolvimento.

## Critérios de aceite
Todo botão icon-only tem nome específico e contextual; listas não contêm nomes repetidos genéricos; testes falham quando falta nome.

## Contraevidências
Props `aria-label`, `label` e `title` funcionam, e ícones comuns possuem heurística. O defeito ocorre quando consumidores omitem contexto.
