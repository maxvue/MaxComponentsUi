# `COMPONENTS.md` omite 43 dos 101 componentes existentes

- **Categoria:** documentação
- **Severidade:** alta
- **Arquivo(s):** `COMPONENTS.md`, `README.md:223`, `src/components/`
- **Domínio:** docs-qualidade-testes

## Problema

O `README.md:228` apresenta o `COMPONENTS.md` como *"Catálogo completo de componentes"*.
Ele não é completo.

Comparando os cabeçalhos do `COMPONENTS.md` com os arquivos reais em `src/components/`:

- **101** arquivos `.vue` existem em `src/components/` (`ls src/components/*.vue | wc -l`);
- **58** estão documentados;
- **43 não estão documentados**;
- **0** componentes documentados são inexistentes (nenhum caso inverso — o catálogo não
  descreve nada fantasma).

### Os 43 componentes ausentes do catálogo

`MaxAccordion`, `MaxAccordionContent`, `MaxAccordionHeader`, `MaxAccordionPanel`,
`MaxAiIcon`, `MaxApp`, `MaxAuthCard`, `MaxBottomMenu`, `MaxButtonConfirm`, `MaxChart`,
`MaxColorPicker`, `MaxContainerApp`, `MaxCreditCard`, `MaxDrawer`, `MaxInputCreditCard`,
`MaxInputCreditCardCvv`, `MaxInputCreditCardDate`, `MaxInputIconPicker`,
`MaxInputMarkdown`, `MaxInputMarkdownToolbar`, `MaxInputTextList`, `MaxListBox`,
`MaxLoadScreen`, `MaxLoadScreenTarget`, `MaxMenuVerticalItem`, `MaxPageLayout`,
`MaxPopoverMenu`, `MaxSideMenu`, `MaxSplitPanesContent`, `MaxTab`, `MaxTabItem`,
`MaxTabList`, `MaxTabPanel`, `MaxTabPanels`, `MaxTabs`, `MaxTagSelect`, `MaxTagsList`,
`MaxToast`, `MaxTopMenu`, `MaxTopMenuSearchBar`, `MaxTopToolbar`, `MaxUserSection`,
`TransitionFade`.

A lacuna não é de componentes marginais. Estão de fora:

- **famílias inteiras:** todo o conjunto de abas (`MaxTabs`, `MaxTab`, `MaxTabList`,
  `MaxTabPanel`, `MaxTabPanels`, `MaxTabItem`) e todo o de accordion
  (`MaxAccordion`, `MaxAccordionPanel`, `MaxAccordionHeader`, `MaxAccordionContent`);
- **componentes de layout de aplicação inteiros:** `MaxPageLayout`, `MaxContainerApp`,
  `MaxTopMenu`, `MaxSideMenu`, `MaxBottomMenu`, `MaxSplitPanesContent`;
- **componentes ativos na fila de migração:** `MaxColorPicker` (item 13),
  `MaxPopoverMenu` (item 22), `MaxTagSelect` (item 24), `MaxInputIconPicker` (item 30),
  `MaxUserSection` (item 34), `MaxButtonConfirm` (item 35);
- **`MaxListBox`**, adicionado no commit `72b02af2`
  (*"feat(MaxListBox): adiciona componente de lista de selecao para paineis mestre-detalhe"*),
  um dos mais recentes do repositório — sinal de que o catálogo não é atualizado junto
  com o código.

## Impacto

- **Componentes invisíveis para quem consome a lib.** Um desenvolvedor que precise de
  abas ou accordion vai concluir que a biblioteca não oferece e reimplementar do zero.
- **Documentação que se declara completa e não é** é pior que documentação ausente:
  o `README.md:228` afirma "catálogo completo", então o leitor não procura em outro lugar.
- **Migração desassistida:** seis componentes da fila de migração não têm sua API pública
  documentada. Como o `migration_executor.md:76-78` exige *"Não alterar a API pública"*,
  a ausência de documentação remove o único critério objetivo para verificar isso.
- **Débito crescente:** sem um mecanismo de checagem, cada componente novo amplia a
  divergência (o caso do `MaxListBox` comprova).

## Plano de correção

1. **Levantar a lista autoritativa** a partir do disco, não da memória:
   ```bash
   ls src/components/*.vue | xargs -n1 basename | sed 's/.vue//' | sort
   ```
   e cruzar com `src/index.ts` para separar componentes **públicos** (exportados) de
   **internos**.
2. **Decidir o escopo do catálogo.** Alguns dos 43 podem ser intencionalmente internos
   (`MaxLoadScreenTarget`, `MaxMenuVerticalItem`, `TransitionFade`, subcomponentes de
   `MaxTabs`/`MaxAccordion` usados só via o pai). Documentar essa decisão no topo do
   `COMPONENTS.md` — "este catálogo cobre os componentes públicos; os internos estão
   listados em X" — em vez de simplesmente omiti-los sem explicação.
3. **Documentar os públicos que faltam**, seguindo o formato já usado no arquivo (props,
   eventos, slots, exemplo). Priorizar: famílias de abas e accordion, componentes de
   layout de aplicação, e os seis que estão na fila de migração (a documentação vira o
   contrato a preservar).
4. **Corrigir a promessa do `README.md:228`** para refletir o escopo real do catálogo.
5. **Automatizar a checagem.** O repositório já gera `src/components-manifest.json` via
   `src/scripts/generateResolver.ts`. Adicionar um script que compare o manifesto com os
   cabeçalhos do `COMPONENTS.md` e falhe se houver componente público não documentado,
   plugando-o no `npm run test` ou em um passo de CI. Sem isso, a divergência volta.

## Verificação

- O diff programático entre componentes públicos e cabeçalhos do `COMPONENTS.md` é vazio:
  ```bash
  ls src/components/*.vue | xargs -n1 basename | sed 's/.vue//' | sort > /tmp/real.txt
  grep -oE '^#{2,3} `?(Max[A-Za-z0-9]+|InputBase)`?' COMPONENTS.md \
    | grep -oE '(Max[A-Za-z0-9]+|InputBase)' | sort -u > /tmp/doc.txt
  comm -23 /tmp/real.txt /tmp/doc.txt   # deve conter apenas internos declarados
  comm -13 /tmp/real.txt /tmp/doc.txt   # deve estar vazio
  ```
- O script de checagem **falha** quando um `.vue` novo é adicionado sem documentação
  (validar criando um arquivo de teste temporário e removendo-o depois).
- `README.md` não promete "completo" além do que o catálogo entrega.
