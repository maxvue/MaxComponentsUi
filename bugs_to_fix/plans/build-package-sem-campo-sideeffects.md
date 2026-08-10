# `package.json` não declara `sideEffects`, arriscando tree-shaking do CSS injetado

- **Categoria:** build
- **Severidade:** média
- **Arquivo(s):** `package.json:26-31`, `src/index.ts:1`, `vite.config.ts:16-20`
- **Domínio:** build-config

## Problema

O `package.json` não tem o campo `sideEffects`. Na ausência dele, bundlers modernos
(webpack, Rollup, Vite em modo produção) assumem o padrão conservador `sideEffects: true`,
o que **hoje funciona**, mas por acidente, não por design — e o pacote fica sem nenhuma
declaração de intenção.

A situação é delicada aqui porque a entrada principal tem um efeito colateral essencial e
não óbvio. `src/index.ts:1`:

```ts
import 'virtual:uno.css';
```

e o `vite-plugin-css-injected-by-js` (`vite.config.ts:16-20`) transforma isso em código que
injeta uma `<style>` no `document` em tempo de import — verificável no artefato:
`dist/index.es.js` contém a lógica de `appendChild` do CSS.

Consequências das duas escolhas possíveis:

- Se alguém adicionar `"sideEffects": false` (uma otimização comum e aparentemente
  inofensiva, frequentemente sugerida por linters de pacote), o bundler passa a ter licença
  para descartar o módulo de injeção de CSS quando o consumidor importa apenas alguns
  componentes nomeados. O resultado é uma app **sem nenhum estilo**, falhando de forma
  silenciosa e muito difícil de diagnosticar.
- Mantendo o campo ausente, perde-se tree-shaking em todo o pacote: o consumidor que importa
  só `MaxButton` não consegue eliminar os módulos não usados de forma agressiva.

A declaração correta é intermediária: marcar como *com* efeito colateral exatamente os
arquivos que têm, e liberar o resto.

## Impacto

- Risco latente de perda total de estilos caso `sideEffects: false` seja adicionado por
  alguém sem conhecer a dependência do CSS injetado.
- Tree-shaking subótimo nas apps consumidoras enquanto o campo permanece ausente.
- A intenção do autor sobre efeitos colaterais não está registrada em lugar nenhum.

## Plano de correção

1. Declarar explicitamente os arquivos com efeito colateral:

   ```json
   "sideEffects": [
       "**/*.css",
       "**/*.scss",
       "./dist/index.es.js"
   ]
   ```

   `dist/index.es.js` precisa constar porque é ele que carrega a injeção de CSS. As demais
   entradas (`preset.es.js`, `resolver.es.js`, `prime.es.js`) são puras e ficam livres para
   tree-shaking.

2. Adicionar um comentário no `src/index.ts`, junto ao `import 'virtual:uno.css'`,
   explicando que esse import é a fonte dos estilos em runtime e não pode ser removido —
   protegendo contra alguém "limpar" um import aparentemente sem uso.

3. Validar num consumidor real que o tree-shaking não remove os estilos.

## Verificação

- Em uma app consumidora de teste, importar um único componente
  (`import { MaxButton } from '@maxvue/max-components-ui'`), buildar em modo produção e
  confirmar que a `<style>` do Max continua sendo injetada e o botão aparece estilizado.
- Confirmar que os módulos não usados foram efetivamente removidos, comparando o tamanho do
  bundle antes e depois da mudança.
- `npm pack --dry-run` continua listando os mesmos arquivos.
