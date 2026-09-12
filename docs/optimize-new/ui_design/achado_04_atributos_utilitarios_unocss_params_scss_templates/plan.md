# Plano de implementação — retirar Attributify da anatomia interna

## Objetivo e escopo

Migrar atributos utilitários nus dos seis SFCs para classes/props semânticas locais, mantendo `params.scss` e o preset Attributify como API pública. Impedir novos usos internos sem bloquear fallthrough funcional deliberado.

## Fora de escopo

Não remover nem depreciar `params.scss`, o preset UnoCSS, Attributify ou aliases públicos; atributos funcionais e fallthrough deliberado permanecem.

## Arquivos

- Alterar `MaxButtonConfirm.vue`, `MaxIconConfirm.vue`, `MaxTogglePopover.vue`, `MaxInputFile.vue`, `MaxTopToolbar.vue` e `MaxTopToolbarSubmenu.vue` em `src/components/`.
- Ampliar `tests/architecture/styleStandardsValidation.test.ts`.
- Ajustar testes dos componentes quando precisarem afirmar ausência no DOM.
- Não alterar `src/themes/params.scss` nem `src/presetMaxUno.ts`, exceto documentação explícita se necessário.

## Ordem e passos

1. Para cada ocorrência, confirmar se é implementação interna ou atributo recebido do consumidor.
2. Substituir `pointer`, `flex` e `transparent` internos por classes de anatomia com SCSS scoped equivalente ou props existentes do componente filho.
3. Garantir que os atributos não cheguem ao DOM e que estilo não dependa do tema global.
4. Criar inventário arquitetural restrito aos templates em `src/components`; rejeitar atributos utilitários conhecidos, com exceções documentadas para APIs/fallthrough.
5. Renderizar os seis componentes sem CSS global e conferir sua anatomia básica.
6. Manter teste separado provando que seletores Attributify públicos ainda compilam/funcionam.

## Migração e testes

Sem remoção de API pública. Unitários verificam classes/props e ausência dos atributos; integração compara estados pointer/transparente/flexível; a11y confirma semântica DOM inalterada. Benchmark não se aplica.

## Aceite

Zero usos internos não excepcionados de atributos nus; seis componentes mantêm layout/estado; params/preset permanecem; gate falha para nova ocorrência.

## Riscos e rollback

Classe local pode perder especificidade; comparar CSS computado. Não bloquear attrs como `disabled`/`aria-*`. Rollback por componente, mantendo o teste com exceção temporária justificada.

## Validação final

Testes dos seis componentes, teste arquitetural, build sem tema global da fixture, suíte, type-check, stylelint e `git diff --check`.
