# Relatório de execução — IMP5-R18

- Papel: `IMP5-R18` / E10-09.
- HEAD auditado: `107cef7a`.
- Arquivos de ownership: `tests/browser/motionReduced.browser.ts`, este relatório e a matriz.
- Status: revalidação parcial concluída; permanece aberto após rejeição de `REV5-R18`.

## Correção e evidência

O inventário deixou de ser suficiente por si só: foi incluído um teste de navegador Chromium que classifica os 59 componentes com motion e exige a mídia `prefers-reduced-motion` em cada fonte. As métricas CSSOM são agora obtidas de SFCs reais representativos das três categorias (`MaxAiIcon`, `TransitionFade` e `MaxTransitionUp`), tanto em `no-preference` quanto em `reduce`, para duração, iteração e transform.

O teste também monta `TransitionFade` e `MaxTransitionUp` reais, espera o término de entrada/saída entregue pelo Chromium e confirma a remoção dos nós sob `reduce`.

## Limite identificado pela refutação e diferença causal do baseline

Este retry ainda não atende à condição de aceite integral: os 59 SFCs não são todos montados individualmente. A tentativa de montar o inventário inteiro com uma fixture genérica foi descartada, pois falha legitimamente por contratos reais de produto (por exemplo, `MaxAccordionItem` exige `MaxAccordion`, `MaxTabList` exige `MaxTabs`, `MaxApp` exige rota/router, e componentes de layout iniciam stores/rotas Ziggy). Suprimir essas dependências com stubs faria a prova ser sintética e não resolveria a objeção de REV5-R18.

Também não existe uma diferença causal de produto atribuível a R18 contra `aac16bca`: `git show aac16bca:src/themes/_motion.scss` comparado com o HEAD retorna igualdade (`cmp` status `0`), enquanto o teste Chromium novo não existe no baseline (`git cat-file -e aac16bca:tests/browser/motionReduced.browser.ts` retorna status `128`). Logo, fazer o teste novo falhar no baseline provaria apenas a ausência do teste, não uma regressão/correção de comportamento. Não foi alterado CSS nem criado baseline artificial para fabricar esse resultado.

O papel deve permanecer aberto até haver fixtures reais, por família, que montem cada SFC com seus pais, providers, stores, rotas e props válidas — ou até a coordenação reclassificar o requisito como preservação de comportamento já presente no baseline.

## Comando de validação

```bash
npx vitest run --config vitest.browser.config.ts tests/browser/motionReduced.browser.ts
```

Resultado observado: 3 testes Chromium aprovados; inventário com 59/59 e CSSOM reduced de `1e-05s`/`1` nos SFCs reais montados.

## Risco e rollback

O teste depende do CDP do Chromium já usado pelos demais testes browser. Rollback isolado: remover `tests/browser/motionReduced.browser.ts` e reverter as duas linhas documentais deste papel.
