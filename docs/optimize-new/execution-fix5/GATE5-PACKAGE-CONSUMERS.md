# GATE5-PACKAGE-CONSUMERS

## Escopo

Validação independente dos consumidores publicados no `HEAD`
`cabb5d710f452a8a27e34d92210a28261491f8ac`.

## Comando executado

```text
npm run verify:consumers
```

O script reconstruiu a distribuição com `npm run build:clean`, gerou um
tarball exclusivo por `npm pack --json --pack-destination`, instalou-o em
consumidores temporários distintos e não usou `--legacy-peer-deps`.

## Evidências

| Cenário | Resultado |
| --- | --- |
| Node ESM sem dependências opcionais | PASSOU — `MaxButton` e `styles` importados |
| Node ESM com UnoCSS | PASSOU — raiz, `preset` e `resolver` importados |
| TypeScript | PASSOU — `npx tsc --noEmit` |
| Vite | PASSOU — build sem warning de chunk; CSS e os 6 temas importados |
| SSR | PASSOU — `renderToString` retornou `<button>` |
| Subpath inexistente | PASSOU — rejeitado por `ERR_PACKAGE_PATH_NOT_EXPORTED` |
| Cleanup | PASSOU — `/tmp/max-components-test-lFJNVC` e `/tmp/max-components-pack-cnGv0D` não existem após o `finally` |

Trechos relevantes da saída:

```text
ESM sem deps opcionais — OK
ESM com deps opcionais — OK
✅ TypeScript Consumer — OK
✅ Vite Consumer — OK
SSR OK
Subpath desconhecido corretamente rejeitado com: ERR_PACKAGE_PATH_NOT_EXPORTED
✅ --- Todos os cenários de validação passaram com sucesso ---
Diretório temporário removido: /tmp/max-components-test-lFJNVC
Diretório do tarball removido: /tmp/max-components-pack-cnGv0D
```

O build do consumidor Vite produziu `index-4YBXOBsq.js` de 78,02 kB (29,48 kB
gzip) e CSS de 391,14 kB (53,17 kB gzip), sem aviso de chunk.

## Veredito

**ACEITO.** Node, TypeScript, Vite, SSR, CSS, seis temas, subpath negativo e
limpeza de temporários foram comprovados pelo consumidor empacotado deste HEAD.
