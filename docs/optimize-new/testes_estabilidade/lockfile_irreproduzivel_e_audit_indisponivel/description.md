# Lockfile irreproduzível impede instalação limpa e auditoria

## Resumo
O `package-lock.json` diverge do `package.json`, contém centenas de chaves relativas externas ao repositório e não é aceito pelo `npm ci`. O mesmo dano impede `npm audit`.

## Severidade e prioridade
**Crítica / P0.** CI/clones limpos não reproduzem a árvore usada pelos testes locais e advisories ficam opacos.

## Evidências
- `npm ci --dry-run --ignore-scripts` falha `EUSAGE`, informando que não há lock utilizável/sincronizado.
- `npm audit --omit=dev` falha `EMISSINGTARGET` para `../../../../../../MaxPinia`.
- `npm ls --depth=0` sai `ELSPROBLEMS` e marca MaxUse/MaxPinia como inválidos.
- `package-lock.json:11-87` ainda declara PrimeVue/PrimeUI ausentes do `package.json` atual e omite dependências Vue compiler/runtime presentes nele.
- Há 680 package keys com prefixo `../../../../../../MaxComponentsUi/node_modules/`; entradas locais reaparecem em `package-lock.json:900-905,10023-10024,10959-10964`.
- A árvore já instalada permite testes, demonstrando divergência entre estado local e instalação limpa.

## Afetados
CI, onboarding, worktrees, auditoria de dependências, build reproduzível e publicação.

## Causa-raiz
O lock foi gerado/reutilizado em topologia com `node_modules` e pacotes `file:` externos, acumulando entradas extraneous, e não foi sincronizado após mudanças de dependências.

## Impacto
Não existe fonte de verdade instalável para versões transitivas. Os três advisories relatados na instalação (2 low, 1 moderate) não podem ser avaliados pelo comando padrão, e o resultado depende da máquina.

## Reprodução
Em estado atual, executar `npm ci --dry-run --ignore-scripts`, `npm audit --omit=dev` e `npm ls --depth=0`.

## Direção de correção
Primeiro corrigir a estratégia de workspace/versões dos pacotes irmãos; depois regenerar lock em clone limpo com runtime fixado, validar `npm ci`, `npm audit` e comparar pacote empacotado.

## Critérios de aceite
- `npm ci` funciona em clone/worktree limpo.
- Lock e `package.json` têm os mesmos requisitos diretos e não contêm caminhos da máquina.
- `npm ls` não relata invalid/extraneous.
- `npm audit` conclui e advisories têm tratamento documentado.

## Contraevidências consideradas
`npm test` passa com a árvore já instalada. Esse sucesso é justamente estado não reprodutível e não valida o lock.
