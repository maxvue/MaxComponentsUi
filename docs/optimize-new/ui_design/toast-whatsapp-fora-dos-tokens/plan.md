# Plano de implementação — tokenizar WhatsApp no toast

## Objetivo e escopo

Fazer `MaxToast` e `MaxButton` consumirem a mesma família semântica WhatsApp, mantendo shade de superfície próprio quando necessário para contraste ≥4,5:1. Não trocar cegamente `#128c7e` pelo shade 500.

## Fora de escopo

Não alterar props, temporização ou layout do toast, nem forçar o mesmo shade em superfícies com papéis distintos; apenas a família/tokenização WhatsApp será alinhada.

## Arquivos

- Alterar `src/themes/tokens.scss` e `src/components/MaxToast.vue`.
- Alterar `tests/components/MaxToast.test.ts` e teste de contraste/override de tema.

## Dependências e ordem de implementação

Depende da definição do foreground semântico das ações para reutilizar um par já validado, sem conflitar com o plano de contraste dos botões.

## Passos de implementação

Executar na seguinte ordem:

1. Calcular contraste de shades 500/600 e do literal atual com foreground definido.
2. Criar token `--max-whatsapp-surface`/`--max-whatsapp-content`, referenciando a família oficial e com valores root/dark quando necessário.
3. Substituir o literal no toast.
4. Confirmar que override coordenado altera button/toast previsivelmente, sem exigir exatamente o mesmo shade para papéis distintos.
5. Testar success e demais severidades para evitar seletor amplo.

## Migração e compatibilidade

Mudança somente visual/token. Props/classes permanecem. Customizações passam a usar token documentado; manter fallback equivalente durante transição.

## Testes

Unitários verificam uso do token e classe; teste matemático mede foreground/surface; integração aplica override e compara CSS computado de button/toast; visual cobre temas. A11y exige 4,5:1; benchmark não se aplica.

## Aceite

Zero literal `#128c7e` no toast; ambos derivam de `--max-whatsapp-*`; override central funciona; texto do toast atinge ≥4,5:1 nos dois temas.

## Riscos e rollback

Mesmo shade pode não servir a botão/toast; usar token de papel derivado. Mudança pode reduzir reconhecimento; validar identidade. Rollback ajusta valor do token, não reintroduz literal.

## Validação final

Testes MaxToast/MaxButton/tema, contraste computado, snapshots claro/escuro, stylelint, suíte e `git diff --check`.
