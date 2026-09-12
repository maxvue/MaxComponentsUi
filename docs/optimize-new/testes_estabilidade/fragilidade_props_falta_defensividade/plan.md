# Plano de implementação — contrato defensivo do MaxLoader

## Objetivo e resultado esperado

Fazer `MaxLoader` renderizar seu ícone real sem depender de registro global e transformar `show`/`label` em props tipadas, impedindo vazamento de atributos operacionais ao DOM.

## Escopo e fora de escopo

- Escopo: import local, props, encaminhamento de attrs e testes sem stub.
- Fora: redesenhar loader, loading global ou alterar `MaxLoaderIcon`.

## Arquivos-alvo

- `src/components/MaxLoader.vue`.
- `tests/components/IconsAndLoaders.test.ts` ou novo `tests/components/MaxLoader.test.ts`, sem duplicar cobertura.

## Dependências e ordem

1. Reproduzir warning e ausência do ícone sem registro global.
2. Declarar props/import e controlar attrs.
3. Remover stub que mascarava o defeito.
4. Validar consumo pelo entry principal.

## Passos detalhados

1. Importar `MaxLoaderIcon` e usá-lo explicitamente no template.
2. Declarar `show?: boolean` com default `true` e `label?: string`; usar `props` no template.
3. Definir `inheritAttrs: false` e aplicar `$attrs` uma única vez no elemento raiz. Como `show` e `label` passam a ser props, Vue os remove de `$attrs`.
4. Preservar classes, slots inexistentes e estilos atuais; não renomear exportações.
5. Configurar o teste focado para falhar diante de warning de componente não resolvido.

## Migração e compatibilidade

- Uso com `:show` e `label` permanece compatível e ganha tipagem/coerção Vue.
- Atributos DOM legítimos (`id`, `class`, `aria-*`, `data-*`) continuam no root.
- O nome público continua `MaxLoader`; nenhum registro `LoaderIcon` do host é necessário.

## Testes pertinentes

- Montar sem stubs/registro global e exigir `.max-loader-icon-div` real e zero warnings.
- Testar default visível, `show=false`, alternância reativa e label.
- Afirmar ausência de atributos `show`/`label` no HTML e presença de attrs DOM/ARIA legítimos.
- Validar SSR e exportação pelo entry; não há mudança a11y além de preservar attrs fornecidos.

## Critérios de aceite

- Ícone real sempre renderiza quando `show=true`.
- Montagem emite zero warning de resolução.
- `show` e `label` constam dos tipos gerados e não aparecem no DOM.
- Testes focados, type-check, suíte e build passam.

## Riscos, rollback e validação final

- Risco: consumidores dependentes de componente global homônimo. O contrato correto é o ícone interno; documentar a correção.
- Rollback: restaurar somente o markup se houver regressão visual, mantendo props tipadas e import explícito.
- Validar árvore real, attrs, alternância, SSR, declarações geradas e build.
