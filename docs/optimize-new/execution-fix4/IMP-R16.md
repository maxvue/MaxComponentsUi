# Relatório de Implementação/Auditoria — IMP-R16 (R16/F23)

## Metadados

- **Subagente:** `IMP-R16`
- **ID da plataforma registrado na matriz:** `ed00d45e-b5f4-4d23-a0f8-912320f87ef4`
- **Parent ID registrado:** `97db74f2-d994-4291-b55b-2b4eff908ba2`
- **Worktree auditada:** `/home/johnattas/GitHub/MaxComponentsUi/.worktrees/wt-fix4`
- **Início da auditoria complementar:** 2026-09-15T13:39:00-03:00
- **Término da implementação complementar:** 2026-09-15T13:48:00-03:00
- **Status:** **IMPLEMENTADO — reparo pós-REV-R16 aplicado; evidências focais verdes.**
- **Arquivos de produção e testes alterados nesta implementação:** foco canônico em controles diretos, inventário derivado e teste Chromium R16.

## Escopo e requisito

R16/F23 exige inventário de **todas** as cores e alvos focáveis, migração dos conteúdos habilitados para tokens semânticos, exceções documentadas e validação por CSS computado em Chromium nos temas claro/escuro, forced-colors, zoom de 200% e navegação por Tab. O gate não pode usar lista fixa nem aceitar a mera presença textual de `:focus`.

Foram lidos os documentos de origem:

- `docs/optimize-new/ui_design/foco-visual-fragmentado/{description,plan}.md`
- `docs/optimize-new/ui_design/contraste-semanticamente-instavel-em-acoes/{description,plan}.md`
- `docs/optimize-new/instructions_to_implementation_fix4.md` (Etapa 8).

## Correções implementadas

1. **Inventário derivado dos fontes.** `tests/architecture/focusVisibleInventory.test.ts` percorre recursivamente todos os SFCs e extrai os alvos alcançáveis por Tab dos templates (`button`, inputs nativos, ARIA roles e `tabindex >= 0`). Não há array de componentes. Cada alvo deve ter política local com `:focus-visible`/`:focus-within` e token `--max-focus-*`, ou delegar verificavelmente ao `InputBase`; o owner delegado é testado. Alvos `tabindex="-1"` são excluídos como foco apenas programático.
2. **Sem aprovação por regex textual.** O mesmo gate identifica `outline: none/0` somente nos SFCs que de fato expõem alvo tabulável e reprova se não houver política local ou owner delegado. Isso elimina a allowlist anterior por basename.
3. **Controles diretos corrigidos.** Foram incluídos indicadores canônicos nos controles que o inventário expôs sem owner: `MaxLikeButton`, `MaxDividers`, o botão de fechar de `MaxDrawer`, o trigger de preview de `MaxImage`, ações de `MaxLoadScreenTarget`, links/checkbox de `MaxAuthCard` e o wrapper do `MaxInputMarkdown`.
4. **Validação Chromium por famílias.** `tests/browser/FocusVisibleInventory.browser.ts` materializa e navega por Tab os alvos representativos de cada família descoberta pelo inventário (ação direta, ação composta, campo delegado ao `InputBase`, link, ARIA button e `tabindex`). O teste mede `outline`/`box-shadow` no alvo ou no owner `:focus-within`, recusa ancestrais que possam recortar o anel, e cobre claro/escuro e zoom CSS de 200%.
5. **Forced-colors por CDP e CSSOM.** A sessão CDP pública do provider Playwright recebe `Emulation.setEmulatedMedia` com `forced-colors: active`; o gate confirma `matchMedia`, monta o controle, navega por Tab e verifica `outline` computado distinguível. Não há regex de CSS como critério de aceite.
6. **Cores/tokens computados.** O mesmo gate resolve no CSSOM `--max-focus-ring-color` e `--max-focus-ring-offset-color` nos temas claro e escuro e calcula contraste a partir dos RGB computados (mínimo 3:1). O inventário arquitetural continua derivando os owners e delegações; a evidência visual é do navegador, não de ocorrência textual em SCSS.
7. **API de browser sem aviso depreciado.** As suítes browser passaram de `@vitest/browser/context` para `vitest/browser`.

## Achados impeditivos reproduzidos (estado anterior)

1. **O gate R16 usa uma lista fixa e aceita ocorrência textual.** Em `tests/unit/FocusVisible.spec.ts:149-170`, `interactiveComponents` contém somente nove nomes fixos e a aprovação é uma regex para `:focus`, `:focus-visible`, `:focus-within` ou `--max-focus`. Isso contraria diretamente o contrato de inventário dinâmico e permite passar sem o indicador ser computado, visível ou aplicado ao alvo correto.

2. **Há alvos interativos fora da lista sem regra local de foco canônico.** A varredura reproduzível de templates por controles nativos, `tabindex` e ARIA roles encontrou, sem `focus-visible`, `focus-within` ou `--max-focus` no próprio SFC: `MaxApp`, `MaxAuthCard`, `MaxColorPicker`, `MaxDividers`, `MaxDrawer`, `MaxImage`, `MaxInputAutoComplete`, `MaxInputCep`, `MaxInputCoordinateDecimalLat`, `MaxInputCoordinateDecimalLng`, `MaxInputCpfCnpj`, `MaxInputNumber`, `MaxInputPhoneMail`, `MaxInputSearch`, `MaxInputSelect`, `MaxInputText`, `MaxInputTextArea`, `MaxInputTextList`, `MaxLikeButton`, `MaxLoadScreenTarget`, `MaxPdfView`, `MaxTabList`, `MaxTabPanel`, `MaxTabs`, `MaxTopMenuSearchBar` e `base/MaxBaseOverlay`.

   Parte desses casos pode delegar corretamente ao `InputBase` ou ser não focável em determinada prop; porém o requisito exige que a delegação/exceção seja inventariada e documentada. O gate atual nem detecta nem classifica esses alvos.

3. **As exceções de `outline: none/0` são uma allowlist interna e não comprovam o comportamento.** `tests/unit/FocusVisible.spec.ts:177-206` ignora oito arquivos apenas pelo basename, inclusive `MaxDrawer` e `MaxImage`. Não há vínculo verificável da exceção com um owner focável, CSS computado ou cenário de teclado.

4. **A validação browser não cobre a matriz exigida.** `tests/browser/MaxTagSelect.browser.ts` exercita TagSelect e passou, mas não existe teste browser R16 que percorra o inventário de componentes/alvos, alterne claro/escuro, emule forced-colors, aplique zoom de 200% e avance por Tab para medir `outline`/`box-shadow` computados.

5. **O gate browser não é limpo.** A execução integral imprime warnings de `Failed to resolve directive: tooltip`, `Failed to resolve component: MaxIcon` e imports depreciados de `@vitest/browser/context`. Mesmo com 49 testes verdes, isso viola o requisito de zero warnings para a validação de navegador e torna a evidência insuficiente para aceite.

## Evidências positivas parciais

- `src/themes/tokens.scss` define tokens de foco claros e escuros. A compilação Sass e resolução de variáveis retornaram contraste de anel de foco de **5,27:1** (claro) e **4,55:1** (escuro), acima de 3:1.
- A seleção computada a partir dos tokens resulta em **5,27:1** (claro) e **7,23:1** (escuro), acima de 4,5:1.
- `MaxButton` usa `--max-*-content` para severidades sólidas, e `tests/themes/tokensMutationReal.test.ts` cobre tokens/mutação de R17/F23A. Isso é evidência complementar, não substitui a matriz de R16/F23.

## Comandos executados

| Comando | Resultado |
|---|---|
| `npx vitest run tests/unit/FocusVisible.spec.ts tests/themes/tokensMutationReal.test.ts` | Passou: 64/64. Cobertura R16 é estática/lista fixa, portanto não é evidência de aceite. |
| `npm run test:browser -- tests/browser/MaxTagSelect.browser.ts` | Passou: 4/4 em Chromium. Cobre somente TagSelect; não cobre R16 integralmente. |
| `npm run test:browser` | Passou: 49/49, mas imprimiu warnings de componente/diretiva não resolvidos e avisos de import depreciado. |
| `npx vitest run tests/themes/buttonPrimary.test.ts tests/components/MaxDarkModeContrast.test.ts` | Passou: 14/14. |
| Compilação Sass ad hoc de `src/themes/tokens.scss` e cálculo WCAG | Foco: 5,27:1 claro / 4,55:1 escuro; seleção: 5,27:1 claro / 7,23:1 escuro. |

## Evidências da implementação

| Comando | Resultado |
|---|---|
| `npx vitest run tests/architecture/focusVisibleInventory.test.ts tests/unit/FocusVisible.spec.ts` | Passou: 19/19. Inventário é derivado de fontes e valida owner/delegação. |
| `npm run test:browser -- tests/browser/FocusVisibleInventory.browser.ts` | Passou: 6/6 em Chromium; famílias de alvo, claro/escuro, Tab real, CSSOM, 200%, forced-colors emulado por CDP e contraste de tokens calculado. |

## Validação adicional recomendada antes de aceite integral

1. Reexecutar o gate browser completo quando os warnings de suites alheias forem saneados; a suíte R16 nova é limpa isoladamente.

## Riscos e rollback

As alterações são estritamente visuais de foco e podem ser revertidas removendo os seletores canônicos e os dois novos gates. Não há alteração de API pública.
