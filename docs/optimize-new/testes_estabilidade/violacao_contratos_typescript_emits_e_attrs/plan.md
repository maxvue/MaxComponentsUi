# Plano de implementação — unificar o grafo Vue e dependências publicáveis

## Objetivo e resultado

Usar uma única versão estável de Vue/VueUse no grafo, substituir dependências `file:` por versões publicadas/reproduzíveis e fazer type-check, build e instalação externa passarem sem casts compensatórios.

## Escopo e fora de escopo

- Alinhar contratos de peer/dependency de MaxUse, MaxPinia e desta biblioteca.
- Atualizar lockfile e remover aliases de teste que escondem duplicação.
- Corrigir os erros reais em `MaxInputFile` e `MaxPageMobileLayout` após unificação.
- Não mascarar tipos com `as any` nem publicar pacotes irmãos a partir deste repositório sem autorização própria.

## Arquivos

- Alterar `package.json`, lockfile, `vite.config.ts` e `vitest.config.ts`.
- Alterar `src/components/MaxInputFile.vue` e `src/components/MaxPageMobileLayout.vue` apenas se erros permanecerem.
- Nos repositórios MaxUse/MaxPinia, preparar releases que movam Vue, Pinia e VueUse compartilhados para peers compatíveis; isso é dependência externa desta implementação.
- Criar fixture de instalação em `tests/fixtures/package-consumer/` e teste arquitetural de árvore.

## Dependências e ordem

1. Publicar versões corrigidas dos pacotes irmãos.
2. Fixar uma versão estável compatível de Vue/ecossistema.
3. Trocar `file:` por ranges publicados e reinstalar limpo.
4. Remover workarounds e corrigir erros residuais.
5. Validar tarball externo.

## Passos

1. Nos irmãos, declarar Vue/Pinia/VueUse como peer quando tipos/refs atravessam fronteira e mantê-los em devDependencies para build/test.
2. Publicar e verificar tarballs dos irmãos.
3. Atualizar dependências desta biblioteca para versões npm exatas/ranges deliberados; regenerar lockfile por instalação limpa.
4. Alinhar Vue, compiladores, test-utils, Pinia e VueUse a versões mutuamente compatíveis, evitando RC divergentes.
5. Remover aliases para source sibling em Vite/Vitest e manter apenas `dedupe` necessário.
6. Rodar `npm ls` e falhar CI para árvore inválida/duplicada.
7. Reexecutar type-check; corrigir tipos nas duas linhas sem casts, usando assinaturas compartilhadas.
8. Instalar tarball em diretório vazio e compilar componente que usa refs/composables.

## Migração e compatibilidade

Mudança de dependência pode exigir versão major se elevar peer mínimo. Declarar ranges e mensagem de erro claros. Lockfile local deixa de depender da disposição de pastas irmãs. Consumidores devem instalar peers compatíveis.

## Testes

- Type-check/build sem aliases de source.
- Fixture instala tarball e usa `MaxInputFile`/`MaxPageMobileLayout`.
- `npm ls vue pinia @vueuse/core` mostra uma instância válida.
- Testes reativos confirmam watchers entre fronteiras.
- A11y/benchmark não se aplicam; medir tamanho apenas para detectar duplicação de runtime.

## Aceite

Uma única Vue válida, nenhum `file:` no pacote publicado, `npm ci` em checkout isolado passa, type-check/build/release gate ficam verdes e não surgem casts de contorno.

## Riscos e rollback

Release dos irmãos é bloqueio externo; não apontar para Git/local como atalho. Mudança de peers pode quebrar consumidores antigos; usar major e matriz de compatibilidade. Rollback fixa última combinação publicada funcional, nunca restaura `file:`.

## Validação final

`npm ci` limpo, `npm ls`, type-check, build, suíte, pack, instalação/compilação da fixture, inspeção do tarball e `git diff --check`.
