# 28 — package.json: dependências duplicadas, mortas e peer range em RC

**Severidade:** Média
**Categoria:** Empacotamento
**Arquivos:** `package.json`

## Problemas

- `primevue` e `@primeuix/themes` aparecem em `dependencies` **e** `devDependencies` (duplicados).
- `@tanstack/vue-virtual` em `dependencies` — nenhum uso em `src/` (grep só acha cache do playground). Dependência morta.
- `vite-plugin-css-injected-by-js` em `dependencies` — plugin de build, deveria ser devDependency (hoje é instalado por todo consumidor).
- `peerDependencies.vue: ^3.6.0-rc.2` — peer apontando para **release candidate**; consumidores em Vue 3.5 estável falham no peer check.
- `peerDependencies.vue-router ^5.0.6` vs devDep `^5.2.0` (inconsistência menor).
- `sass` em `dependencies` está **correto** (o preset compila SCSS no build do consumidor) — não mover.

## Correção sugerida

Remover duplicatas das devDeps, remover `@tanstack/vue-virtual`, mover o plugin CSS para devDeps, revisar o peer de `vue` (ex.: `^3.5.0`).
