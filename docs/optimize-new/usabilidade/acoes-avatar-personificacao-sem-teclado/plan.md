# Plano de implementação

## Objetivo e resultado esperado

Transformar remover avatar e encerrar personificação em ações nativas, nomeadas e independentes. O resultado deve permitir clique, Enter e Espaço com uma única emissão, sem aninhar uma ação no gatilho do menu de perfil.

## Escopo e fora de escopo

- Em escopo: semântica, foco, área acionável e eventos das duas ações; preservação do menu de usuário.
- Fora de escopo: redesenho do avatar, conteúdo do menu, confirmação global e modo compacto que não exibe a personificação.

## Arquivos a alterar/criar

- `src/components/MaxUserAvatar.vue`
- `src/components/MaxUserSection.vue`
- `tests/components/MaxUserAvatar.test.ts`
- `tests/components/MaxUserSection.test.ts`
- `tests/unit/MaxUserSection.spec.ts`

## Dependências e ordem

1. Corrigir `MaxUserAvatar` isoladamente.
2. Separar o gatilho e a ação de personificação em `MaxUserSection`.
3. Atualizar testes de componentes e regressão do menu.

## Passos de implementação

1. Renderizar a raiz do avatar como `button type="button"` somente quando `remove && !noClick`; manter um contêiner não interativo nos demais estados para não criar foco sem ação.
2. Derivar nome acessível contextual de `labelRemove` ou de `name`, com fallback pt-BR não vazio; preservar tooltip, dimensões, confirmação e emissão `remove`.
3. Aplicar foco visível e alvo mínimo de 24 × 24 px, sem alterar dimensões configuradas maiores.
4. Em `MaxUserSection`, substituir o wrapper `role="button"` por um botão nativo dedicado ao perfil e mover o botão nativo de encerrar personificação para irmão desse gatilho.
5. Impedir que a ação secundária abra/feche o menu e manter `aria-haspopup`, `aria-expanded`, `aria-controls`, roving do menu e retorno de foco ligados apenas ao gatilho principal.
6. Nomear a ação de saída com `labelEndImpersonate` e contexto suficiente; garantir foco visível e emissão única de `endImpersonate`.

## Migração e compatibilidade

Manter props, emits, classes públicas e comportamento de confirmação. A troca de tag pode afetar seletores CSS de consumidores; conservar classes e neutralizar estilos nativos do botão. Documentar a alteração semântica como correção compatível.

## Testes

- Unitários: renderização condicional de botão, nome acessível, `noClick`, Enter/Espaço e emissão única.
- Integração: ordem de Tab entre perfil e personificação; a ação secundária não altera `aria-expanded`; menu continua com setas, Home/End, Escape e retorno de foco.
- Acessibilidade: nenhum interativo aninhado e foco visível nos dois botões.

## Critérios de aceite mensuráveis

- Cada ação visível possui exatamente um elemento nativo focável e nome não vazio.
- Clique, Enter e Espaço produzem exatamente uma emissão correspondente.
- Encerrar personificação não abre nem fecha o menu do perfil.
- A suíte existente do menu e os novos testes passam sem regressão.

## Riscos e rollback

Risco de quebra visual por estilos de `button` e de seletores dependentes da tag. Mitigar mantendo classes e reset CSS localizado. Se houver incompatibilidade, reverter a troca de marcação preservando os testes como especificação para uma adaptação posterior.

## Validação final

Executar as suítes de `MaxUserAvatar` e `MaxUserSection`, lint/typecheck e inspeção manual por Tab, Enter, Espaço e Escape em desktop e modo compacto.
