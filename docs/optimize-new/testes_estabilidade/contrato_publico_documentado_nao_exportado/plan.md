# Plano de implementação — alinhar subpaths públicos e documentação

## Objetivo e resultado

Garantir que todo subpath documentado resolva no tarball com JS e tipos, ou seja removido com migração explícita. Sustentar `/stores`; remover a promessa obsoleta de `/prime`.

## Escopo e fora de escopo

- Publicar `@maxvue/max-components-ui/stores` a partir de `src/stores/index.ts`.
- Remover referências a `/prime` de README, PRIME e AUTO-IMPORT, registrando import direto de `primevue/*`.
- Testar tarball, não source.
- Não restaurar reexports PrimeVue nem mudar o resolver atual além da documentação.

## Arquivos

- Alterar `vite.config.ts`, `package.json`, `README.md`, `docs/STORES.md`, `docs/PRIME.md` e `docs/AUTO-IMPORT.md`.
- Alterar/adicionar testes de exports em `tests/architecture/` e fixture consumidora.
- Ajustar `src/index.ts` somente se necessário para evitar divergência, mantendo stores na raiz.

## Dependências e ordem

1. Fixar decisão de contrato.
2. Gerar entry/tipos de stores.
3. Atualizar exports.
4. Corrigir toda documentação.
5. Validar tarball. Coordenar com modularização de entries/CSS para não editar `package.json` em paralelo.

## Passos

1. Adicionar entry `stores` ao build apontando para `src/stores/index.ts`.
2. Declarar `./stores` com condições `types`/`import` e conferir artefatos sem hash.
3. Manter imports de stores pela raiz.
4. Substituir exemplos `/prime` por imports diretos e transformar `docs/PRIME.md` em guia de migração/depreciação ou removê-lo das navegações.
5. Corrigir a descrição do resolver: ele só resolve componentes Max pelo contrato vigente.
6. Criar teste que percorra subpaths citados nos Markdown e confronte `package.json#exports`, mais smoke test Node/bundler/TypeScript no tarball.

## Migração e testes

`/stores` passa a funcionar de forma aditiva. `/prime` não é restaurado; consumidores instalam/importam PrimeVue diretamente. Testar exports raiz/stores/preset/resolver, tipos, SSR e snippets. A11y/benchmark não são pertinentes.

## Aceite

- Todos os subpaths documentados resolvem no tarball.
- `/stores` exporta as mesmas stores da raiz e possui tipos.
- Nenhum guia recomenda `/prime` ou fallback inexistente.
- Import de subpath desconhecido continua bloqueado.

## Riscos e rollback

Tipos/entry podem divergir; validar pacote instalado. Alterações de modularização podem conflitar; integrar uma única matriz de exports. Rollback remove `/stores` e restaura docs somente se houver nota clara de alternativa pela raiz.

## Validação final

Build limpo, `npm pack --dry-run --json`, smoke tests Node/Vite/TS, testes de resolver/docs, suíte, type-check e `git diff --check`.
