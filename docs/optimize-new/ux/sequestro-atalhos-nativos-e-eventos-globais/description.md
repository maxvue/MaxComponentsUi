# Achado UX-01: atalhos e colagem globais sem escopo ou opt-out

## Resumo

A barra de busca cancela `Ctrl/Cmd+F` globalmente sem configuração e tenta focar um método que `MaxInputText` não expõe. `MaxInputPhone` detecta colagem por `Ctrl+V`, ignorando Command, menu de contexto e outras entradas.

## Severidade e prioridade

- Severidade: alta.
- Prioridade: P1.

## Componentes impactados

`MaxTopMenuSearchBar`, `MaxInputText` e `MaxInputPhone`.

## Evidências

- `src/components/MaxTopMenuSearchBar.vue:108-128`: captura `Control+F`, cancela Ctrl/Cmd+F no documento e chama `setFocus?.()`.
- `src/components/MaxInputText.vue:1-112`: não declara `defineExpose({ setFocus })`; o optional chaining mascara o no-op.
- `src/components/MaxInputPhone.vue:109-117`: a máscara depende de `ctrl` e `v`, sem suporte ao modificador Command nem ao evento nativo de paste.

## Causa-raiz

Conveniências locais foram implementadas como listeners globais, sem política de escopo, conflito, plataforma ou desativação. A API imperativa consumida entre componentes não é tipada/testada.

## Impacto

- A busca nativa do navegador deixa de funcionar e a busca interna pode não receber foco.
- Usuários macOS e colagem por menu/dispositivo alternativo recebem comportamento diferente.

## Reprodução e verificação

Pressionar Ctrl/Cmd+F com foco fora da barra e verificar `document.activeElement`. Colar telefone com Cmd+V e menu de contexto.

## Direção de solução

Usar atalho não nativo, configurável e anunciado; expor/focar o input com contrato tipado. Tratar a colagem de telefone pelo evento nativo do controle.

## Critérios de aceite

- Atalho global é configurável, multiplataforma e não substitui busca nativa por padrão.
- O método de foco existe, é tipado e testado por `activeElement`.
- Colagem de telefone independe de modificador/dispositivo.

## Contraevidências consideradas

- Capturar Ctrl+F pode ser conveniência histórica; sem opt-out, escopo e affordance, o custo recai sobre jornadas não relacionadas. A captura global de arquivos por `MaxInputFile` permanece no achado técnico específico, que também cobre o ciclo de Object URLs.
