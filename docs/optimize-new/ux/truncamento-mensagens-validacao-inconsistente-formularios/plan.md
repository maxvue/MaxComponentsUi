# Plano de implementação

## Objetivo e resultado esperado

Garantir que feedback de formulário permaneça integralmente visível/acessível em larguras suportadas e que todo estado inválido tenha explicação associada ao controle, preservando a densidade visual quando não há mensagem longa.

## Escopo e fora de escopo

- Em escopo: contrato/layout de mensagem em `InputBase` e adoção dos attrs acessíveis por seus consumidores diretos.
- Fora de escopo: política touched/dirty/submitted, conteúdo das regras de negócio e estados assíncronos de botões.

## Arquivos a alterar/criar

- `src/components/InputBase.vue`
- Consumidores diretos `src/components/MaxChips.vue`, `MaxColorPicker.vue`, `MaxInput*.vue` e `MaxTagSelect.vue` que renderizam `<InputBase>`
- `tests/components/InputBase.test.ts`
- Testes dos consumidores alterados em `tests/components/`
- `tests/architecture/inputBaseAccessibility.test.ts` (novo)

## Dependências e ordem

1. Corrigir fallback e layout em InputBase.
2. Formalizar attrs fornecidos pelo slot.
3. Migrar consumidores e adicionar guarda arquitetural.
4. Testar larguras e estados.

## Passos de implementação

1. Fazer `displayMessage` retornar mensagem textual explícita ou fallback configurável “Valor inválido” quando `error=true`/`done=false`; nunca renderizar estado vermelho sem texto.
2. Trocar linha fixa/ellipsis por `min-height` compacto e altura automática, permitindo wrap e quebra de palavras sem cortar conteúdo; `noMessage/noStatus` continuam removendo a área conforme contrato.
3. Expor no slot um objeto `inputAttrs` com `id`, `aria-invalid`, `aria-describedby` e `aria-required`; incluir `message-id` somente quando houver feedback aplicável.
4. Atualizar cada consumidor direto para aplicar `v-bind="inputAttrs"` ao controle nativo ou ao único widget ARIA proprietário, compondo sem sobrescrever IDs/descrições fornecidos pelo usuário.
5. Marcar ícones de status como decorativos e manter a região live com texto completo; evitar alert duplicado quando a mensagem apenas muda de ajuda para erro.
6. Criar teste arquitetural que monte representantes de input, textarea, select/combobox, chips e controles mascarados e valide ID/referência no elemento interativo real.
7. Adicionar casos visuais/DOM para texto longo, palavras extensas e viewport estreito, assegurando que `scrollWidth/height` não implique conteúdo inacessível.

## Migração e compatibilidade

Preservar props, aliases, slots e classes. A altura pode crescer para mensagens longas; manter 19 px como mínimo para alinhamento compacto. O fallback pode ser customizado por nova prop, mantendo default pt-BR.

## Testes

- Unitários: precedência de mensagem, `done=false`/`error=true`, noStatus/noMessage e texto multilinha.
- Integração: attrs no elemento real de todas as famílias representativas e composição de `aria-describedby` externo.
- Acessibilidade/visual: referência existente, texto integral em viewport estreito e foco/label preservados.

## Critérios de aceite mensuráveis

- Zero estados `is-error` sem texto não vazio, salvo `noStatus` explícito.
- 100% dos controles migrados recebem `aria-invalid` e descrição no nó interativo real.
- Mensagem de teste longa permanece integralmente disponível a 320 px, sem ellipsis.
- Altura sem mensagem ou com uma linha mantém a densidade atual dentro de tolerância de 1 px.

## Riscos e rollback

Altura variável pode desalinha grids e attrs podem colidir com consumidores. Mitigar com min-height, composição de IDs e rollout por família. Rollback pode restaurar alinhamento de uma linha, mantendo fallback e descrição acessível via expansão controlada.

## Validação final

Executar testes de InputBase e consumidores, teste arquitetural, lint/typecheck e comparação visual em desktop/320 px nos estados neutro, ajuda, caution, erro curto e erro longo.
