# Mock global de `getComputedStyle` substitui a implementação real e devolve objeto incompleto

- **Categoria:** falha
- **Severidade:** alta
- **Arquivo(s):** `tests/setup.ts:28-47`
- **Domínio:** build-config

## Problema

O setup substitui `getComputedStyle` globalmente por uma função que devolve um objeto com
apenas **quatro** chaves:

```ts
Object.defineProperty(globalThis, 'getComputedStyle', {
    value: vi.fn((element?: HTMLElement) => ({
        display: element?.style?.display || '',
        visibility: element?.style?.visibility || '',
        opacity: element?.style?.opacity || '',
        getPropertyValue: vi.fn((prop: string) => { /* 6 variáveis CSS fixas */ })
    }))
});
```

Três problemas, em ordem de gravidade:

1. **A implementação real do happy-dom é destruída, não estendida.** Qualquer código de
   produção ou de biblioteca que leia uma propriedade fora dessas quatro recebe `undefined`
   em vez de um valor CSS. Isso inclui leituras comuníssimas em componentes de UI:
   `width`, `height`, `position`, `overflow`, `zIndex`, `fontSize`, `transform`. Os
   componentes de posicionamento (`MaxPopover`, `MaxModal`, tooltip) são candidatos naturais
   a esse tipo de leitura, e no teste eles operam sobre `undefined` — passando ou falhando
   por razões que nada têm a ver com o comportamento real no browser.

2. **`getPropertyValue` só conhece 6 variáveis CSS.** A allowlist é
   `--blue-500`, `--red-500`, `--green-500`, `--orange-600`, `--background-0`, `--gray-300`.
   O tema Max (`src/themes/colors.scss`, 59 KB) define centenas. Qualquer outra retorna
   string vazia. Há um `console.warn` avisando (`tests/setup.ts:42`), o que é bom, mas o
   aviso não falha o teste — ele se perde no ruído da saída, e um teste que dependa de
   `getColorFromVar('--emerald-500')` verifica silenciosamente o comportamento de "cor
   ausente" achando que está verificando o de "cor presente".

3. **A assinatura diverge da real.** `getComputedStyle` retorna um `CSSStyleDeclaration`,
   que além das propriedades tem `length`, indexação numérica, `item()`, `getPropertyPriority()`
   e `cssText`. O objeto-literal do mock não tem nada disso, então qualquer iteração sobre o
   resultado quebra.

O mock do `indexedDB` logo abaixo (`tests/setup.ts:61-83`) é um bom contraexemplo de como
lidar com isso: ele documenta explicitamente a limitação num comentário extenso e instrui os
testes a criarem mocks locais mais completos quando precisarem. O `getComputedStyle` merece
o mesmo cuidado — ou, melhor, a correção abaixo.

## Impacto

- Testes de componentes que dependem de estilo computado exercitam um ambiente que não
  corresponde ao browser, produzindo tanto falsos positivos (passa no teste, quebra em
  produção) quanto falsos negativos.
- A cobertura reportada superestima a confiança real nesses caminhos de código.
- Adicionar uma cor nova ao tema exige lembrar de atualizar o mock, um acoplamento invisível.

## Plano de correção

1. **Estender em vez de substituir.** Preservar a implementação do happy-dom e sobrepor
   apenas o `getPropertyValue` para as variáveis CSS:

   ```ts
   const realGetComputedStyle = globalThis.getComputedStyle;

   Object.defineProperty(globalThis, 'getComputedStyle', {
       configurable: true,
       value: vi.fn((element: HTMLElement, pseudo?: string) => {
           const real = realGetComputedStyle(element, pseudo);
           return new Proxy(real, {
               get(target, prop) {
                   if (prop === 'getPropertyValue') {
                       return (name: string) => cssVars[name] ?? target.getPropertyValue(name);
                   }
                   return Reflect.get(target, prop);
               }
           });
       })
   });
   ```

   Assim `display`/`visibility`/`opacity` — e todas as demais propriedades — passam a vir da
   implementação real, e só as variáveis CSS do tema são injetadas.

2. **Carregar as variáveis do tema de verdade**, em vez de manter uma lista de 6 à mão.
   Como o `sass` já é dependência e o preset (`src/presetMaxUno.ts:113`) já compila
   `src/themes/all.scss`, dá para compilar o mesmo SCSS uma vez no setup e extrair os pares
   `--token: valor`, eliminando o desvio entre mock e tema.

3. Se a lista manual for mantida por simplicidade, promover o `console.warn` a falha de
   teste (lançar erro), para que a lacuna seja detectada em vez de ignorada.

## Verificação

- Rodar a suíte completa após a mudança e investigar **cada** teste que passar a falhar —
  cada um representa um caso que estava sendo validado contra um ambiente irreal.
- Adicionar um teste que leia uma propriedade fora das quatro atuais (ex.:
  `getComputedStyle(el).position`) e confirme que ela reflete o CSS aplicado, em vez de
  `undefined`.
- Confirmar que `getPropertyValue('--emerald-500')` (fora da allowlist atual) devolve o valor
  real do tema ou falha explicitamente, e não string vazia silenciosa.
