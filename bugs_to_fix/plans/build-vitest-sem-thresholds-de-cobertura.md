# `vitest.config.ts` não define thresholds de cobertura

- **Categoria:** falta-de-teste
- **Severidade:** média
- **Arquivo(s):** `vitest.config.ts:33-45`
- **Domínio:** build-config

## Problema

O bloco `coverage` configura provider, reporters, `include` e `exclude`, mas **não define
`thresholds`**:

```ts
coverage: {
    provider: 'v8',
    reporter: ['text', 'html'],
    include: ['src/**/*.{ts,vue}'],
    exclude: [ /* ... */ ]
}
```

Sem `thresholds`, `npm run test:coverage` sempre sai com código 0, independentemente da
cobertura obtida. O relatório é informativo e nada mais — uma regressão que derrube a
cobertura de 90% para 40% passa no comando sem qualquer sinal.

Cobertura global medida atualmente: Statements 90,6% / Branches 81,09% / Functions 87,4% /
Lines 94%. São números bons, o que torna o custo de travá-los baixo: o piso pode ser fixado
logo abaixo do valor atual sem exigir nenhum teste novo.

Um segundo ponto no mesmo bloco: `reporter: ['text', 'html']` não inclui um formato legível
por máquina. Se houver (ou vier a haver) CI com integração de cobertura, falta `'json'` ou
`'lcov'`.

## Impacto

- Regressões de cobertura entram sem serem notadas.
- Os números de cobertura não têm força de contrato — são apenas um relatório que alguém
  precisa lembrar de ler.
- Especialmente relevante durante a migração de independência do PrimeVue descrita no
  `CLAUDE.md`: cada componente reimplementado é uma oportunidade de perder cobertura, e o
  threshold é justamente a rede que detecta isso.

## Plano de correção

1. Adicionar `thresholds` fixados um pouco abaixo dos valores atuais, para travar o patamar
   sem quebrar o build de imediato:

   ```ts
   coverage: {
       provider: 'v8',
       reporter: ['text', 'html', 'lcov'],
       include: ['src/**/*.{ts,vue}'],
       exclude: [ /* mantém a lista atual */ ],
       thresholds: {
           statements: 90,
           branches: 80,
           functions: 87,
           lines: 93
       }
   }
   ```

2. Considerar `thresholds.autoUpdate: true` para que o piso suba sozinho conforme a
   cobertura melhora, evitando que os números fiquem defasados para baixo.

3. Se/quando houver CI, rodar `npm run test:coverage` (e não apenas `npm run test`) no
   pipeline — o threshold só protege se o comando que o aplica for executado.

## Verificação

- `npm run test:coverage` continua passando com os valores atuais (exit code 0).
- Baixar artificialmente um threshold acima do valor real (ex.: `statements: 99`) e
  confirmar que o comando agora **falha** com exit code não-zero e mensagem de threshold.
- Restaurar os valores e confirmar que `coverage/lcov.info` é gerado.
