# Plano 35 — `MaxStyle` (substitui `@primeuix/themes` + Aura)

| | |
|---|---|
| **id** | 35 |
| **Arquivo** | `src/styles/style.ts` |
| **Primitivas eliminadas** | `@primeuix/themes`, preset `Aura` |
| **Depende de** | 16, 23, 33 (os componentes que mais dependem do tema) |
| **Teste** | visual — não há teste unitário aplicável |

⚠️ **Alto risco visual.** O `MaxStyle` é um `definePreset(Aura, {...})`: ele **herda
centenas de tokens do Aura** e sobrescreve apenas alguns. Todo o visual não sobrescrito
vem do Aura — e some junto com ele.

---

## 1. O que existe hoje

```ts
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

export const MaxStyle = definePreset(Aura, {
    semantic: {
        primary: { 50: '#67C8DB', ..., 900: '#001931' },
        success: { ... },
        info: { ... },
        // ... demais paletas
    }
});
```

Aplicado em `src/index.ts` via `app.use(PrimeVue, { theme: { preset: MaxStyle, ... } })`.

O `@primeuix/themes` transforma esse objeto em **CSS custom properties** (`--p-primary-500`,
`--p-button-primary-background`, etc.) injetadas no `<head>`.

---

## 2. Estratégia

O objetivo é gerar as **mesmas variáveis CSS**, sem a biblioteca.

### Passo 1 — Capturar o CSS gerado hoje (faça ANTES de remover)

```bash
npm run dev:playground
```

No DevTools:
1. Encontre o `<style>` injetado pelo PrimeVue (procure por `--p-primary-500`);
2. **Copie o conteúdo inteiro** para `prime_vue_migration/captura-tema-aura.css`;
3. Commite esse arquivo — ele é a sua referência de verdade.

Alternativa programática:

```js
// cole no console do playground
copy([...document.querySelectorAll('style')]
    .map((s) => s.textContent)
    .filter((t) => t && t.includes('--p-'))
    .join('\n\n'));
```

> **Este passo é insubstituível.** Sem a captura, você estará adivinhando centenas de
> valores. Faça-o enquanto o PrimeVue ainda está instalado.

### Passo 2 — Filtrar o que importa

A captura terá tokens de ~90 componentes, a maioria que este repositório não usa.
Mantenha apenas os prefixos relevantes:

- `--p-primary-*`, `--p-surface-*`, e as paletas semânticas (success, info, warn, danger);
- `--p-button-*` (usado por `MaxButton` e pelo SCSS com `--max-button-*-border-color`);
- `--p-inputtext-*`, `--p-select-*`, `--p-datatable-*`, `--p-checkbox-*`,
  `--p-toggleswitch-*`, `--p-badge-*`, `--p-avatar-*`, `--p-tooltip-*`,
  `--p-datepicker-*`, `--p-autocomplete-*`, `--p-fileupload-*`, `--p-menu-*`;
- tokens globais: `--p-content-border-radius`, `--p-form-field-*`, `--p-transition-duration`.

### Passo 3 — Escrever o tema próprio

```ts
// src/styles/style.ts
export const MaxStyle = {
    primary: { 50: '#67C8DB', /* ... */ 900: '#001931' },
    success: { /* ... */ },
    info: { /* ... */ },
    warn: { /* ... */ },
    danger: { /* ... */ },
    surface: { /* ... */ }
};

/** Converte a paleta em CSS custom properties e injeta no documento. */
export const applyMaxTheme = (root: HTMLElement = document.documentElement) => {
    Object.entries(MaxStyle).forEach(([palette, shades]) => {
        Object.entries(shades).forEach(([shade, color]) => {
            root.style.setProperty(`--p-${palette}-${shade}`, color as string);
            root.style.setProperty(`--max-${palette}-${shade}`, color as string);
        });
    });
};
```

Mais os tokens de componente num arquivo SCSS/CSS estático
(`src/styles/max-theme.scss`), importado pelo `src/index.ts` — assim eles entram no
bundle CSS injetado.

### Passo 4 — Compatibilidade de nomes

⚠️ Apps consumidoras e o SCSS deste repositório usam **três** convenções:

- `--p-*` (do PrimeVue)
- `--max-*` (ex.: `--max-primary-500`, `--max-button-primary-border-color`)
- variáveis do tema Max sem prefixo (`--background-300`, `--blue-600`) — vindas de
  `src/themes/`

**Emita todas as três.** Uma variável a mais custa bytes; uma a menos quebra estilo em
produção sem erro no console.

```bash
grep -rhn -o -- "--[a-z-]*" src/ --include="*.vue" --include="*.scss" | sort -u
```

Use essa lista para conferir que nenhuma variável referenciada ficou sem definição.

---

## 3. `src/themes/`

O diretório `src/themes/` é copiado literalmente para `dist/themes/` no build
(`cp -r src/themes dist/`). Verifique se seus arquivos dependem do Aura — se sim, eles
também precisam ser ajustados.

---

## 4. Verificação (visual, não unitária)

Não há teste unitário para tema. O protocolo é comparação visual:

1. **Antes de remover o PrimeVue**, rode o playground e capture screenshots de cada
   componente migrado (botões em todas as severidades × variantes, inputs em todos os
   estados, select aberto, tabela, badge, avatar, datepicker aberto);
2. Salve em `prime_vue_migration/screenshots-antes/`;
3. Após a migração, capture as mesmas telas em `screenshots-depois/`;
4. Compare par a par e registre as diferenças em `notas`.

Cheque especificamente:
- [ ] cores de todas as severidades de botão (primary, secondary, success, info, warn, help, danger, contrast);
- [ ] variantes outlined / text / link / raised / rounded;
- [ ] estados hover / focus / active / disabled;
- [ ] bordas e `border-radius` dos inputs;
- [ ] estado de foco visível em todos os controles;
- [ ] painel do select e do datepicker (sombra, fundo, item ativo);
- [ ] tabela (zebra, hover de linha, cabeçalho);
- [ ] **modo escuro**, se a lib o suportar.

---

## 5. Checklist de conclusão

- [ ] `captura-tema-aura.css` gerado e commitado **antes** da remoção
- [ ] `grep -n "@primeuix" src/styles/style.ts` → vazio
- [ ] Todas as três convenções de variável (`--p-*`, `--max-*`, sem prefixo) emitidas
- [ ] Lista de variáveis referenciadas conferida contra as definidas
- [ ] `src/themes/` verificado
- [ ] Screenshots antes/depois comparados; diferenças registradas em `notas`
- [ ] `npm run build` funciona e o CSS é injetado corretamente
