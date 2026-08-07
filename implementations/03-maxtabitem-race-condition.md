# 03 — `MaxTabItem`: identidade dos tabs por `setTimeout` gera race condition e ignora a prop `value`

- **Severidade:** Crítico
- **Tipo:** Bug / design frágil
- **Arquivo:** [src/components/MaxTabItem.vue](../src/components/MaxTabItem.vue)
- **Estado:** alteração **não commitada** no working tree

## Descrição

`MaxTabItem` determina sua própria identidade dentro de dois `setTimeout`
aninhados no `onMounted` ([MaxTabItem.vue:37-47](../src/components/MaxTabItem.vue#L37-L47)):

```ts
onMounted(() => {
    is_mounted.value = true;

    setTimeout(() => {
        if (! tab_id.value) tab_id.value = tabs_info.add_count_tabs();
    }, 0);
    setTimeout(() => {
        if (toValue(tabs_info?.active_tab) == 0 || toValue(tabs_info?.active_tab) === '' || toValue(tabs_info?.active_tab) === undefined) tabs_info?.selectTab(tab_id.value);
    }, 10);
});
```

Há vários problemas independentes nesse bloco.

### 3.1 A prop `value` é declarada mas nunca usada

A interface declara `value?: string | number`
([MaxTabItem.vue:18-23](../src/components/MaxTabItem.vue#L18-L23)), mas `tab_id` é
sempre atribuído pelo contador global `add_count_tabs()`. Um consumidor que
escreva `<MaxTabItem value="config">` tem sua intenção **silenciosamente
ignorada** — o tab recebe `1`, `2`, `3`… conforme a ordem de montagem.

Isso quebra o contrato de `v-model:value` do pai: o valor persistido/emitido
nunca corresponde ao valor que o consumidor declarou.

### 3.2 Identidade posicional torna o estado instável

Como o ID é um contador de ordem de montagem, ele **muda** quando:
- um tab é renderizado condicionalmente com `v-if`;
- a lista de tabs vem de um `v-for` sobre dados assíncronos;
- a ordem dos tabs muda.

O tab "Configurações" pode ser `3` numa renderização e `2` na seguinte. Combinado
com o cache do achado 04, isso faz o usuário retornar a uma aba diferente da que
havia deixado aberta.

### 3.3 O contador nunca é decrementado

`add_count_tabs()` apenas incrementa
([MaxTabs.vue:46-49](../src/components/MaxTabs.vue#L46-L49)). Não há
`onUnmounted` que reverta o registro. Num cenário com `v-if`, montar e desmontar
tabs repetidamente faz o contador crescer indefinidamente, gerando IDs que já não
correspondem a nenhuma posição real.

### 3.4 Race condition entre os dois timers

O segundo timer (10ms) assume que todos os primeiros timers (0ms) de todos os
irmãos já executaram. Isso é uma aposta sobre o event loop, não uma garantia:
sob carga, com muitos tabs, ou com renderização assíncrona (Suspense, componentes
async), a ordem pode inverter e `selectTab(tab_id.value)` ser chamado com
`tab_id.value === null`.

Além disso, **todos** os `MaxTabItem` executam o segundo timer. Se nenhum tab
estiver ativo, cada um tenta se autosselecionar — o último a executar vence, o que
significa que a aba inicial é o **último** tab montado, não o primeiro.

### 3.5 `console.log` de depuração e watcher inerte

```ts
watch(() => tabs_info?.active_tab, () => console.log('ACTIVE: ', tabs_info.active_tab));
```

O watcher observa `tabs_info?.active_tab` — que é um **objeto ref estável**, não
seu valor. A fonte nunca muda de identidade, então o callback jamais dispara.
O watcher é inerte, e seu único efeito pretendido era um `console.log` que não
deveria existir em código de biblioteca (ver achado 06).

### 3.6 Comparação de ativação por coerção de string

```ts
const is_active = computed(() => String(toValue(tabs_info?.active_tab)) === String(toValue(tab_id)));
```

Com ambos os lados `null`/`undefined`, `String(undefined) === String(undefined)`
resulta em `true` — vários tabs podem se considerar ativos simultaneamente
durante a janela antes dos timers resolverem.

### 3.7 `MaxIcon` usado sem import

O template usa `<max-icon>` ([MaxTabItem.vue:4](../src/components/MaxTabItem.vue#L4))
mas o import está comentado ([MaxTabItem.vue:15](../src/components/MaxTabItem.vue#L15)):

```ts
// import MaxIcon from './MaxIcon.vue';
```

Isso só funciona se a app consumidora tiver o auto-import global configurado.
Numa app sem o resolver, o componente falha ou renderiza um elemento desconhecido.
**Bibliotecas não devem depender da configuração de auto-import do consumidor** —
o import explícito é obrigatório.

### 3.8 Imports não utilizados

`Random` e `watchOnce` são importados e nunca usados
([MaxTabItem.vue:16](../src/components/MaxTabItem.vue#L16)) — confirmado pelo ESLint.
Isso arrasta `@maxvue/max-use` para o grafo de dependências sem necessidade.

## Correção recomendada

Substituir a identidade posicional por identidade declarativa e o `setTimeout`
por registro síncrono:

```ts
const props = withDefaults(defineProps<Props>(), {});

// Identidade estável: o value do consumidor tem prioridade; fallback gerado uma vez.
const tab_id = computed(() => props.value ?? fallback_id);
const fallback_id = Random();

onMounted(() => {
    is_mounted.value = true;
    tabs_info.registerTab(tab_id.value);
});

onUnmounted(() => {
    tabs_info.unregisterTab(tab_id.value);
});
```

E no `MaxTabs`, eleger a aba inicial de forma determinística (primeiro tab
registrado) em vez de deixar cada filho tentar se autosselecionar.

Adicionalmente:
- Restaurar `import MaxIcon from './MaxIcon.vue';`
- Remover `Random`/`watchOnce` não usados, o `console.log` e o watcher inerte.
- Comparar `is_active` sem coerção de string, tratando `null`/`undefined` explicitamente.
