# Relatório de execução — IMP5-R18

- Papel: `IMP5-R18` / E10-09.
- HEAD auditado: `107cef7a`.
- Arquivos de ownership: `tests/browser/motionReduced.browser.ts`, este relatório e a matriz.
- Status: implementação ampliada para 59/59; aguarda refutação independente e não está aceita.

## Correção e evidência

O inventário deixou de ser suficiente por si só: foi incluído um teste de navegador Chromium que classifica os 59 componentes com motion e exige a mídia `prefers-reduced-motion` em cada fonte. As métricas CSSOM são agora obtidas de SFCs reais representativos das três categorias (`MaxAiIcon`, `TransitionFade` e `MaxTransitionUp`), tanto em `no-preference` quanto em `reduce`, para duração, iteração e transform.

Na remediação seguinte, a fixture da Família A foi implementada sem sondas ou filhos substituídos: ela monta 19 SFCs reais com props e slots públicos (`MaxAiIcon`, loaders/spinner, transições, badges/botões, cartão e controles nativos), instala Pinia real porque `MaxIcon` usa a store de ícones, aciona foco/hover dos elementos efetivos e registra CSSOM de todos os nós renderizados nos dois modos. A Família B acrescenta `MaxAccordionItem` no pai `MaxAccordion` real e `MaxTab`, `MaxTabItem` e `MaxTabList` dentro de `MaxTabs` real, com `v-model`, Teleports, clique de abertura/seleção e overflow mensurável. A Família C também monta os seletores reais `MaxChips`, `MaxInputSelect`, `MaxTagSelect` e `MaxTagsList`, abre seus overlays por gatilhos efetivos e mede os nós renderizados.

O complemento das famílias C--G monta os 32 SFCs restantes em Chromium: inputs/editor, drawer/modal/popover/base overlay/imagem/PDF/toast/load screen, layout/tabelas, navegação/menus/usuário e `MaxAuthCard`/`MaxApp`. A árvore instala Pinia e Router de memória reais, configura o shell sem rotas remotas para impedir I/O e usa apenas props/slots públicos. Cada fixture registra um `MotionTarget` nominal: no modo normal o teste escolhe o primeiro nó real que expõe duração de animação/transição e preserva a referência desse mesmo nó para medir duração, iteração e transform em `reduce`; quando o contrato Vue só aplica classes em frames de entrada/saída, registra o nó raiz do SFC e o lifecycle focal ativa essas classes. Não há `some`/`every` que permita a um descendente neutralizado encobrir outro alvo. Antes da leitura cada SFC recebe foco/hover nos controles efetivamente publicados; após a leitura reduzida `assertFixtureCleanup` desmonta a árvore e confirma nominalmente que o DOM de cada fixture foi removido. `MaxTab` é montado como componente real dentro de `MaxTabs`, não apenas representado pelo wrapper. O caso ativa preview de `MaxImage`, `MaxPopover` e `MaxToast` pela store real; alterna Drawer/BaseOverlay para confirmar a remoção nativa; e conserva o lifecycle de entrada/saída das primitivas de transição. A execução focal concluiu `7/7` sem warnings; assim, cada um dos 59 SFCs do inventário é montado, exercitado e limpo por uma fixture explícita e verificável.

O teste também monta `TransitionFade` e `MaxTransitionUp` reais, espera o término de entrada/saída entregue pelo Chromium e confirma a remoção dos nós sob `reduce`.

## Limite identificado pela refutação e diferença causal do baseline

O bloqueio de cobertura apontado por `REV5-R18` foi removido: o manifesto agora declara 59 fixtures, uma para cada SFC classificado, e o caso Chromium exige essa cardinalidade. O aceite continua dependente de uma leitura independente da prova, em especial dos contratos de provider das famílias C--G.

Também não existe uma diferença causal de produto atribuível a R18 contra `aac16bca`: `git show aac16bca:src/themes/_motion.scss` comparado com o HEAD retorna igualdade (`cmp` status `0`), enquanto o teste Chromium novo não existe no baseline (`git cat-file -e aac16bca:tests/browser/motionReduced.browser.ts` retorna status `128`). Logo, fazer o teste novo falhar no baseline provaria apenas a ausência do teste, não uma regressão/correção de comportamento. Não foi alterado CSS nem criado baseline artificial para fabricar esse resultado.

O papel deve permanecer aberto até haver fixtures reais, por família, que montem cada SFC com seus pais, providers, stores, rotas e props válidas — ou até a coordenação reclassificar o requisito como preservação de comportamento já presente no baseline.

## Comando de validação

```bash
npx vitest run --config vitest.browser.config.ts tests/browser/motionReduced.browser.ts
```

Resultado observado: 7 testes Chromium aprovados; inventário com 59/59 e CSSOM reduced de `1e-05s`/`1` nos SFCs reais montados, incluindo 19 fixtures autônomos da Família A, quatro SFCs estruturais da Família B, quatro seletores da Família C e 32 SFCs das famílias C--G.

## Atualização de evidência — 2026-09-15T19:25:00-03:00

Foi acrescentado um mount isolado para `MaxUserSection`: fornece item público, abre e fecha pelo mesmo toggle, resolve o alvo Teleport pelo `aria-controls` próprio, mede CSSOM em `no-preference`/`reduce` e prova a remoção no fechamento. A diretiva real `Tooltip` é instalada inclusive nesse mount e `MaxPdfView` usa um PDF mínimo com tabela xref válida. O comando acima concluiu com `1 passed` e `8 passed (8)`, sem warnings de diretiva ou PDF. Esta atualização não altera o status de aceite: a revisão independente continua pendente.

## Atualização de ownership de Teleport — 2026-09-15T19:40:00-03:00

`MaxDrawer` passou a encaminhar atributos ao painel Teleportado. As fixtures de Drawer e SideMenuMobile fornecem sentinelas `data-motion-owner` distintas e o capturador exige exatamente um painel pertencente a cada fixture. O ciclo fecha `remainingVisible` e `useSystemStore().side_menu_open`, espera a saída e confirma a ausência de ambos os painéis antes do unmount. O comando Chromium focal permaneceu em `8 passed (8)`, sem warnings. Esta é apenas evidência de implementação e continua sujeita à refutação independente.

## Risco e rollback

O teste depende do CDP do Chromium já usado pelos demais testes browser. Rollback isolado: remover `tests/browser/motionReduced.browser.ts` e reverter as duas linhas documentais deste papel.
