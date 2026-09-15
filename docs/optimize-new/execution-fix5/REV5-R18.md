# Relatório de refutação — REV5-R18

- Papel: `REV5-R18` / E10-09.
- Natureza: revisão independente; somente este relatório e a matriz foram atualizados.
- Referência adversarial: `aac16bca`.
- HEAD auditado: `d12d4571799e97ca286f86fa716ce29b80709aaf` com alterações R18 não commitadas, revalidadas após ownership explícito de Drawer/SideMenu.
- Data: `2026-09-15`.

## Veredito

**ACEITO.** A revalidação final confirma os 59 SFCs reais em Chromium, contratos CSSOM em `no-preference`/`reduce`, estado público e ciclo de vida dos overlays aplicáveis. Drawer e SideMenu agora propagam sentinelas próprias ao Teleport, com exatamente um alvo e fechamento observado antes de `app.unmount()`.

## Evidências reproduzíveis

```text
npx vitest run --config vitest.browser.config.ts tests/browser/motionReduced.browser.ts --reporter=verbose

Test Files  1 passed (1)
Tests  8 passed (8)
Duration  5.98s
```

O teste realmente usa Chromium/CDP, Pinia e router de memória, e monta componentes de produção com props e slots públicos. Contudo:

1. `MaxTab.vue` é importado/montado e `MaxUserSection` possui fixture dedicada que abre, mede em `reduce` e fecha seu overlay. As 59 fixtures passam pelo Chromium (`8/8`).
2. Drawer recebe `data-motion-owner="drawer-fixture"` e SideMenu recebe `data-motion-owner="side-menu-fixture"` pelas props públicas. As sentinelas chegam aos Teleports correspondentes; `captureMotionTarget()` exige exatamente um alvo para cada componente, removendo a ambiguidade dos fallbacks anteriores.
3. Os contratos restantes associam Teleports por ID/`aria-controls` quando esse é o contrato público (Popover, Select/TagSelect/DatePicker/AutoComplete). Pseudo-elemento de `MaxUserAvatar::after` é lido explicitamente. A captura exige um nó com duração real em `no-preference`, e a mesma referência recebe a verificação CSSOM de duração, iteração e transform em `reduce`.
4. Antes do unmount, o teste fecha Drawer e SideMenu por estado público e confirma que `.max-drawer-mask`, o Teleport do SideMenu e BaseOverlay desapareceram. Também observa fechamento de Popover, UserSection, loading e spinners; as primitivas de transição comprovam término temporal nativo.
5. `_motion.scss` é idêntico a `aac16bca`, portanto esta entrega é uma prova de comportamento preservado e de cobertura real, não uma alegação de mudança causal artificial no CSS base.

## Condição para aceitar

## Limite documentado

Como a política global de reduced motion já estava igual em `aac16bca`, o caso adversarial demonstra a insuficiência histórica de cobertura (a prova Chromium/fixtures não existia no baseline), não uma diferença artificial de CSS. O aceite é sustentado pela verificação real do contrato atual dos 59 SFCs.
