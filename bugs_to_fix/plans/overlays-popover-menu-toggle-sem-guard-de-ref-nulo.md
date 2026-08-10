# MaxPopoverMenu e MaxUserSection: `toggle()` acessa `menu.value.toggle` sem guard — lança se chamado antes do mount

- **Categoria:** bug
- **Severidade:** baixa
- **Arquivo(s):** `src/components/MaxPopoverMenu.vue:72-76`, `src/components/MaxUserSection.vue:96`, `src/components/MaxUserSection.vue:137-139`
- **Domínio:** overlays-navegacao

## Problema

Ambos os componentes fazem:

`src/components/MaxPopoverMenu.vue:72-76`
```
const menu = ref();

const toggle = (event?: any) => {
    menu.value.toggle(event);
};
```

`src/components/MaxUserSection.vue:96,137-139`
```
const menu = ref();
...
const toggle = (event: any) => {
    menu.value.toggle(event);
};
```

`menu` é um `ref()` sem valor inicial e sem tipo. `menu.value` é `undefined` até o `Menu`/`TieredMenu` do PrimeVue montar. Não há optional chaining nem guard.

Caminhos em que `toggle` pode ser chamado com `menu.value` indefinido:

- No `MaxUserSection`, o `toggle` está ligado ao clique da **raiz inteira** do componente (`@click.stop="toggle"`, linha 2). Se o `MaxUserAvatar` interno for condicionalmente ocultado (`v-if="props.userId"`, linha 13) o `TieredMenu` continua montado, então o caso normal está coberto — mas um clique disparado programaticamente durante a montagem (ou em um teste que dispare `trigger('click')` antes do `nextTick`) lança `TypeError: Cannot read properties of undefined (reading 'toggle')`.
- No `MaxPopoverMenu`, `toggle` é chamado do template (linha 3) e o `Menu` está no mesmo template, então o caso normal também está coberto. Porém o `toggle` **não é exposto** via `defineExpose` — o teste `tests/components/MaxPopoverMenu.test.ts:44` ("expõe e chama método toggle") acessa o método pelo `vm`, o que funciona no Vue Test Utils mas não é uma API pública garantida.

Adicionalmente, `menu = ref()` sem argumento de tipo é implicitamente `Ref<any>`, então nem o compilador nem o editor avisam que `.toggle` pode não existir — parte do problema descrito em `overlays-tipos-any-em-componentes-de-navegacao.md`.

## Impacto

Baixo em uso normal, mas é uma exceção não tratada em um caminho de interação do usuário. Em testes e em cenários de renderização assíncrona (`<Suspense>`, componentes carregados sob demanda), o erro é real e derruba o handler de clique.

## Plano de correção

1. Adicionar optional chaining nos dois arquivos:
   - `MaxPopoverMenu.vue:75` → `menu.value?.toggle(event);`
   - `MaxUserSection.vue:138` → `menu.value?.toggle(event);`
2. Tipar os refs, evitando `Ref<any>`:
   ```
   const menu = ref<{ toggle: (event?: Event) => void } | null>(null);
   ```
3. Tipar o parâmetro `event` como `Event` em vez de `any` nos dois `toggle`.
4. Em `MaxPopoverMenu`, adicionar `defineExpose({ toggle })` para tornar a API imperativa explícita, já que há teste dependendo dela.

## Verificação

- Teste em `tests/components/MaxPopoverMenu.test.ts`: chamar `wrapper.vm.toggle()` com o ref forçado a `null` (`wrapper.vm.menu = null`) e afirmar que nenhum erro é lançado.
- Teste em `tests/components/MaxUserSection.test.ts`: disparar `click` na raiz imediatamente após `mount`, sem `await nextTick()`, e afirmar que nenhuma exceção sobe.
- `npm run type-check`
- `npx vitest run tests/components/MaxPopoverMenu.test.ts tests/components/MaxUserSection.test.ts`
