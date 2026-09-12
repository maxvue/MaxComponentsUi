# Plano de implementação

## Objetivo e resultado esperado

Garantir que todo elemento com papel de dialog tenha nome acessível não vazio e que todo `aria-labelledby` referencie um nó presente, inclusive quando headers são substituídos por slots.

## Escopo e fora de escopo

- Em escopo: Drawer, Modal, Popover, BaseOverlay e o consumidor SideMenuMobile.
- Fora de escopo: mudanças de layout, conteúdo dos dialogs, foco/trap já tratados separadamente e overlays que já possuem nome válido.

## Arquivos a alterar/criar

- `src/components/MaxDrawer.vue`
- `src/components/MaxModal.vue`
- `src/components/MaxPopover.vue`
- `src/components/base/MaxBaseOverlay.vue`
- `src/components/MaxSideMenuMobile.vue`
- Testes correspondentes em `tests/components/` e `tests/components/base/`

## Dependências e ordem

1. Definir API comum `ariaLabel`/`ariaLabelledby` e precedência.
2. Estabilizar IDs e nós de título nos três componentes de alto nível.
3. Propagar a API para BaseOverlay e SideMenuMobile.
4. Cobrir defaults, slots e referências nos testes.

## Passos de implementação

1. Definir precedência: referência explícita válida, título renderizado estável e, por fim, `ariaLabel`; nunca emitir `aria-labelledby` para ID ausente.
2. Manter o nó portador do ID fora do fallback substituível pelo slot ou fornecer `titleId` ao slot e envolver seu conteúdo em elemento estável associado.
3. Adicionar `ariaLabel` a Modal/Popover e `ariaLabel`/`ariaLabelledby` ao BaseOverlay; encaminhar exatamente um mecanismo de nome ao painel.
4. Para `noHeader` ou ausência de título, exigir fallback acessível configurável e emitir aviso em desenvolvimento quando um dialog abrir sem nome.
5. Nomear o Drawer do `MaxSideMenuMobile` explicitamente como “Menu principal”.
6. Verificar IDs únicos com múltiplas instâncias e associação correta após abrir/fechar e substituir slots.

## Migração e compatibilidade

Manter `title`, `header`, slots e props atuais. Novas props são aditivas. Defaults visuais históricos podem continuar, mas o nome acessível não deve depender do texto genérico “Titulo”; avisos de desenvolvimento permitem migração antes de qualquer exigência futura.

## Testes

- Unitários: nome por título, `ariaLabel`, referência externa e header slot; IDs únicos e existentes.
- Integração: SideMenuMobile aberto, variantes `noHeader` e BaseOverlay com papel dialog.
- Acessibilidade: consulta de accessible name não vazia em cada dialog montado e ausência de referências órfãs.

## Critérios de aceite mensuráveis

- 100% dos dialogs abertos nos testes possuem nome acessível não vazio.
- 100% dos valores de `aria-labelledby` resolvem para elemento existente e ID único.
- SideMenuMobile anuncia “Menu principal”.
- Nenhuma regressão nos traps, Escape e retorno de foco existentes.

## Riscos e rollback

Slots customizados podem já definir ARIA próprio e gerar nomes duplicados. Mitigar com precedência documentada e atributos de slot. Em regressão, reverter por componente mantendo a API aditiva no BaseOverlay.

## Validação final

Executar suítes de Drawer, Modal, Popover, BaseOverlay e SideMenuMobile, lint/typecheck e inspeção com árvore de acessibilidade nas variantes com/sem header.
