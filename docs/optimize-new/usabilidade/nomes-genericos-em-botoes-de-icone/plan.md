# Plano de implementação — nomes contextuais em botões de ícone

## Objetivo e escopo

Exigir nome acessível específico para ações icon-only e propagar labels/tooltips dos modelos dinâmicos. Manter heurística somente como compatibilidade temporária com aviso em desenvolvimento.

## Fora de escopo

Não renomear ícones, remover tooltips ou alterar ações; o plano trata somente o nome acessível contextual e sua propagação.

## Arquivos

- Alterar `src/components/MaxIconButton.vue` e `tests/unit/MaxIconButton.spec.ts`.
- Alterar `MaxTopToolbar.vue`, `MaxTopToolbarSubmenu.vue`, `MaxMenuVerticalItem.vue` e tipos dos itens.
- Inventariar outros consumidores de `MaxIconButton` e ajustar os sem nome.
- Atualizar documentação.

## Dependências e ordem

1. Inventário de consumidores.
2. Definir prioridade do nome.
3. Propagar modelos dinâmicos.
4. Depreciar fallback e ativar gate.

## Passos

1. Prioridade: `aria-label` explícito, label acessível, title/tooltip contextual; ícone técnico não é contrato.
2. Adicionar campo obrigatório em tipos de itens dinâmicos quando icon-only e repassá-lo ao botão.
3. Em desenvolvimento, emitir warning único por instância quando faltar nome; fallback heurístico fica por uma versão.
4. Em próxima major, remover “Botão de ação” e falhar tipagem/dev para ausência.
5. Criar teste/inventário que monta coleções e rejeita nome vazio ou genérico repetido.
6. Não usar tooltip como única fonte se não produzir accessible name persistente.

## Migração e testes

Mudança de tipos em duas fases: campo opcional+warning, depois obrigatório em major. Unitários cobrem prioridade/warning/disabled; integração monta toolbars/menu com ícones desconhecidos; axe verifica nomes únicos/contextuais. Benchmark não se aplica.

## Aceite

Zero botão icon-only inventariado com nome genérico; modelos dinâmicos fornecem contexto; ausência gera warning hoje e erro de tipo na versão-alvo; nomes comuns explícitos continuam.

## Riscos e rollback

Tornar obrigatório imediatamente quebra consumidores; fasear. Title pode divergir de aria-label; derivar de uma fonte. Rollback mantém warning/fallback, não remove campos contextuais.

## Validação final

Inventário estático+mount, testes dos consumidores/axe, type-check de fixtures de tipos, suíte, lint e `git diff --check`.
