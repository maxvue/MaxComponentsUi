# Migração interna de classes `.p-*` permanece incompleta

## Resumo

A presença de classes `.p-*` não comprova dependência de runtime do PrimeVue: o `GEMINI.md` e `tokens.scss` registram esses nomes como aliases de compatibilidade pública durante a Fase 2. O problema sustentado é mais estreito: vários componentes ainda usam a taxonomia legada como seletor interno principal, e `InputBase` precisa conhecer tanto nomes `.max-*` quanto `.p-*`. Isso aumenta o custo da migração, mas não é falha funcional nem autoriza remover aliases públicos sem transição.

## Severidade e prioridade

- Severidade: média.
- Prioridade: P2.

## Componentes impactados

- `InputBase`, `MaxButton`, `MaxInputSelect`, `MaxTagSelect`, `MaxTopToolbar`, `MaxTopToolbarSubmenu`, `MaxInputAutoComplete`, `MaxInputAutoCompleteApi`, `MaxInputFileUpload`, `MaxTable`, `MaxInputIconPicker`, `MaxLikeButton`, `MaxInputPhone` e `MaxUserSection`.

## Evidências

- `src/components/InputBase.vue:285-585`: o wrapper já aceita seletores semânticos `.max-*`, mas mantém seletores paralelos `.p-*` e vários `!important`.
- `src/components/MaxInputSelect.vue:9-161` e `src/components/MaxTagSelect.vue:17-132`: o DOM expõe simultaneamente classes `.max-select-*` e aliases `.p-select-*`.
- `src/components/MaxButton.vue:73-87,150-360`: classes canônicas e legadas são emitidas e estilizadas em paralelo.
- `src/themes/tokens.scss:1-5`: os nomes herdados são preservados deliberadamente até o sweep da Fase 2.
- O projeto não importa PrimeVue nos SFCs; portanto, “falsa independência” e severidade crítica da descrição anterior não se sustentam.

## Causa-raiz

A migração priorizou independência de implementação e compatibilidade de consumidores antes da troca completa da taxonomia. A camada interna ainda não separa claramente classe canônica, alias público legado e seletor de anatomia.

## Impacto

- Alterações de anatomia exigem manter dois namespaces sincronizados.
- Seletores profundos e `!important` ampliam especificidade e tornam refactors mais arriscados.
- Sem inventário de API pública, uma remoção indiscriminada pode quebrar CSS e testes de consumidores.

## Reprodução e verificação

Inventariar classes renderizadas e seletores internos, distinguindo os aliases observáveis externamente dos nomes usados apenas pela implementação. Confirmar que os componentes continuam funcionais sem pacotes PrimeVue instalados.

## Direção de solução

Concluir o sweep previsto na Fase 2 com classes `.max-*` como implementação canônica. Manter aliases `.p-*` por uma janela de compatibilidade documentada e coberta por testes, removendo-os somente em mudança de versão compatível com esse contrato.

## Critérios de aceite

- Estilos internos funcionam por classes `.max-*` sem depender de `.p-*`.
- Aliases públicos restantes são inventariados, testados e marcados para depreciação.
- Remoções têm estratégia de versão/migração e não quebram consumidores silenciosamente.
- O sweep reduz `:deep` e `!important` quando eles não forem necessários para slots.

## Contraevidências consideradas

- Classes legadas são compatibilidade intencional, conforme `GEMINI.md`; não constituem defeito isoladamente.
- A independência de runtime já existe e não é refutada pela nomenclatura residual.
