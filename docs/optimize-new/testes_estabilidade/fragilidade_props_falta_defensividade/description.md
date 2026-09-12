# MaxLoader renderiza componente inexistente e usa attrs como props

## Resumo
`MaxLoader` usa `<LoaderIcon />` sem importação/registro e implementa `show`/`label` por `useAttrs()` com `any`. O Vue renderiza uma tag desconhecida e só emite warning; attrs operacionais são replicados no `<div>` raiz.

## Severidade e prioridade
**Alta / P1.** O indicador visual central fica ausente em consumo normal.

## Evidências
- `src/components/MaxLoader.vue:2-5`: template usa `<LoaderIcon />` e espalha `attrs`.
- `src/components/MaxLoader.vue:10-13`: não há import e `attrs` é `any`.
- `src/index.ts:134-136`: o nome público é `MaxLoaderIcon`, não `LoaderIcon`.
- A suíte `IconsAndLoaders` passa emitindo `[Vue warn]: Failed to resolve component: LoaderIcon`.
- `tests/components/IconsAndLoaders.test.ts:77-85` mascara somente um caso com stub manual.

## Afetados
`MaxLoader`, consumidores do spinner, markup e suíte agregada.

## Causa-raiz
Dependência implícita de registro global inexistente e `$attrs` usado como substituto de props, retirando o contrato do compilador.

## Impacto
O loader mostra no máximo o rótulo, sem sinal visual. `label`, `show` e attrs internos vazam ao DOM e strings não recebem coerção de prop.

## Reprodução
Montar sem `global.components`; observar o warning/ausência de `.max-loader-icon` e o root ao passar `label`.

## Direção de correção
Importar `MaxLoaderIcon`, declarar props tipadas, filtrar attrs DOM e fazer warnings inesperados falharem testes.

## Critérios de aceite
- Montagem limpa com ícone real.
- `show`/`label` são props públicas.
- Props operacionais não vazam ao DOM.
- Teste valida árvore real sem stub.

## Contraevidências consideradas
Um app pode registrar `LoaderIcon` por conta própria, mas isso não integra a instalação/exportação da biblioteca.
