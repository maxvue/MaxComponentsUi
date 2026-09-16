# Coordenação e aceite do Fix 7

## Baseline e evidência

1. Capture `BASE_SHA` de `origin/dev` e crie worktree/branch exclusiva.
2. Crie `docs/optimize-new/execution-fix7/status.md` com 27 linhas, uma por requisito atômico. Use os IDs dos achados originais (`E01-02`, `E01-03` etc.) e registre bloco, requisito observável, agente, SHA inicial, commit, arquivos, teste de aceite, comandos/códigos de saída, estado e risco residual.
3. Estados: `PENDENTE`, `EM_EXECUCAO`, `ACEITO`, `BLOQUEADO`. Se o requisito já estiver corrigido no baseline, marque `ACEITO` somente após teste observável e aprovação adversarial; não use “refutado” como atalho. `BLOQUEADO` exige dependência externa concreta e impede sucesso.
4. Gere SHA, commit e arquivos a partir do Git. Não use `PLANEJADO` ou transcrição manual de logs.

Mapeamento obrigatório das 27 linhas: `F07/E04-02`; `F14/E06-01`, `F14/E06-02`; `F15/E06-03`, `F15/E08-04`; `F18/E07-06`; `R01/E01-02`, `R01/E01-03`, `R01/E01-05`; `R02/E01-04`; `R04/E03-02`; `R07/E04-04`; `R09/E04-06`, `R09/E04-07`; `R12/E07-04`, `R12/E07-05`; `R14/E09-01`; `R16/E10-03`, `R16/E10-04`; `R17/E10-02`; `R18/E10-09`; `R19/E10-10`; `R21/E11-03`; `R22/E11-01`; `R23/E11-02`; `R24/E11-04`; `R25/E11-05`. Trate `E12-02` como requisito transversal de não enfraquecimento, sem criar uma 28ª linha.

## Hierarquia de subagentes

Papéis principais:

- `IMP7-L01` a `IMP7-L07`: um líder persistente por lote;
- `REV7-INTERACOES`: lotes 02 e 03;
- `REV7-VISUAL-PERF`: lotes 04, 05 e 06;
- `REV7-INFRA-DIST`: lotes 01 e 07 e interfaces de package/build;
- `GATE7-A`: primeiro checkout limpo;
- `GATE7-B`: segundo checkout limpo e auditoria final.

Os sete líderes compartilham um orçamento global de até seis auxiliares. Um líder pode usar no máximo dois, apenas se as tarefas avançarem em paralelo sem editar os mesmos arquivos. O líder integra e responde pelo lote. Revisores e gates não criam auxiliares. Auxiliares nunca delegam. O total máximo é 12 papéis principais + 6 auxiliares = 18 agentes.

Cada líder trabalha em worktree/branch própria. Auxiliar que edita usa worktree própria derivada da branch do líder; auxiliar na mesma worktree é somente leitura. O líder integra commits auxiliares e entrega um commit consolidado. Somente o coordenador escreve `status.md`; agentes devolvem resultados ao coordenador e não editam a matriz em paralelo.

Revisores são independentes: não podem ter sido auxiliares do lote revisado, não editam código e devolvem achados ao líder original. Logs completos ficam em diretório temporário ignorado, `.worktrees/.fix7-logs/<ID>/`; relatórios versionados guardam somente comando, duração, código de saída e hash/caminho do log.

O Antigravity pode executar muitos agentes simultâneos; ainda assim, serialize alterações em `package.json`, `package-lock.json`, CI, configurações Vitest/Vite, scripts de build e exports. O coordenador pode resolver integração pequena, mas não reimplementar silenciosamente um lote.

## Ciclo de cada lote

O líder realiza ou delega: diagnóstico focado; teste vermelho quando não houver proteção existente; correção da causa raiz; testes direcionados; commit; relatório curto. Se já houver teste correto, registre-o em vez de fabricar teste vermelho.

O revisor tenta refutar comportamento, arquitetura, acessibilidade e testes. Falha retorna ao mesmo líder por follow-up. Após duas tentativas com o mesmo erro, o revisor redefine o diagnóstico; não crie substituto.

Cada lote produz somente `docs/optimize-new/execution-fix7/LXX.md`, limitado a objetivo, causa raiz, diff, testes, resultados e risco. Cada revisão produz um `REV7-*.md` curto.

## Salvaguardas

- Revise `git diff BASE_SHA...HEAD -- tests 'vitest*.config.ts' 'vite*.config.ts' playground/vite.config.ts 'tsconfig*.json' eslint.config.js '.stylelintrc*' package.json package-lock.json .github/workflows scripts`. Inclua também todos os setups de teste encontrados por `rg --files tests | rg 'setup|bootstrap'`.
- Nas linhas adicionadas, procure `skip`, `todo`, `only`, retorno que pule asserts, `expect(true)`, `toBeTruthy()` sem efeito observável, `catch` vazio, mock indevido e aumento de timeout.
- Mantenha cobertura mínima de 85% statements, 76% branches, 84% functions e 89% lines.
- Layout, foco, viewport, axe, motion e estilo computado exigem browser real.
- Alteração posterior em arquivo coberto invalida o gate correspondente.
- Preserve explicitamente `F03`, `F12`, `F17`, `R03`, `R05/F06`, `R06/F08`, `R08`, `R10/F13`, `R11/F16`, `R13/F20`, `R15/F22` e `R20/F26`. Os três revisores dividem essa checagem sem criar agentes ou relatórios extras.

## Gates otimizados

Após cada onda, faça apenas lint dos arquivos alterados quando suportado, um type-check integrado e testes de fronteira entre lotes; não repita suítes completas já executadas pelos líderes. Depois da integração final:

1. `GATE7-A`: checkout limpo, `npm ci`, `npm run verify`, `git diff --check` e comprovação de que o gate não alterou rastreados.
2. Somente após A aprovar, `GATE7-B` usa outro checkout limpo e executa, sequencialmente, `npm ci`, `npm run check:lockfile`, `npm ls --all`, `npm audit --omit=dev --audit-level=high`, testes tardios de console, browsers afetados, benchmark e duas execuções concorrentes de consumidores. Audite diff de testes e matriz. Não repita unitários/cobertura completos sem mudança, pois já pertencem ao `verify` do gate A.
3. Se houver alteração depois de `GATE7-A`, invalide-o, repita A e só então B. Sem alteração, não duplique o verify integral; B confirma instalação e eixos instáveis.

## Condição de término

Sucesso somente com 20/20 blocos e 27/27 requisitos em `ACEITO`, nenhum `BLOQUEADO`, preservações e três revisões aprovadas, ambos os gates aprovados, zero warning inesperado ou erro tardio, zero artefato prévio reutilizado, matriz derivada do Git, `git diff --check` limpo e worktree sem alteração não commitada. Falha local, teste quebrado, limite de contexto ou tokens exige checkpoint e continuação pelo mesmo responsável; não é bloqueio externo.
