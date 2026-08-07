# 31 — 16 componentes sem nenhum teste

**Severidade:** Média
**Categoria:** Testes / Cobertura
**Arquivos:** `tests/components/`

## Problema

De 89 SFCs em `src/components/` (+ diretório `base/`), 16 não têm cobertura em lugar nenhum (nem nos arquivos agrupados `DisplayAndTransitions/IconsAndLoaders/LayoutComponents/SelectionInputs.test.ts`):

`MaxAiIcon`, `MaxApp`, `MaxAuthCard`, `MaxButtonConfirm`, `MaxChart`, `MaxColorPicker`, `MaxInputCreditCard`, `MaxInputCreditCardCvv`, `MaxInputCreditCardDate`, `MaxInputIconPicker`, `MaxInputMarkdownToolbar`, `MaxInputTextList`, `MaxTabItem`, `MaxTabPanels`, `MaxTagSelect`, `MaxTagsList` — além de `src/components/base/`.

## Correção sugerida

Priorizar: `MaxButtonConfirm` (recém-adicionado), família credit-card (lógica de validação — ver achado 18) e `MaxTagSelect`/`MaxTagsList`. Isso é pré-requisito de segurança para a migração PrimeVue desses componentes.
