# Pinia é criado uma vez no setup e compartilhado por todos os testes do mesmo arquivo

- **Categoria:** falha
- **Severidade:** média
- **Arquivo(s):** `tests/setup.ts:89-92`, `tests/setup.ts:7`
- **Domínio:** build-config

## Problema

O setup global cria **uma única** instância de Pinia, no momento em que o módulo é
carregado, e a registra como plugin global do Vue Test Utils:

```ts
config.global.plugins = [
    createPinia(),
    [PrimeVue, { ripple: false }]
];
```

`createPinia()` roda uma vez por avaliação do `setup.ts` — ou seja, uma vez por **arquivo**
de teste, não por teste. Todos os `it()` de um mesmo arquivo compartilham a mesma instância
e, portanto, o mesmo estado de store.

Comprovado experimentalmente. Dois testes no mesmo arquivo, montando o mesmo componente que
lê o `useModalStore`:

```
it('t1 polui')     -> chama store.show('probe-id')
it('t2 ve estado') -> monta de novo e lê show_id
                      Received: "v=probe-id"     <-- estado do t1 vazou
```

O `show_id` deveria ser `null` numa montagem nova, e vem `probe-id`.

**Escopo real do vazamento — correção de um diagnóstico comum:** o vazamento **não**
atravessa arquivos de teste. Verifiquei o cenário entre arquivos (poluir em `a.test.ts`, ler
em `b.test.ts`) e o resultado foi `v=null`: o Vitest reavalia o `setup.ts` e o registro de
módulos para cada arquivo, então cada arquivo recebe um Pinia próprio. Isso vale mesmo com
`pool: 'forks'` + `singleFork: true` (`vitest.config.ts:31-32`), que compartilham o
*processo*, não o registro de módulos. Portanto o problema é de isolamento **intra-arquivo**,
e a severidade é média — não alta.

Um segundo ponto, relacionado: `setActivePinia()` nunca é chamado no setup. Consequência
prática é que as stores só são acessíveis a partir de um componente montado — chamar
`useModalStore()` diretamente num teste, sem `mount()`, falha com
`"getActivePinia()" was called but there was no active Pinia`. Testes de store precisam
instanciar Pinia por conta própria, e o setup global não ajuda nesse caso de uso.

O projeto já tem a ferramenta adequada instalada e não usada: `@pinia/testing`
(`package.json:78`), que fornece `createTestingPinia()`.

## Impacto

- Testes do mesmo arquivo dependem da ordem de execução; um `it()` que assume estado inicial
  limpo pode estar validando estado herdado do anterior.
- Afeta as stores da lib com estado persistente entre chamadas: `useModalStore` (`show_id`),
  `useToastStore` (fila), `usePopoverStore`, `useConfirmStore`, `useIconStore` (cache).
- Testes de store puros são desnecessariamente trabalhosos por falta de `setActivePinia`.

## Plano de correção

1. Trocar a instância única por uma criada antes de cada teste, diretamente no setup:

   ```ts
   import { beforeEach } from 'vitest';
   import { setActivePinia, createPinia } from 'pinia';

   beforeEach(() => {
       const pinia = createPinia();
       setActivePinia(pinia);
       config.global.plugins = [pinia, [PrimeVue, { ripple: false }]];
   });
   ```

   Isso resolve os dois pontos de uma vez: isola o estado por teste e torna as stores
   utilizáveis fora de componentes montados.

2. Para testes que precisem espionar ou pré-carregar ações, usar `createTestingPinia()` do
   `@pinia/testing` localmente no arquivo.

3. Revisar os testes de store existentes que hoje criam Pinia manualmente — vários podem ser
   simplificados após a mudança.

## Verificação

- Reproduzir a sonda acima (dois `it()` no mesmo arquivo, um poluindo e outro lendo) e
  confirmar que o segundo passa a ver `v=null`.
- Rodar a suíte completa e investigar cada teste que passar a falhar: cada um dependia de
  estado vazado dentro do próprio arquivo.
- `npx vitest run --sequence.shuffle` verde em execuções repetidas.
- Confirmar que `useModalStore()` chamado sem `mount()` passa a funcionar.
