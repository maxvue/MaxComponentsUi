# Plano de implementação

## Objetivo e resultado esperado

Tornar ordenação, seleção e ação de linha de `MaxTable` operáveis por teclado e expor seus estados, preservando a semântica nativa de tabela e os modos local/lazy.

## Escopo e fora de escopo

- Em escopo: cabeçalhos `sortable`, `selectionMode` single/multiple e emissão `row-click` no modo data-driven.
- Fora de escopo: paginação já operável, template-driven sem operações declaradas e transformação geral em `grid`.

## Arquivos a alterar/criar

- `src/components/MaxTable.vue`
- `tests/components/MaxTable.test.ts`

## Dependências e ordem

1. Corrigir ordenação sem alterar o algoritmo.
2. Definir teclado/estado das linhas interativas.
3. Cobrir combinações com controles filhos e modos lazy/local.

## Passos de implementação

1. Inserir botão nativo de largura total em cada `th` ordenável; deixar `aria-sort` no `th` com `none`, `ascending` ou `descending` conforme `sortField/sortOrder`.
2. Encaminhar clique, Enter e Espaço nativos do botão para a função de ordenação já existente e manter ícone decorativo fora da árvore acessível.
3. Deixar linhas estáticas fora da ordem de Tab. Para linhas com `row-click` ou seleção, aplicar `tabindex="0"`, nome contextual configurável e `aria-selected` somente quando selecionáveis.
4. Definir Enter como ativação de `row-click` e Espaço como alternância de seleção; quando só uma dessas operações existir, a outra tecla não deve criar ação implícita.
5. Ignorar eventos originados em botões, links, inputs ou slots interativos da própria linha para evitar emissão/seleção dupla.
6. Preservar paginação, slots, ordenação client-side, payload lazy e identidade da linha.

## Migração e compatibilidade

Manter props/emits e payloads atuais. A inclusão do botão dentro do cabeçalho altera o DOM, mas conserva classes no `th` e adiciona classe específica ao botão. Adicionar prop de label de linha apenas se os dados não permitirem derivação segura.

## Testes

- Unitários: Enter/Espaço no sort, ciclo ascendente/descendente e `aria-sort`; lazy emite sem reordenar localmente.
- Integração: seleção single/multiple por Espaço, `aria-selected`, row-click por Enter e nenhuma duplicação em controle filho.
- Acessibilidade: tabela/thead/tbody permanecem nativos; somente linhas operáveis entram no Tab.

## Critérios de aceite mensuráveis

- Todos os cabeçalhos sortable são alcançáveis e ordenam por teclado com estado anunciado correto.
- Todas as linhas configuradas para seleção/ação são alcançáveis e emitem exatamente uma vez.
- Linhas não interativas possuem zero Tab stops adicionais.
- Testes de paginação, slots e lazy continuam passando.

## Riscos e rollback

CSS de cabeçalho pode depender de filhos atuais e linhas focáveis podem aumentar a sequência de Tab em tabelas extensas. Mitigar com estilos localizados e documentar o contrato; se necessário, migrar seleção para coluna de checkboxes nativos mantendo o botão de sort.

## Validação final

Executar `MaxTable.test.ts`, lint/typecheck e teste manual por teclado em sort, seleção simples/múltipla, row-click, controles de célula e modo lazy.
