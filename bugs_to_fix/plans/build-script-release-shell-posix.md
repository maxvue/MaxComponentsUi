# Script `release` usa sintaxe POSIX e encadeia publicação com `&&` frágil

- **Categoria:** build
- **Severidade:** média
- **Arquivo(s):** `package.json:39`
- **Domínio:** build-config

## Problema

```json
"release": "[ \"$(git branch --show-current)\" = main ] && npm run type-check && npm run build && npm run test && npm version patch -m 'Upgrade to %s' && git push origin main --follow-tags && npm publish --access public"
```

Três problemas distintos no mesmo comando:

1. **Portabilidade.** `[ ... ]` e `$(...)` são construções do `sh`/`bash`. No Windows o npm
   usa `cmd.exe` por padrão e o comando falha com erro de sintaxe. Também não funciona em
   shells não-POSIX configurados via `script-shell`.

2. **Falha silenciosa do guard.** Quando a branch atual não é `main`, o `[ ... ]` retorna
   status 1 e o `&&` interrompe a cadeia — o script termina com código de saída não-zero,
   mas **sem nenhuma mensagem** explicando o porquê. O desenvolvedor vê apenas
   `npm ERR! code 1`. O guard deveria imprimir a razão.

3. **Ordem de operações perigosa.** `npm version patch` cria o commit e a tag **antes** do
   `git push` e do `npm publish`. Se o `npm publish` falhar (rede, credencial, versão já
   existente), o repositório fica com uma tag e um bump de versão publicados no remoto sem
   o pacote correspondente no registry — estado inconsistente que exige limpeza manual
   (`git tag -d`, `git push --delete`).

## Impacto

- Release impossível em Windows.
- Diagnóstico ruim quando o guard de branch dispara.
- Possibilidade de tag/versão órfã no Git sem publicação correspondente no npm.

## Plano de correção

1. Extrair para `scripts/release.mjs` em Node puro (portável), ou no mínimo tornar o guard
   explícito e portável via Node inline:

   ```json
   "prerelease": "node -e \"const b=require('node:child_process').execSync('git branch --show-current').toString().trim(); if(b!=='main'){console.error(`Release só é permitido a partir de main (branch atual: ${b}).`); process.exit(1);}\"",
   "release": "npm run type-check && npm run build && npm run test && npm version patch -m 'Upgrade to %s' && git push origin main --follow-tags && npm publish --access public"
   ```

   O hook `prerelease` roda automaticamente antes de `release` e agora emite mensagem clara.

2. Considerar rodar `npm publish --dry-run` **antes** do `npm version patch`, para que
   erros de autenticação/versão apareçam antes de criar a tag.

3. Adicionar `--access public` já está correto e é redundante com o `publishConfig.access`
   existente (`package.json:29-31`) — pode ser mantido por clareza.

## Verificação

- A partir de uma branch diferente de `main`, rodar `npm run release` e confirmar a mensagem
  explícita de bloqueio e o exit code 1, sem que nenhum comando subsequente execute.
- Rodar o guard em um shell não-POSIX (ou com `npm config set script-shell` apontando para
  `cmd.exe`) e confirmar que ele ainda funciona.
