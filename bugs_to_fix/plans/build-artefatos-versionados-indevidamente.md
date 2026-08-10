# `coverage/` e relatórios temporários estão versionados apesar do `.gitignore`

- **Categoria:** build
- **Severidade:** média
- **Arquivo(s):** `.gitignore:31`, `.gitignore:8`, `.gitignore:9`
- **Domínio:** build-config

## Problema

O `.gitignore` lista corretamente os artefatos gerados:

```
dist/                 # .gitignore:8
*.tsbuildinfo         # .gitignore:9
coverage/             # .gitignore:31  (comentado como "gerado por npm run test:coverage")
```

Mas o `.gitignore` **não afeta arquivos já rastreados**. E `coverage/` está rastreado:

```
$ git ls-files | grep -c '^coverage/'
(centenas de arquivos — coverage/index.html, coverage/base.css,
 coverage/src/components/*.vue.html, etc.)
```

Ou seja, todo `npm run test:coverage` reescreve centenas de arquivos HTML rastreados,
sujando o `git status` e produzindo diffs enormes e sem valor em qualquer commit feito logo
depois. A regra do `.gitignore` dá a falsa impressão de que o problema está resolvido.

Também versionados na raiz, sem estarem cobertos pelo `.gitignore`:

- `.superpowers-task-12-report.md` — relatório de execução de uma tarefa de agente,
  artefato de processo e não de código.
- `implementations/` e `prime_vue_migration/` — 80 arquivos combinados, aparentemente
  material de trabalho da migração. Diferente dos artefatos de build, estes **podem** ser
  intencionais: `migration_plans/`, `migration_plan.md`, `migration_executor.md` e
  `status-primevue.migration.yaml` são explicitamente documentados no `CLAUDE.md` como
  arquivos de controle da migração. `implementations/` e `prime_vue_migration/` **não** são
  mencionados lá, o que sugere que são resíduo — mas isso precisa ser confirmado com o
  autor antes de remover, não presumido.

`dist/` e `tsconfig.tsbuildinfo` existem no working tree mas **não** estão rastreados —
esses dois estão corretos.

## Impacto

- `git status` permanentemente sujo após rodar a cobertura, o que treina o desenvolvedor a
  ignorar mudanças não commitadas — e a eventualmente commitar algo por engano.
- Diffs de PR poluídos com centenas de arquivos HTML gerados, escondendo a mudança real.
- Repositório inflado com conteúdo regenerável.

## Plano de correção

1. Remover `coverage/` do índice preservando o arquivo em disco:

   ```bash
   git rm -r --cached coverage
   git commit -m "chore: remove relatório de cobertura do versionamento"
   ```

   A regra `coverage/` já presente em `.gitignore:31` passa a valer a partir daí.

2. Remover `.superpowers-task-12-report.md` do versionamento pelo mesmo método e adicionar
   `.superpowers*` ao `.gitignore`, junto ao bloco "Inteligência Artificial"
   (`.gitignore:36-47`), que já ignora `.gemini/`, `.cursor/`, `.windsurf/` etc.

3. **Confirmar com o autor** o destino de `implementations/` e `prime_vue_migration/` antes
   de qualquer ação. Se forem resíduo, remover; se forem documentação viva da migração,
   registrá-los na tabela de arquivos de controle do `CLAUDE.md` para que a intenção fique
   explícita. Não remover unilateralmente.

4. Adicionar ao `.gitignore` uma regra para o `coverage/` do playground, se aplicável.

## Verificação

- `npm run test:coverage && git status --porcelain` retorna vazio.
- `git ls-files | grep -c '^coverage/'` retorna 0.
- Os arquivos de cobertura continuam existindo em disco e o relatório HTML continua
  navegável em `coverage/index.html`.
