# `peerDependencies.vue` (`^3.5.0`) diverge da `vue` de desenvolvimento (`^3.6.0-rc.2`)

- **Categoria:** divergência
- **Severidade:** média
- **Arquivo(s):** `package.json:130`, `package.json:110`
- **Domínio:** build-config

## Problema

A biblioteca declara suportar `vue: ^3.5.0` como peer, mas é desenvolvida, tipada e testada
exclusivamente contra `vue: ^3.6.0-rc.2`:

```json
"devDependencies": { "vue": "^3.6.0-rc.2" }   // package.json:110
"peerDependencies": { "vue": "^3.5.0" }        // package.json:130
```

Nenhuma parte do pipeline valida a faixa `3.5.x`: o `vue-tsc` do `type-check`/`build`, o
`vitest` e o playground resolvem todos a mesma cópia 3.6-rc de `node_modules`. Portanto o
range `^3.5.0` é uma afirmação de compatibilidade **não verificada** — se algum componente
usar uma API introduzida no 3.6 (ou depender de comportamento alterado entre 3.5 e 3.6), a
app consumidora em 3.5 quebra em runtime, e nada neste repositório detectaria isso.

Há um agravante: desenvolver contra um **release candidate** (`3.6.0-rc.2`) significa que os
tipos e o comportamento sob os quais a lib é validada ainda podem mudar antes do 3.6.0
final. Combinado com `legacy-peer-deps=true` no `.npmrc`, o npm nunca reclama da divergência.

O mesmo padrão aparece, de forma benigna, em `vue-router`: `^5.2.0` tanto em dev
(`package.json:112`) quanto em peer (`package.json:131`) — esse par está consistente e serve
de referência do que fazer com o `vue`.

## Impacto

- Consumidores em Vue 3.5.x instalam a lib sem aviso e podem encontrar falhas de runtime
  que o CI da biblioteca nunca exercita.
- O range de peer publicado não reflete o que foi realmente testado, o que é uma promessa de
  compatibilidade incorreta no pacote publicado.

## Plano de correção

Escolher uma das duas direções — não deixar como está:

**Opção A (recomendada, honesta com o que é testado):** estreitar o peer para a faixa
efetivamente validada, `"vue": "^3.6.0"`, e mover a devDependency para a versão estável
`^3.6.0` assim que ela sair do RC. Documentar no README que o suporte mínimo passou a ser
3.6, e publicar isso como um bump minor/major conforme a política de versionamento.

**Opção B (manter o suporte a 3.5):** manter `^3.5.0` no peer, mas então provar que
funciona — adicionar ao CI uma matriz que instale `vue@3.5` e rode `npm run type-check` e
`npm run test` contra ela. Sem essa matriz, a Opção B é apenas a situação atual com mais
passos.

Em qualquer caso, sair do RC: fixar a devDependency numa versão estável do Vue antes do
próximo release, para que `vue-tsc` valide contra tipos definitivos.

## Verificação

- Opção A: `npm ls vue` mostra a mesma major/minor que o peer declarado; `npm run type-check`
  e `npm run test` passam.
- Opção B: o job da matriz com `vue@3.5.x` passa em `type-check` e `test`.
- `npm pack --dry-run` e a inspeção do `package.json` publicado mostram o range pretendido.
