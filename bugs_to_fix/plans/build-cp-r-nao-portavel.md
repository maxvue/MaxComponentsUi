# Script `build` usa `cp -r`, quebrando em Windows

- **Categoria:** build
- **Severidade:** média
- **Arquivo(s):** `package.json:35`
- **Domínio:** build-config

## Problema

O script de build encadeia um comando Unix puro:

```json
"build": "vue-tsc && vite build && cp -r src/themes dist/"
```

`cp` não existe no `cmd.exe` nem no PowerShell do Windows (onde o equivalente seria
`xcopy`/`Copy-Item`). Qualquer contribuidor em Windows que rode `npm run build` recebe
`'cp' não é reconhecido como um comando interno ou externo` e o build falha **depois** do
`vite build` ter escrito o `dist/` — ou seja, o `dist/` fica publicável porém incompleto
(sem `dist/themes/`).

Isso é agravado pelo fato de `dist/themes/` não ser opcional: o preset UnoCSS
(`src/presetMaxUno.ts:103`) resolve `./themes/all.scss` relativo ao próprio arquivo em
`dist/` no preflight. Sem a cópia, o `existsSync` falha, o fallback para `../src/themes`
também falha no pacote publicado, e o `getCSS()` retorna string vazia — a app consumidora
perde silenciosamente todas as variáveis CSS do tema (`--background-300`, `--blue-600`, etc.).

## Impacto

- Build impossível em Windows sem WSL/Git Bash.
- Risco de publicação de um pacote sem `dist/themes/`, que degrada de forma **silenciosa**
  (sem erro, apenas sem tema) em todas as apps consumidoras.
- A etapa de cópia não tem verificação posterior: nada no pipeline confere se
  `dist/themes/all.scss` existe ao fim do build.

## Plano de correção

1. Substituir a cópia via shell por uma etapa portável. Opção preferida — mover a cópia
   para dentro do próprio `vite.config.ts`, como um plugin `closeBundle`, aproveitando
   `fs.cpSync` (Node >= 16.7), eliminando a dependência de shell:

   ```ts
   // vite.config.ts
   {
       name: 'copy-themes',
       closeBundle() {
           fs.cpSync(
               path.resolve(__dirname, 'src/themes'),
               path.resolve(__dirname, 'dist/themes'),
               { recursive: true }
           );
       }
   }
   ```

   e reduzir o script para `"build": "vue-tsc && vite build"`.

2. Alternativa mínima, caso se queira manter a cópia fora do Vite: criar
   `scripts/copy-themes.mjs` com o mesmo `fs.cpSync` e usar
   `"build": "vue-tsc && vite build && node scripts/copy-themes.mjs"`.
   Evitar adicionar dependência externa (`shx`, `cpx`) só para isso.

3. Na mesma etapa, adicionar uma asserção de que `dist/themes/all.scss` existe ao final,
   lançando erro se não existir — assim a falha vira ruidosa em vez de silenciosa.

## Verificação

- `rm -rf dist && npm run build && ls dist/themes/all.scss` retorna o arquivo.
- Simular o caminho de falha: remover temporariamente `src/themes` e confirmar que o build
  agora **falha** em vez de gerar um `dist/` incompleto.
- `npm pack --dry-run` lista os arquivos de `dist/themes/` no tarball.
