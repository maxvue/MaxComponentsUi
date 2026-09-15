# Revisão independente — REV-R16 (R16/F23)

## Veredito

**REJEITADO**

## Evidências executadas

| Comando | Resultado |
| --- | --- |
| `npx vitest run tests/architecture/focusVisibleInventory.test.ts tests/unit/FocusVisible.spec.ts` | Passou: 19/19. |
| `npm run test:browser -- tests/browser/FocusVisibleInventory.browser.ts` | Passou: 6/6 em Chromium, sem warnings na execução focal. |
| `rg -o --glob '*.vue' '(?i)(#[0-9a-f]{3,8}\\b|\\brgba?\\(|\\bhsla?\\()' src/components \| wc -l` | 546 literais de cor em 68 SFCs; não há gate que os inventarie, classifique ou associe a exceções. |

## Revalidação do reparo

O reparo eliminou o aviso de API depreciada e agora usa CDP para emular `forced-colors: active`, validando `matchMedia` e o `outline` computado. Essas duas pendências da revisão anterior estão resolvidas.

## Motivos impeditivos remanescentes

1. **Ainda não existe inventário de todas as cores nem prova de migração/exceção.** `tests/architecture/focusVisibleInventory.test.ts` somente enumera SFCs que aparentam conter alvo tabulável e procura política de foco (linhas 43–74). Não extrai nenhuma cor, não relaciona literais aos tokens semânticos e não mantém exceções documentadas/rastreáveis. Isso deixa sem cobertura os 546 literais detectados em estilos de componentes e não atende à primeira exigência explícita de R16/F23.

2. **A validação Chromium não materializa os owners/alvos descobertos pelo inventário.** Embora o inventário seja derivado dos fontes, a suíte browser importa apenas `MaxButton`, `MaxLikeButton` e `InputBase` (linhas 5–7). Os demais casos são elementos artificiais aos quais o próprio teste injeta `.r16-focus-family:focus-visible` (linhas 77–92). Assim, um SFC real inventariado — por exemplo `MaxDrawer`, `MaxImage`, `MaxDividers`, `MaxLoadScreenTarget`, `MaxAuthCard` ou `MaxInputMarkdown` — pode perder seu indicador ou ter recorte e os seis testes continuam verdes.

3. **Zoom e forced-colors cobrem somente o primeiro alvo da fixture.** Em 200%, a suíte dá um único Tab (linhas 134–139); em forced-colors, também só dá um Tab e inspeciona o elemento ativo (linhas 151–163). Na ordem atual, ambos verificam apenas `MaxButton`. Isso não valida CSS computado, ausência de recorte e teclado para cada owner/delegação real nas matrizes exigidas.

## Condições para aceite

- Criar um inventário de cores derivado dos fontes/estilos, exigindo token semântico ou exceção documentada e rastreável para cada ocorrência em escopo.
- Derivar do mesmo inventário os cenários browser de cada owner/delegação real (sem substituir componentes por elementos estilizados na fixture) e percorrê-los por Tab.
- Aplicar a aferição de foco e recorte a todos esses cenários em claro, escuro, zoom de 200% e forced-colors, mantendo a validação CSSOM/CDP já adicionada.

## Escopo da revisão

Nenhum arquivo de produção ou de teste foi alterado. Somente este registro de revisão foi atualizado.
