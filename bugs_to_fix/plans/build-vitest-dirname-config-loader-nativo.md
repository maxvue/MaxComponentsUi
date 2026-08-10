# `vitest.config.ts` usa `__dirname`, incompatível com o `configLoader: 'native'` do Vite

- **Categoria:** build
- **Severidade:** baixa
- **Arquivo(s):** `vitest.config.ts:11`, `vitest.config.ts:12`, `vitest.config.ts:13`, `vitest.config.ts:14`, `vitest.config.ts:20`, `vitest.config.ts:21`
- **Domínio:** build-config

## Problema

Toda execução de teste imprime o aviso:

```
(!) Your Vite config uses features that are unsupported by `configLoader: 'native'`,
which is planned to become the default in a future major version of Vite:
  - `__dirname` (vitest.config.ts:11:45). Use `import.meta.dirname` instead
```

O arquivo é um módulo ES (`package.json:7` declara `"type": "module"`), onde `__dirname` não
existe nativamente — ele só funciona hoje porque o loader atual do Vite transpila o config
para CJS antes de executá-lo. Quando o `configLoader: 'native'` virar o padrão (anunciado
para uma major futura do Vite), o config passa a ser carregado como ESM de verdade e
`__dirname` fica `undefined`, fazendo todos os `path.resolve` produzirem caminhos errados.

O aviso cita a linha 11, mas o `__dirname` aparece em seis lugares no arquivo — linhas 11,
12, 13, 14, 20 e 21. O Vite só reporta a primeira ocorrência.

O mesmo padrão existe em `vite.config.ts:26-29` e `vite.config.ts:64`. Ali o `vite.config.ts`
é mais consistente: já usa `import.meta.url` na leitura do `package.json`
(`vite.config.ts:9`), mas mistura com `__dirname` nos `path.resolve`. Convém corrigir os
dois arquivos na mesma passada.

## Impacto

- Ruído em toda execução de `npm run test`, `test:watch` e `test:coverage`.
- Quebra futura garantida na próxima major do Vite: os aliases (`@`, `@helpers`,
  `@maxvue/max-use`, `vue`, `@vueuse/core`) resolveriam para caminhos inválidos, e o
  cuidadoso trabalho de deduplicação de instância documentado em `vitest.config.ts:15-24`
  deixaria de funcionar — provavelmente com falhas de teste confusas, não com um erro claro.

## Plano de correção

1. Em `vitest.config.ts`, substituir as seis ocorrências de `__dirname` por
   `import.meta.dirname` e remover o `import path from 'node:path'` se ele ficar sem uso
   (não ficará — `path.resolve` continua sendo usado).

   `import.meta.dirname` está disponível no Node 20.11+ / 21.2+. Como o projeto já usa
   `@types/node` ^26 e um toolchain moderno, não há impedimento; se for necessário suportar
   Node mais antigo, a alternativa é
   `const __dirname = path.dirname(fileURLToPath(import.meta.url));`.

2. Aplicar a mesma substituição em `vite.config.ts:26-29` e `vite.config.ts:64`, para
   alinhar com o `import.meta.url` já usado na linha 9.

3. Rodar os testes e confirmar o desaparecimento do aviso. Opcionalmente, validar o futuro
   comportamento antecipadamente definindo `configLoader: 'native'` de forma explícita.

## Verificação

- `npx vitest run` executa sem imprimir o bloco `(!) Your Vite config uses features...`.
- Os testes continuam passando na mesma quantidade de antes (baseline atual: suíte completa
  verde; `tests/preset` sozinho = 2 arquivos, 35 testes).
- `npm run build` continua gerando as quatro entradas em `dist/` com os mesmos caminhos.
- `grep -n "__dirname" vite.config.ts vitest.config.ts` não retorna nada.
