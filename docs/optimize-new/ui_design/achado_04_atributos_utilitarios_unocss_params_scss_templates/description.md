# Utilitários Attributify ainda aparecem na implementação interna

## Resumo

UnoCSS, Attributify e os seletores de `params.scss` são APIs públicas mantidas, logo não devem ser removidos como “vazamento” global. A inconsistência confirmada é interna e limitada: alguns SFCs ainda usam atributos nus (`pointer`, `transparent`, `flex`) para sua própria anatomia, contrariando a convenção atual de classes semânticas locais e dependendo do stylesheet global para funcionar.

## Severidade e prioridade

- Severidade: baixa.
- Prioridade: P3.

## Componentes impactados

- `MaxButtonConfirm`, `MaxIconConfirm`, `MaxTogglePopover`, `MaxInputFile`, `MaxTopToolbar` e `MaxTopToolbarSubmenu`.

## Evidências

- `src/themes/params.scss:3-113`: seletores como `[transparent]`, `[no-padding]`, `[center]`, `[flex]` e `[pointer]` são distribuídos globalmente como compatibilidade/API utilitária.
- `src/components/MaxButtonConfirm.vue:2`, `MaxIconConfirm.vue:2` e `MaxTogglePopover.vue:4-7`: usam `pointer` em componentes internos.
- `src/components/MaxInputFile.vue:13,31`: usa `flex` em slots.
- `src/components/MaxTopToolbar.vue:25` e `MaxTopToolbarSubmenu.vue:20`: usam `transparent` em botões internos.
- `MaxTitle1` já usa classe semântica reativa (`:class="{ center: center }"`), então a ocorrência antiga de `<div center>` não existe mais.

## Causa-raiz

A biblioteca mantém Attributify como contrato para consumidores, mas parte da implementação histórica também o usa. A ausência de uma fronteira automatizada entre API pública e convenção interna permite que novos usos reapareçam.

## Impacto

- O comportamento visual interno depende de `params.scss`, mesmo quando o SFC deveria ser compreensível e estável por seus estilos locais.
- Atributos desconhecidos podem chegar ao DOM por fallthrough e dificultar inspeção, tipagem e testes.
- A manutenção da API pública fica acoplada a detalhes internos desnecessários.

## Reprodução e verificação

Renderizar os componentes citados com e sem o entry global de tema e inspecionar os atributos no DOM. Confirmar quais usos são API aceita do consumidor e quais são exclusivamente implementação interna.

## Direção de solução

Migrar apenas os usos internos para classes/props semânticas já suportadas, preservando `params.scss`, o preset e o modo Attributify como API pública. Adicionar lint ou teste arquitetural restrito a `src/components` para impedir novos atributos utilitários internos.

## Critérios de aceite

- SFCs internos não dependem de atributos utilitários nus para sua anatomia.
- A API UnoCSS/Attributify pública permanece funcional e documentada.
- Nenhum alias público é removido sem política de compatibilidade.
- Testes distinguem fallthrough deliberado de atributo estilístico acidental.

## Contraevidências consideradas

- Os seletores globais são intencionais e úteis aos consumidores; sua existência não é defeito.
- A alegação anterior de erro inevitável no `vue-tsc` não foi demonstrada.
