# install(): o spread de `options` sobrescreve o tema MaxStyle e o teste não detecta

- **Categoria:** bug
- **Severidade:** alta
- **Arquivo(s):** `src/index.ts:187-203`; `tests/index.test.ts:17-30`
- **Domínio:** stores-barrel

## Problema

O `install()` monta a configuração do PrimeVue assim (`src/index.ts:188-201`):

```ts
app.use(PrimeVue, {
    locale: options.locale || ptBR,
    theme: {
        preset: MaxStyle,
        options: { darkModeSelector: '.dark', prefix: 'max', ...options.theme?.options },
        ...options.theme
    },
    ripple: true,
    ...options            // <-- :200
});
```

Há **dois** defeitos de precedência, ambos causados por spreads posicionados depois das chaves que deveriam vencer.

**1. `...options` no fim (`:200`) descarta todo o objeto `theme` cuidadosamente montado.**

Se o consumidor passar `options.theme` — exatamente o que o teste de `tests/index.test.ts:25` faz — a chave `theme` do spread final **substitui integralmente** o objeto construído nas linhas `:190-198`, incluindo `preset: MaxStyle`. O tema Max some e o PrimeVue cai no tema padrão dele. O mesmo vale para `locale`: um consumidor que passe `options.locale` tem o valor aplicado duas vezes (inofensivo), mas quem passar qualquer chave que colida perde a configuração da biblioteca.

Ou seja: `configureMaxApp`-style overrides parciais de tema não funcionam como o código sugere. Para passar `theme.options.prefix` sem perder o preset, o consumidor é obrigado a repassar `preset: MaxStyle` manualmente — o oposto do que as linhas `:190-198` tentam oferecer.

**2. `...options.theme` (`:197`) sobrescreve o `options` interno de `:194`.**

Dentro do objeto `theme`, a linha `:194` compõe `{ darkModeSelector, prefix, ...options.theme?.options }` — merge granular correto. Mas `:197` espalha `options.theme` inteiro logo em seguida, e se ele contiver a chave `options`, ela substitui o merge granular da linha anterior, ressuscitando o problema um nível abaixo. O merge de `:194` só tem efeito quando `options.theme.options` **não** existe — caso em que não havia nada para mesclar. A linha é efetivamente morta.

**O teste não pega nada disso.** `tests/index.test.ts:17-30` passa `theme: { options: { prefix: 'test' } }` e assevera apenas `expect(app.use).toHaveBeenCalled()` — não inspeciona o argumento. Qualquer configuração, correta ou destruída, passa nesse teste. É cobertura de linha sem cobertura de comportamento.

## Impacto

**Alto.** Toda aplicação consumidora que customize qualquer aspecto do tema (o caso de uso mais óbvio para `options.theme`) perde silenciosamente o preset `MaxStyle` e renderiza com a aparência padrão do PrimeVue — todas as variáveis `--max-*` do tema Max deixam de existir, quebrando também os utilitários do `presetMaxUno` que as referenciam. A falha é visual e global, sem erro de console, e o teste da suíte permanece verde.

## Plano de correção

1. Reordenar a construção para que o spread genérico não vença as chaves estruturadas. Extrair `theme` e `locale` de `options` antes do spread:
   ```ts
   const { theme: userTheme, locale: userLocale, ...rest } = options;
   app.use(PrimeVue, {
       ...rest,
       locale: userLocale || ptBR,
       ripple: options.ripple ?? true,
       theme: {
           ...userTheme,
           preset: userTheme?.preset ?? MaxStyle,
           options: { darkModeSelector: '.dark', prefix: 'max', ...userTheme?.options }
       }
   });
   ```
   Assim `rest` continua permitindo qualquer opção extra do PrimeVue, `ripple` continua sobrescrevível (hoje `ripple: true` em `:199` também só é sobrescrito por acidente do spread de `:200`), e o merge de tema passa a ser genuinamente granular com o preset preservado por padrão.
2. Confirmar a decisão de produto sobre `preset`: se o consumidor puder trocar o preset inteiro, `userTheme?.preset ?? MaxStyle` está certo; se `MaxStyle` for obrigatório, fixá-lo e ignorar o override.

## Verificação

Reescrever `tests/index.test.ts` para inspecionar o argumento efetivamente passado a `app.use`:

- Sem options → `app.use` recebe `locale === ptBR`, `theme.preset === MaxStyle`, `theme.options.prefix === 'max'`, `theme.options.darkModeSelector === '.dark'`, `ripple === true`.
- Com `theme: { options: { prefix: 'test' } }` → `theme.preset` **continua** sendo `MaxStyle`, `prefix === 'test'` e `darkModeSelector` permanece `'.dark'` (é o caso que hoje falha).
- Com `locale` customizado → `locale` é o customizado e o tema permanece intacto.
- Com `ripple: false` → chega `false`.
- Com uma chave arbitrária (`unstyled: true`) → é repassada sem afetar `theme`.
- `app.directive` chamado com `('tooltip', Tooltip)`.

```bash
npx vitest run tests/index.test.ts
npm run type-check
```
