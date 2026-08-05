# Plano 37 — `src/index.ts` (plugin `install`) — ÚLTIMO ITEM

| | |
|---|---|
| **id** | 37 |
| **Arquivos** | `src/index.ts`, `package.json` |
| **Primitivas eliminadas** | `primevue/config`, `primevue/tooltip` |
| **Depende de** | 5 (`vTooltip`), 35 (`MaxStyle`), 36 (`prime/index.ts`) |

Este é o **fecho da migração**. Só execute quando todos os demais itens estiverem
`Concluído` — é aqui que a dependência sai do `package.json`.

---

## 1. Estado atual

```ts
import PrimeVue from 'primevue/config';        // linha 4
import Tooltip from 'primevue/tooltip';        // linha 125

export const install = (app: App) => {
    app.use(PrimeVue, {                        // linha 133
        theme: { preset: MaxStyle, options: { /* ... */ } },
        locale: /* pt-BR */
    });
    app.directive('tooltip', Tooltip);         // linha 147
    // ... registro dos componentes Max
};
```

**Leia as linhas 125–160 inteiras antes de mudar** — a config do `app.use(PrimeVue, …)`
provavelmente carrega o **locale pt-BR** e opções de `darkModeSelector` / `cssLayer`
que precisam de destino novo.

---

## 2. As mudanças

### 2.1 Tooltip

```diff
- import Tooltip from 'primevue/tooltip';
+ import Tooltip from './directives/tooltip';
```

A linha `app.directive('tooltip', Tooltip)` **não muda**.

### 2.2 Config do PrimeVue

```diff
- import PrimeVue from 'primevue/config';
+ import { applyMaxTheme } from './styles/style';
```

```diff
- app.use(PrimeVue, { theme: { preset: MaxStyle, options: {...} }, locale: ptBR });
+ applyMaxTheme();
```

### 2.3 Locale pt-BR — não perca

Se a config do PrimeVue carregava o locale, ele alimentava o `DatePicker` (nomes de
meses/dias) e mensagens padrão. Após remover a config, **esses consumidores ficam órfãos**.

Verifique:

```bash
ls src/locales/
grep -rn "locale" src/index.ts
```

Exponha o locale de outra forma — por exemplo, via `provide`/`inject` ou um módulo
importado diretamente pelo `MaxInputDatePicker`. O [plano 28](28-MaxInputDatePicker.md)
já prevê usar `Intl` diretamente, o que torna o locale do PrimeVue dispensável — confirme
que foi essa a rota escolhida.

### 2.4 Modo escuro

Se a config tinha `darkModeSelector` (ex.: `'.dark'`), o `applyMaxTheme` (ou o SCSS do
tema) precisa reproduzir esse comportamento. Verifique se a lib suporta modo escuro
**antes** de remover — se suportar e você não replicar, o modo escuro morre silenciosamente.

---

## 3. `package.json` — a remoção final

```bash
# Confirme que NADA em src/ referencia PrimeVue (as 3 origens)
grep -rn "primevue\|@primeuix\|@primevue" src/ --include='*.vue' --include='*.ts'
# Deve retornar VAZIO. Se não retornar, PARE — algum item ficou incompleto.
```

Só então:

```bash
npm uninstall primevue @primeuix/themes @primevue/auto-import-resolver
npm run build
npm run test
```

> `@primevue/auto-import-resolver` é tratado no [plano 38](38-MaxComponentsUiResolver.md).
> Se aquele item ficou na opção B (peer opcional), **não o desinstale aqui**.

> Se o **id 36** ficou na Opção B (peer dependency opcional), **não desinstale** —
> mova para `peerDependencies` com `"peerDependenciesMeta": { "primevue": { "optional": true } }`.
> Registre em `notas` qual caminho foi seguido.

### Descrição do pacote

```diff
- "description": "Biblioteca de componentes Vue baseada em PrimeVue",
+ "description": "Biblioteca de componentes Vue",
```

---

## 4. Auditoria final

```bash
# 1. Critério de saída da migração
grep -rn "primevue\|@primeuix" src/ --include='*.vue' --include='*.ts'   # VAZIO

# 2. Nem sombra no bundle
npm run build && grep -rn "primevue" dist/ | head                        # VAZIO

# 3. Suíte completa
npm run test

# 4. Tipos e lint
npm run type-check && npm run lint

# 5. Playground sobe e funciona
npm run dev:playground
```

### Verificação manual no playground (obrigatória)

- [ ] todos os inputs renderizam e aceitam entrada;
- [ ] tooltips aparecem nas 4 posições;
- [ ] select abre, filtra e seleciona;
- [ ] datepicker abre e seleciona data;
- [ ] tabela renderiza, ordena e pagina;
- [ ] botões em todas as severidades e variantes;
- [ ] modo escuro (se suportado);
- [ ] nenhum erro ou aviso no console.

---

## 5. Documentação a atualizar

- [ ] `README.md` — remover instruções de instalação do PrimeVue
- [ ] `CLAUDE.md` — a seção "Migração em andamento" descreve o processo **antigo**
      (`migration_executor.md`, `status-primevue.migration.yaml`), que foi substituído por
      `prime_vue_migration/`. Atualize-a para refletir a conclusão.
- [ ] `COMPONENTS.md` — remover referências ao PrimeVue
- [ ] `CONTRIBUTING.md` — idem
- [ ] Bump de versão: **major** se o id 36 foi a Opção A (breaking); **minor** caso contrário

---

## 6. Checklist de conclusão

- [ ] `grep` do critério de saída retorna vazio
- [ ] `dist/` sem referências a PrimeVue
- [ ] Locale pt-BR com destino novo (não perdido)
- [ ] Modo escuro preservado (ou ausência confirmada)
- [ ] Deps removidas (ou movidas para peer opcional, conforme id 36)
- [ ] `build`, `test`, `type-check`, `lint` passam
- [ ] Checklist manual do playground completo
- [ ] Documentação atualizada
- [ ] Relatório final ao usuário (execution.md §7)
