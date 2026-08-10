# `.npmrc` do projeto força `legacy-peer-deps=true`, mascarando conflitos reais de peers

- **Categoria:** build
- **Severidade:** média
- **Arquivo(s):** `.npmrc:1`
- **Domínio:** build-config

## Problema

O `.npmrc` do repositório contém uma única linha:

```
legacy-peer-deps=true
```

Isso desativa globalmente a resolução de `peerDependencies` do npm 7+ para todo mundo que
instala neste repositório. O efeito prático é que **qualquer conflito de peer é ignorado
sem aviso**, incluindo o conflito real que existe hoje entre a `vue` declarada em
`peerDependencies` (`^3.5.0`, `package.json:130`) e a `vue` instalada em `devDependencies`
(`^3.6.0-rc.2`, `package.json:110`) — ver o achado `build-peer-vue-versao-divergente.md`.

Também esconde conflitos de peers dos pacotes irmãos locais (`@maxvue/max-use`,
`@maxvue/max-pinia`, ambos via `file:`), que trazem suas próprias árvores de
`node_modules` e podem duplicar instâncias de `vue`/`pinia` — exatamente a classe de
problema que o `vitest.config.ts:20-24` precisou contornar à mão com aliases e `dedupe`.

**Nota de correção sobre o diagnóstico inicial:** o aviso
`npm warn invalid config allow-git=false` que aparece em toda execução npm **não vem deste
repositório**. Ele vem de `/home/johnattas/.npmrc` (o `.npmrc` global do usuário), como a
própria mensagem indica. Não é um problema do projeto e não deve ser "corrigido" aqui —
mas convém avisar o desenvolvedor para limpar a chave inválida do `.npmrc` da home dele,
já que `allow-git` não é uma opção válida do npm.

## Impacto

- Conflitos de versão de peer nunca aparecem, então divergências como a de `vue` só se
  manifestam mais tarde, como bug de runtime (duas instâncias de reatividade) em vez de
  erro de instalação.
- Contribuidores novos herdam a flag sem saber, e a árvore de dependências instalada pode
  divergir entre máquinas.

## Plano de correção

1. Corrigir primeiro a causa raiz — alinhar o range de `vue` em `peerDependencies` com o
   que de fato é suportado (ver `build-peer-vue-versao-divergente.md`).
2. Remover `legacy-peer-deps=true` do `.npmrc` e rodar `npm install` limpo
   (`rm -rf node_modules package-lock.json && npm install`) para ver quais conflitos
   realmente existem.
3. Para os conflitos que sobrarem e forem legítimos (tipicamente os pacotes `file:`
   irmãos), preferir `overrides` explícitos no `package.json` — que documentam *qual*
   conflito está sendo resolvido — em vez do `legacy-peer-deps` global e opaco.
4. Se a flag precisar ficar por alguma razão concreta, adicionar um comentário no `.npmrc`
   explicando qual conflito ela contorna e quando pode ser removida.

## Verificação

- `rm -rf node_modules package-lock.json && npm install` conclui sem `ERESOLVE` após os
  ranges terem sido alinhados.
- `npm ls vue` mostra uma única versão resolvida.
- `npm run test` e `npm run build` continuam passando com o `.npmrc` reduzido/removido.
