# CSS monolítico torna o entry raiz pesado mesmo para um componente

## Resumo

O entry público agrega os estilos de toda a biblioteca em uma string JavaScript com efeito colateral. Assim, uma aplicação que importa somente `MaxButton` pelo caminho público ainda retém aproximadamente 478 KB de chunk principal no benchmark local.

## Severidade e prioridade

- Severidade: alta para carregamento inicial de consumidores do entry raiz.
- Prioridade: P1; não é bloqueador funcional de release, mas requer orçamento de bundle.

## Evidências

- `src/index.ts:1-3` importa globalmente `virtual:uno.css`.
- `vite.config.ts:14-17` injeta o CSS apenas em `index.es.js`.
- `package.json:8-20` só oferece entries raiz, preset e resolver; não há subpaths por componente.
- `package.json:42-46` declara `dist/index.es.js` como side effect.
- `npx vite build --outDir <diretório-temporário>`: `index.es.js` mediu 941.654 bytes e 236.169 bytes com `gzip -c` na refutação.
- Análise do literal passado a `createTextNode`: 431.455 caracteres de CSS, 45,8% do entry de referência.
- Bundle consumidor com Rolldown importando apenas `{ MaxButton }` de `dist/index.es.js`: chunk principal de 477.773 bytes, além de chunks dinâmicos emitidos.
- `tests/index.test.ts` e `tests/core/install.test.ts` validam contratos, mas não possuem orçamento de tamanho ou prova de tree-shaking.

## Componentes afetados

Todos os consumidores do entry raiz; especialmente aplicações que usam poucos componentes.

## Causa-raiz

API, estilos agregados e instalação global compartilham uma única fronteira de módulo. A injeção transforma todo CSS em efeito colateral indivisível; exports assíncronos de alguns componentes não particionam os estilos que já foram coletados no entry.

## Impacto quantificado

No artefato medido, o CSS ocupa 431.455 caracteres e 45,8% do JS raiz. O caso mínimo de `MaxButton` reteve 477.773 bytes de chunk principal antes da compressão. `npm pack --dry-run --json` mediu 749.283 bytes compactado e 4.196.199 bytes descompactado em 366 arquivos.

## Reprodução e benchmark

Executar `npx vite build`; medir bruto/gzip/Brotli; localizar e medir o argumento de `createTextNode`; criar um entry virtual que importe somente `MaxButton` e gerar com Rolldown. Repetir com cinco componentes representativos.

## Direção de solução

Publicar subpaths estáveis por componente e CSS por componente/segmento, ou um CSS global opt-in separado; preservar um entry agregador para compatibilidade. Remover efeitos colaterais do módulo de componentes e declarar side effects apenas nos arquivos de estilo necessários.

## Critérios de aceite

- Importar um componente não inclui CSS nem código de componentes alheios.
- Entries raiz e por componente preservam SSR e compatibilidade documentada.
- CI mede tamanhos bruto, gzip e Brotli de casos mínimos.
- O orçamento e a regressão de tree-shaking têm testes automatizados.

## Contraevidências

- O entry completo comprime para cerca de 236 KB gzip.
- Dependências pesadas como Monaco, Tiptap, Chart e Maps já possuem alguma separação assíncrona.
- Chunks dinâmicos emitidos não são necessariamente baixados no carregamento inicial; o problema demonstrado é sobretudo o chunk raiz/CSS.
