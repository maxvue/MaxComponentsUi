# Plano 38 — `MaxComponentsUiResolver` (substitui `@primevue/auto-import-resolver`)

| | |
|---|---|
| **id** | 38 |
| **Arquivo** | `src/helpers/MaxComponentsUiResolver.ts` |
| **Primitiva eliminada** | `@primevue/auto-import-resolver` (pacote **separado**) |
| **Depende de** | 36 (`prime/index.ts` — a decisão dele determina este) |

⚠️ **Dependência distinta.** Este arquivo não importa `primevue` nem `@primeuix` — ele
importa **`@primevue/auto-import-resolver`**, um terceiro pacote. Um `grep` por
`"primevue"` o encontra (por causa do `@primevue/`), mas um `npm uninstall primevue
@primeuix/themes` **não** o remove. É fácil deixar essa dependência para trás e achar
que a migração terminou.

---

## 1. Estado atual

```ts
// src/helpers/MaxComponentsUiResolver.ts
import { PrimeVueResolver } from '@primevue/auto-import-resolver';   // linha 3

// ...
const primeVueResolvers = PrimeVueResolver();                        // linha 19
```

**Leia o arquivo inteiro** antes de mudar — entenda como os resolvers do Max e do
PrimeVue são combinados (ordem de precedência, fallback, tratamento de aliases).

```bash
cat src/helpers/MaxComponentsUiResolver.ts
```

---

## 2. O que este arquivo faz

É o resolver do `unplugin-vue-components`, publicado como entry point próprio:

```json
"./resolver": {
    "types": "./dist/helpers/resolver.d.ts",
    "import": "./dist/resolver.es.js"
}
```

Apps consumidoras o registram no `vite.config.ts` para auto-importar componentes sem
declarar `import`. Ele resolve:

1. **componentes Max** — via `src/components-manifest.json` (gerado por
   `src/scripts/generateResolver.ts`), incluindo aliases snake_case, kebab-case e sem
   prefixo `Max`;
2. **componentes PrimeVue** — delegando ao `PrimeVueResolver()`, para que os
   re-exports de `src/prime/index.ts` também funcionem sem import explícito.

O ponto 2 é o que precisa sair.

---

## 3. A mudança depende da decisão do item 36

| Decisão do id 36 | O que fazer aqui |
|---|---|
| **A** — remover o entry `./prime` | Remova `PrimeVueResolver` por completo. O resolver passa a atender só os componentes Max. |
| **B** — PrimeVue como peer opcional | Torne o `PrimeVueResolver` um **import dinâmico opcional**: se o pacote não estiver instalado, siga sem ele em vez de quebrar o build da app consumidora. |
| **C** — reimplementar os usados | Adicione os novos componentes ao manifesto do Max e remova o `PrimeVueResolver`. |
| **D** — copiar o código | Idem C. |

**Não execute este item antes da decisão do 36.**

### Esboço da opção B (import opcional)

```ts
let primeVueResolvers: ComponentResolver[] = [];

try {
    // opcional: só resolve PrimeVue se a app consumidora o tiver instalado
    const { PrimeVueResolver } = await import('@primevue/auto-import-resolver');
    primeVueResolvers = [PrimeVueResolver()].flat();
} catch {
    primeVueResolvers = [];
}
```

> Um `try/catch` em torno de `import()` é o padrão correto para dependência opcional.
> Um import estático faz o build da app **falhar** se o pacote não existir — exatamente
> o que "opcional" deveria evitar.

### Esboço da opção A (remoção limpa)

```diff
- import { PrimeVueResolver } from '@primevue/auto-import-resolver';
```

```diff
-            const primeVueResolvers = PrimeVueResolver();
-            // ...lógica que combina os dois conjuntos
+            // resolve apenas componentes Max, via components-manifest.json
```

Cuide para não quebrar a lógica de precedência: se hoje um nome ambíguo (ex.: `Button`)
resolve para o Max e não para o PrimeVue, esse comportamento precisa continuar.

---

## 4. `package.json`

```bash
node -p "require('./package.json').dependencies['@primevue/auto-import-resolver'] ?? require('./package.json').devDependencies['@primevue/auto-import-resolver']"
```

Nas opções A, C e D:

```bash
npm uninstall @primevue/auto-import-resolver
```

Na opção B, mova-o para `peerDependencies` como opcional.

---

## 5. Teste

O resolver não tem teste hoje. Crie `tests/helpers/MaxComponentsUiResolver.test.ts`:

1. resolve um componente Max pelo nome exato (`MaxInputText`);
2. resolve pelo alias sem prefixo (`InputText`);
3. resolve pelo alias kebab-case (`max-input-text`);
4. resolve pelo alias snake_case (`max_input_text`);
5. retorna `undefined` para um nome desconhecido (não pode inventar import);
6. o caminho de import retornado aponta para o pacote correto;
7. **precedência**: um nome que existe nos dois conjuntos resolve para o Max;
8. (opção B) ausência do `@primevue/auto-import-resolver` não lança erro.

---

## 6. Verificação de ponta a ponta

Teste real no consumo — é o que de fato valida um resolver:

```bash
npm run build
npm run dev:playground   # o playground usa auto-import?
```

Se possível, aponte uma app consumidora para o `dist/` local (`npm link` ou
`file:`) e confirme que os componentes continuam sendo auto-importados.

---

## 7. Checklist de conclusão

- [ ] Decisão do id 36 registrada e refletida aqui
- [ ] `grep -n "primevue\|@primevue" src/helpers/MaxComponentsUiResolver.ts` → vazio
      (ou import dinâmico opcional, na opção B)
- [ ] `@primevue/auto-import-resolver` removido do `package.json` (ou movido a peer opcional)
- [ ] Precedência Max > PrimeVue preservada
- [ ] Teste do resolver criado, 8 asserções passam
- [ ] Auto-import validado no playground ou numa app consumidora
- [ ] `build`, `type-check`, `lint`, `test` OK
