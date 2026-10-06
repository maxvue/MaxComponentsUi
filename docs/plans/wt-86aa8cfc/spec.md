# Especificação técnica — compatibilidade Tiptap com o gate do ENGEAPP

Data: 06/10/2026. Projeto: `@maxvue/max-components-ui` (`1.1.2`). Worktree/branch: `wt-86aa8cfc`.
Raiz autorizada: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-86aa8cfc`.
Status: especificação para revisão; nenhuma implementação ou validação executada.

## 1. Contexto & Objetivo

O deploy rápido do ENGEAPP foi interrompido na tarefa `local-libs:verify`, em `deploy.php:345`. O script `scripts/verify-tiptap-dependencies.mjs` do consumidor exige versões literais `3.31.3` para os 11 pacotes Tiptap diretos conhecidos na biblioteca; intervalos como `^3.29.2` são rejeitados independentemente da versão instalada.

Na worktree, `package.json:594–604` reproduz exatamente as declarações rejeitadas. A investigação por leitura encontrou 34 entradas Tiptap no lockfile da biblioteca e 34 no do ENGEAPP, todas em `3.31.3`. Portanto, o problema demonstrado é de contrato do manifesto, não evidência de necessidade de atualizar o editor ou reinstalar todo o grafo.

Objetivo: fixar as declarações diretas em `3.31.3`, manter manifesto e lockfile coerentes e prevenir regressões. Preservar os editores HTML/Markdown, seus contratos públicos e as barreiras de integridade do consumidor. Usuários afetados: mantenedores que fazem deploy e usuários dos editores nas aplicações consumidoras.

## 2. Escopo

### Incluído

- Trocar somente os 11 requisitos diretos `@tiptap/*` por `3.31.3` em `package.json`.
- Sincronizar esses mesmos requisitos no bloco `packages[""].dependencies` de `package-lock.json`, preservando o grafo já resolvido se a revalidação confirmar os fatos atuais.
- Estender `tests/architecture/runtimeDependencies.test.ts` para proteger versões exatas, lista de dependências obrigatórias e coerência do lockfile Tiptap.
- Criar teste de navegador real para os dois componentes, sem substituir Tiptap por dublês, para verificar compatibilidade efetiva dos exports e da serialização.
- Validar o lote e preparar handoff para integração pelo MaxCode e posterior confirmação do gate no ENGEAPP.

### Fora do escopo

- Alterar `deploy.php`, enfraquecer ou trocar a versão-alvo do gate no ENGEAPP.
- Modificar arquivos do ENGEAPP, seus links ou sua instalação nesta tarefa.
- Commit, merge, push, release npm, incremento de versão ou deploy automático.
- Alterar código de produção dos editores, toolbars, stores, estilos, uploads ou sanitização.
- Migrar `tiptap-markdown`, adicionar `@tiptap/pm` como dependência direta, remover extensões individuais ou transformar Tiptap em peer dependency.
- Corrigir inconsistências documentais incidentais ou falhas preexistentes não causadas pelo lote.

## 3. Arquitetura & Mudanças Técnicas

### Contrato de versões

Todos os itens abaixo continuam em `dependencies`, com requisito literal `3.31.3`:

| Pacote | Declaração atual |
|---|---|
| `@tiptap/core` | `^3.30.3` |
| `@tiptap/extension-image` | `^3.29.2` |
| `@tiptap/extension-link` | `^3.29.2` |
| `@tiptap/extension-table` | `^3.29.2` |
| `@tiptap/extension-table-cell` | `^3.29.2` |
| `@tiptap/extension-table-header` | `^3.29.2` |
| `@tiptap/extension-table-row` | `^3.29.2` |
| `@tiptap/extension-text-align` | `^3.31.3` |
| `@tiptap/extension-underline` | `^3.29.2` |
| `@tiptap/starter-kit` | `^3.29.2` |
| `@tiptap/vue-3` | `^3.29.2` |

O escopo não inclui uma nova API de componente. As versões instaladas transitivas `@tiptap/*`, inclusive `@tiptap/pm`, devem permanecer em `3.31.3`. Não tornar exatos todos os intervalos dos metadados publicados das dependências; preservar esses metadados e verificar coerência dos peers relevantes.

### Arquivos

| Arquivo | Situação | Mudança prevista |
|---|---|---|
| `package.json` | Existente | 11 requisitos exatos; demais campos preservados |
| `package-lock.json` | Existente, formato 3 | 11 requisitos do bloco raiz; sem editar integridades/URLs manualmente |
| `tests/architecture/runtimeDependencies.test.ts` | Existente | Asserções contra deriva de manifesto/grafo |
| `tests/browser/tiptapEditorsCompatibility.browser.ts` | Novo proposto | Montagem e funcionamento dos dois editores com Tiptap real |
| `src/components/MaxInputHtml.vue` e `MaxInputMarkdown.vue` | Existentes, referências | Nenhuma alteração prevista |

Fluxo observado e preservado:

```text
Manifesto da biblioteca → instalação/resolução Tiptap pelo consumidor
                      → MaxInputHtml / MaxInputMarkdown → update:modelValue

Deploy local ENGEAPP → sync:local-libs → verify:local-libs → verify:tiptap
                                                       → bloqueia se incompatível
```

### Restrições de ambiente

O ENGEAPP resolve `storage/libs/MaxComponentsUi` para `/home/johnattas/GitHub/MaxComponentsUi`, não para esta worktree. Uma aprovação do gate contra esse caminho antes da integração não comprova a correção desta branch.

O `node_modules` da worktree é link simbólico para a instalação da raiz. Não instalar, remover dependências nem produzir caches nesse destino compartilhado. O executor deve resolver isolamento com o ambiente/usuário antes de executar comandos que escrevam em dependências; não criar outra worktree nem modificar a raiz para isso.

As regras MaxComponentsUi/MaxPinia/MaxUse são preservadas: trata-se de manutenção da própria biblioteca, sem nova tela, GET, persistência ou helper de aplicação. Não adicionar store ou reimplementar helper para corrigir versões. Usar os componentes reais e o bootstrap de testes existente, mantendo o peer opcional de MaxPinia.

## 4. Plano de Execução Faseado

1. **Preflight por leitura:** confirmar branch, alterações locais, contratos do consumidor, versões do grafo, scripts e isolamento das dependências/harness. Interromper se o ambiente só permitir escrita na instalação compartilhada.
2. **Implementar lote completo:** fixar manifesto, sincronizar bloco raiz do lockfile, incluir asserções arquiteturais e teste real dos editores. Preservar os testes atuais com dublês.
3. **Revisar e validar:** revisar diff e executar o gate completo da biblioteca, após autorização de Execute e ambiente seguro. Corrigir falhas causais em lote e revalidar sem repetição por microedição.
4. **Handoff:** registrar revisão, resultados, riscos e pendência do consumidor. Aguardar integração pelo MaxCode; somente depois, com autorização e integridade do ambiente ENGEAPP confirmada, executar os gates locais do consumidor. Não executar deploy como teste.

O detalhamento operacional, critérios por tarefa e formato do registro de execução estão em `plan.md` neste diretório.

## 5. Critérios de Aceite & Validação

- Os 11 requisitos diretos são exatamente `3.31.3`, presentes e sincronizados no lockfile.
- As 34 entradas atuais Tiptap continuam coerentes em `3.31.3`, sem introdução de versão divergente ou dependência direta proibida.
- Testes arquiteturais detectam regressão para `^`, `~`, versão distinta, remoção de pacote obrigatório e divergência manifesto/lockfile.
- Em Chromium, os componentes reais inicializam e aceitam conteúdo, edição, atualização externa e `disabled`, emitindo HTML e Markdown nos respectivos formatos. HTML preserva o alinhamento legado `ql-align-justify`; testar tabela e link sem acessos externos.
- O gate `npm run verify` passa integralmente para a revisão entregue. Falha, ausência de comando executado ou resultado obsoleto não satisfazem o aceite.
- Após integração autorizada, `npm run verify:local-libs` e `npm run verify:tiptap` passam no ENGEAPP efetivamente consumindo a revisão corrigida, incluindo TextAlign em runtime. Até lá: `manualPending`, não “deploy corrigido/comprovado”.

Verificações nesta sessão: somente leitura de código/JSON, estado Git e consultas de documentação/registro npm. Nenhum gate, teste, instalação, build ou deploy foi executado. A disponibilidade pública dos 11 pacotes `3.31.3` e seus peers foi confirmada por HTTP no registro npm; isso não comprova o runtime nem a disponibilidade futura do ambiente de execução.
