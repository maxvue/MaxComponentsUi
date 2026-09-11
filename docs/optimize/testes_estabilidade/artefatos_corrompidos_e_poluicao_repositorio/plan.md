# Plano de Implementação: Remoção Cirúrgica do Arquivo Corrompido com Nome de Opção UNIX (-l) e Prevenção de Poluição

## 1. Objetivo da Refatoração

Eliminar de forma limpa, segura e definitiva o arquivo corrompido vazio `src/components/base/-l`, acidentalmente versionado no Git. O objetivo é:
1. Remover o arquivo do índice do Git e do sistema de arquivos utilizando a sintaxe segura com terminador de opções POSIX (`--`), evitando que utilitários de linha de comando (`rm`, `ls`, `cat`) e scripts de automação ou CI/CD quebrem ao interpretar o nome do arquivo como a flag de linha de comando `-l`.
2. Assegurar que nenhum manifesto de componentes (como `src/components-manifest.json` ou `src/scripts/generateResolver.ts`) seja poluído por entradas espúrias.
3. Estabelecer mecanismo preventivo para rejeitar a inclusão acidental de arquivos com nomes que iniciem com hífen (`-`), espaços ou caracteres reservados do shell.

---

## 2. Arquivos Afetados

### Arquivos Removidos:
- [`src/components/base/-l`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/base/-l) — Arquivo corrompido (0 bytes).

### Scripts de Infraestrutura e Validação:
- [`package.json`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/package.json) (opcional: inclusão de verificação no script de lint ou pre-commit se desejado)

---

## 3. Passo a Passo Detalhado da Implementação

### Passo 1: Remoção Segura no Repositório Git com Terminador de Opções
1. Executar a remoção através do utilitário `git rm` utilizando explicitamente o separador de opções `--`:
   ```bash
   git rm -f -- src/components/base/-l
   ```
   *Justificativa Técnica*: O argumento `--` informa ao interpretador do Git e da libc subjacente que todas as opções de linha de comando terminaram e que quaisquer argumentos subsequentes devem ser tratados puramente como nomes de arquivo/caminhos (*pathspecs*), neutralizando a tentativa do comando de interpretar `-l` como uma flag.

### Passo 2: Verificação da Remoção no Sistema de Arquivos
1. Confirmar a ausência física do arquivo no diretório:
   ```bash
   ls -la src/components/base/
   ```
   O diretório deve conter estritamente:
   - `MaxBaseInput.vue`
   - `MaxBaseOverlay.vue`
   - `MaxBaseSpinner.vue`
   - `MaxBaseVirtualScroller.vue`
2. Testar comandos de shell com expansão por curingas (*globbing*):
   ```bash
   ls src/components/base/*
   ```
   A expansão agora deve listar apenas os arquivos `.vue` sem emitir nenhum erro de opção inválida (`invalid option -- 'l'`).

### Passo 3: Verificação de Integridade dos Scripts e Manifestos
1. Executar o gerador de manifesto para confirmar que os componentes registrados estão corretos:
   ```bash
   npx tsx src/scripts/generateResolver.ts
   ```
2. Garantir que o manifesto gerado permaneça íntegro e sem artefatos corrompidos.

### Passo 4: Salvaguarda Preventiva contra Arquivos Hostis ao Shell
1. Adicionar uma verificação rápida de integridade na esteira de lint/teste ou documentar a regra para impedir que arquivos com prefixo `-` entrem no versionamento futuro:
   ```bash
   # Validação de integridade de nomes:
   git ls-files | grep -E '(^|/)-' && echo "Erro: Arquivo com nome inválido detectado!"
   ```

---

## 4. Padrões de Estabilidade e Convenções do GEMINI.md

1. **Higiene Rigorosa do Repositório**: A árvore de código deve conter unicamente módulos, testes e documentação canônicos e válidos.
2. **Confiabilidade em Ambientes Linux/Unix**: Garantir que ferramentas automatizadas de build, empacotadores e contêineres de CI (Docker/LXC) operem sem bloqueios de shell.

---

## 5. Critérios de Aceite e Verificação Técnica

1. **Verificação no Git**:
   ```bash
   git status --porcelain -- src/components/base/-l
   ```
   Deve indicar remoção pendente (`D  src/components/base/-l`) ou ausência total no rastreamento (`git ls-files -- src/components/base/-l` deve retornar vazio).
2. **Inexistência no Sistema de Arquivos**:
   ```bash
   test ! -e src/components/base/-l
   ```
   O comando deve sair com código 0 (sucesso).
3. **Build e Testes Íntegros**:
   ```bash
   npm run build
   npm test
   npm run type-check
   npm run lint
   ```
   Todas as rotinas devem executar com 100% de sucesso.

---

## 6. Mitigação de Riscos de Regressão

1. **Impacto Funcional Nulo**:
   - O arquivo `-l` possui 0 bytes e não contém referências ou dependências no código-fonte ou em pacotes externos.
   - Sua remoção apresenta **risco de regressão zero** e restabelece a estabilidade operacional do ambiente de desenvolvimento.
