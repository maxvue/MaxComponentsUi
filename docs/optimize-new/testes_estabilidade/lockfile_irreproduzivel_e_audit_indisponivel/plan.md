# Plano de implementação — instalação npm reproduzível

## Objetivo e resultado esperado

Restabelecer `package.json`/`package-lock.json` como fonte instalável em qualquer clone, sem caminhos da máquina nem árvore extraneous, e tornar `npm ci`, `npm ls` e `npm audit` verificações obrigatórias.

## Escopo e fora de escopo

- Escopo: estratégia para pacotes Max, runtime npm fixado, regeneração limpa do lock, CI, auditoria e smoke do tarball.
- Fora: upgrades indiscriminados, correção de código dos pacotes irmãos ou aceitação silenciosa de advisories.

## Arquivos-alvo

- `package.json`: substituir referências locais destinadas à publicação, registrar `packageManager`/`engines` e scripts de verificação.
- `package-lock.json`: regenerar integralmente a partir do manifesto aprovado.
- `.npmrc`: remover workaround `legacy-peer-deps=true` se a árvore corrigida resolver peers sem ele.
- Criar `.nvmrc` (ou adotar o arquivo de runtime equivalente único).
- Criar `.github/workflows/ci.yml` para instalação limpa e gates.
- Criar `scripts/check-lockfile.mjs` para rejeitar caminhos externos, divergência direta e links locais.
- Criar `docs/DEPENDENCY_AUDIT.md` para decisões de advisories e procedimento de atualização.

## Dependências e ordem

1. Congelar um backup lógico do manifesto/árvore e registrar Node 24.18.0/npm 12.0.1 usados na reprodução; a equipe pode aprovar outro par LTS antes de gerar o lock.
2. Resolver conjuntamente `dependencias-runtime-sem-uso-direto`: `@maxvue/max-use` é import direto e deve usar versão publicável; MaxPinia deve ser peer opcional se confirmado.
3. Só então regenerar lock em clone temporário limpo.
4. Validar CI/tarball e tratar audit antes de substituir o lock versionado.

## Passos detalhados

1. Confirmar no registry as versões publicadas compatíveis (`@maxvue/max-use` local está em 2.0.0 e MaxPinia em 0.2.0); falhar com mensagem clara se ainda não publicadas, em vez de gravar `file:../...`.
2. Alinhar dependências/peers com o manifesto final e remover entradas antigas de PrimeVue/PrimeUI que já não pertencem a `package.json`.
3. Fixar runtime de geração por `.nvmrc`, `engines` e `packageManager`; documentar comando exato.
4. Em diretório temporário/clonado, sem `node_modules` herdado, executar `npm install --package-lock-only` e depois `npm ci` usando o runtime fixado.
5. O validador deve comparar requisitos diretos do bloco raiz do lock com `package.json` e rejeitar chaves/resolved contendo `../`, caminho absoluto, `.worktrees` ou localização externa ao pacote.
6. Executar `npm ls --all`; investigar todo `invalid`, `extraneous`, `missing` ou peer inválido.
7. Executar `npm audit --omit=dev --json`; classificar cada advisory por alcançabilidade/mitigação/prazo em documentação. Não usar `--force` automaticamente.
8. Gerar `npm pack`, instalar o `.tgz` num consumidor temporário e importar `.`, `./preset` e `./resolver`.
9. No CI, rodar `npm ci`, validador, `npm ls`, audit conforme política, type-check, testes e build sempre em workspace limpo.

## Migração e compatibilidade

- O lockfile pode mudar amplamente; revisar semanticamente dependências diretas e versões efetivas, não preservar lixo por diff pequeno.
- Pacotes `file:` usados apenas no desenvolvimento local devem migrar para workspace formal ou versões publicadas; tarball publicado nunca pode depender da topologia irmã.
- A remoção de `legacy-peer-deps` só ocorre se instalação normal passar. Se um peer legítimo conflitar, corrigir faixas em vez de esconder o conflito.
- Não há migração de API/dados da biblioteca.

## Testes e medições

- Repetir `npm ci` em dois diretórios limpos e comparar hash do lock/árvore resolvida.
- Validar Linux no CI e, se disponível, smoke local em outro SO.
- Rodar audit de produção, pacote consumidor, type-check, suíte e build.
- Medir tempo/bytes da instalação limpa como baseline para o plano de dependências; não impor benchmark de runtime.
- A11y não se aplica.

## Critérios de aceite

- `npm ci --ignore-scripts`, `npm ci`, `npm ls --all` e `npm audit --omit=dev` concluem sem erro operacional.
- Zero chave com caminhos da máquina e zero pacote `invalid/extraneous/missing`.
- Requisitos diretos do lock são idênticos aos do manifesto.
- Duas instalações limpas produzem a mesma árvore/versionamento.
- Tarball instala sem repositórios irmãos e os três exports funcionam.
- Advisories restantes possuem decisão, responsável e prazo documentados.
- CI, type-check, testes e build passam.

## Riscos, rollback e validação final

- Riscos: pacote Max ainda não publicado, mudança transitiva ampla e scripts de instalação. Mitigar bloqueando publicação ausente, revisar diff e testar com/sem scripts.
- Rollback: restaurar manifesto/lock juntos; nunca restaurar apenas o lock corrompido ou depender do `node_modules` atual.
- Validar do zero em clone temporário, executar guardrail/audit/tarball e revisar que nenhum caminho local reapareceu.
