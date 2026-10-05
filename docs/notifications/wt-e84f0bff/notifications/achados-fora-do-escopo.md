# Achados fora do escopo da recuperação do build

Data: 2026-10-05. Worktree: `wt-e84f0bff`. Somente investigação; nenhuma correção executada.

## 1. Tarefa de build anuncia operações Git que não realiza

- Localização: `.vscode/tasks.json:7` (mensagem) e `:18` (label).
- Evidência: tarefa `NPM RUN BUILD` chama build, notificação e som; não contém comando de commit ou push, embora a mensagem/label anunciem essas operações.
- Impacto: falsa percepção de que alterações foram commitadas/enviadas após o build.
- Próxima ação: em escopo separado autorizado, adequar mensagem/label ao build efetivamente executado. Não adicionar operações Git à tarefa como correção automática.
- Atenção operacional: a tarefa separada `NPM RUN RELEASE`, em `:26`, contém operações Git/release e não deve ser usada para validar esta recuperação.

## 2. Orientação histórica incompatível com as regras atuais

- Localização: `docs/superpowers/plans/2026-08-10-max-listbox.md:69-70`.
- Evidência: busca textual revelou recomendação histórica de referência local ao pacote irmão e cópia das dependências da pasta principal.
- Impacto: reaplicada hoje, essa orientação conflita com a exigência atual de consumir `@maxvue/max-use` via npm e pode reproduzir instalações inconsistentes entre worktrees.
- Limitação: achado restrito ao trecho retornado pela busca; não constitui auditoria integral do documento histórico.
- Próxima ação: revisão documental separada, contextualizando orientação obsoleta; não seguir esse trecho nesta recuperação.

## 3. Versão de npm observada difere da declarada

- Localização: `package.json:549`, comparado ao resultado de `npm --version` nesta worktree.
- Evidência: `packageManager` declara `npm@10.8.2`; executável observado é `12.0.1`. `engines.npm >=10.0.0` não exclui a versão observada.
- Impacto potencial: diferenças de política de scripts e instalação podem afetar reprodutibilidade. Não foi demonstrado que essa diferença causou o erro de `entities/decode`.
- Próxima ação: se houver falha após isolamento, verificar causalidade e decidir padronização de ferramenta em escopo separado; não atualizar configurações ou instalar outro npm automaticamente.

## 4. Arquivo com hífen rastreado no repositório causa falha em teste arquitetural

- Localização: arquivo `-l` na raiz do repositório, testado por `tests/architecture/tracked-filenames.test.ts`.
- Evidência: commit prévio `75bf3d7ba644ed474c8a82d2f460ac79aa5e52e0` na branch `dev` incluiu o arquivo `-l`. O teste `deve validar com sucesso todos os arquivos rastreados no repositório atual` rejeita arquivos cujo basename inicia com hífen.
- Impacto: 1 teste falha em `tracked-filenames.test.ts`. O erro é preexistente e independente da recuperação do build.
- Próxima ação: remoção do arquivo `-l` via Git em tarefa de limpeza separada aprovada pelo usuário.

## 5. Incompatibilidade entre regex do preset UnoCSS e asserção de teste unitário

- Localização: `src/presetMaxUno.ts:19,25` versus `tests/preset/presetMaxUno.test.ts:259,265`.
- Evidência: commit `31935a2f8e46bdfff3c485cf6993a6c5ab458f65` alterou as regexes de `font-size` e `fs` para `([0-9.]+)`. O teste utiliza helper `findShortcut` procurando exatamente a regex anterior `(.+)`, falhando 2 testes no arquivo.
- Impacto: 2 testes falham em `tests/preset/presetMaxUno.test.ts`. O erro é preexistente no baseline `dev` e não tem relação com o erro de dependência do build (`entities/decode`).
- Próxima ação: atualizar a regex esperada no arquivo de teste em escopo separado autorizado para alinhamento com a implementação vigente do preset.

Nenhum segredo, token, senha, chave ou dado pessoal é incluído nesta notificação. A investigação direcionada não certifica ausência de outros achados.
