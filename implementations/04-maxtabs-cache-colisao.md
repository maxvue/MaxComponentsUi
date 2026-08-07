# 04 — `MaxTabs`: cache de aba ativa colide entre instâncias e `tabs_id` gera IDs de DOM instáveis

- **Severidade:** Crítico
- **Tipo:** Bug / divergência de regra de negócio
- **Arquivo:** [src/components/MaxTabs.vue](../src/components/MaxTabs.vue)
- **Estado:** alteração **não commitada** no working tree

## 4.1 Colisão de chave de cache quando `id` não é informado

```ts
const active_tab_cached = useRefCached<string | number>('max-tab-opened-' + (props.id ?? ''), 'no-cached');
```
([MaxTabs.vue:23](../src/components/MaxTabs.vue#L23))

Quando `props.id` é `undefined`, a chave vira a string literal
`'max-tab-opened-'` — **idêntica para toda instância sem `id`**. Todos os
`MaxTabs` sem `id` da aplicação compartilham a mesma entrada de `localStorage`.

O dano é contido apenas porque as escritas são guardadas por `isValid(props.id)`
([MaxTabs.vue:29](../src/components/MaxTabs.vue#L29) e
[:34](../src/components/MaxTabs.vue#L34)) — ou seja, a chave é construída e o
recurso de cache é instanciado mesmo quando será sempre ignorado. É trabalho
desperdiçado com uma armadilha embutida: qualquer refatoração que relaxe essa
guarda transforma o problema latente em corrupção de estado cruzada entre telas.

**Correção:** não instanciar o cache quando não há `id`, ou derivar uma chave
garantidamente única.

## 4.2 `tabs_id` como `computed` com `Random()` — ID de DOM instável

```ts
const tabs_id = computed(() => props.id ?? Random());
```
([MaxTabs.vue:37](../src/components/MaxTabs.vue#L37))

`Random()` dentro de um `computed` é um **efeito colateral não determinístico numa
função que deveria ser pura**. O valor é usado como `id` de elemento DOM
([MaxTabs.vue:3](../src/components/MaxTabs.vue#L3)) e como alvo do `teleport` em
`MaxTabItem` ([MaxTabItem.vue:2](../src/components/MaxTabItem.vue#L2)).

Consequência: toda vez que o cache do computed for invalidado, um **novo ID
aleatório** é gerado. O container de headers passa a ter um `id` diferente
daquele que os `teleport` dos filhos estão mirando, e **os headers das abas
desaparecem** — o `teleport` aponta para um seletor que não existe mais.

**Correção:** o ID deve ser estável por instância:

```ts
const fallback_id = Random();
const tabs_id = computed(() => props.id ?? fallback_id);
```

## 4.3 Cache pode restaurar uma aba que não existe mais

O watcher restaura o valor cacheado sem validar se ele corresponde a algum tab
registrado ([MaxTabs.vue:27-30](../src/components/MaxTabs.vue#L27-L30)):

```ts
watch(active_tab_cached, () => {
    if (active_tab.value === active_tab_cached.value) return;
    if (isValid(props.id) && props.cached && isValid(active_tab_cached.value)) active_tab.value = active_tab_cached.value;
}, { immediate: true });
```

Combinado com a identidade posicional do achado 03, o cenário real é:

1. Usuário abre a 4ª aba de um `MaxTabs` com `id="relatorios"`. Cache grava `4`.
2. Numa versão seguinte da aplicação (ou por permissão de usuário), o componente
   passa a renderizar apenas 3 abas.
3. O cache restaura `4`. Nenhum `MaxTabItem` tem `tab_id === 4`.
4. **Nenhuma aba fica ativa** — a interface abre com todo o conteúdo vazio, sem
   nenhum caminho de recuperação pela UI, e o estado inválido continua persistido
   no `localStorage` entre sessões.

A implementação anterior tratava explicitamente esse caso: o campo
`has_registered_active_tab` do contexto existia justamente para detectar "value
órfão" e acionar um fallback ([tabsContext.ts:19-27](../src/helpers/tabsContext.ts#L19-L27)).
Essa proteção foi perdida.

**Correção:** validar o valor restaurado contra os tabs registrados e cair para o
primeiro tab válido quando órfão; limpar a entrada de cache inválida.

## 4.4 `console.log` em `selectTab`

```ts
function selectTab(id: string | number) {
    console.log('changed', id);
    active_tab.value = id;
}
```
([MaxTabs.vue:39-42](../src/components/MaxTabs.vue#L39-L42))

Detalhado no achado 06.

## 4.5 Props `title` e `icon` declaradas mas nunca usadas

```ts
const props = withDefaults(defineProps<Props>(), { title: '', icon: 'x', cached: true });
```

`title` e `icon` não aparecem em nenhum lugar do template nem do script. São
props mortas na API pública — e o default `icon: 'x'` sugere um placeholder que
ficou para trás.

**Correção:** remover as props ou implementá-las.

## 4.6 Perda de documentação TSDoc

A implementação anterior documentava cada prop com TSDoc, conforme exige o
`CLAUDE.md` do projeto ("documentando cada prop com TSDoc"). A nova interface
`Props` não tem nenhum comentário. Isso degrada o autocomplete e a documentação
gerada para os consumidores.
