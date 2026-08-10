# `sanitizeSvg()`: a regex de defesa em profundidade descarta SVGs legítimos (falso positivo)

- **Categoria:** falha
- **Severidade:** média
- **Arquivo(s):** `src/helpers/sanitizeSvg.ts:7`, `:27`
- **Domínio:** helpers-composables

## Problema

Após a sanitização pelo DOMPurify, uma segunda checagem descarta o resultado inteiro:

```ts
// src/helpers/sanitizeSvg.ts:7
const DANGEROUS_CONTENT_REGEX = /<script|\son\w+\s*=/i;
// :27
if (DANGEROUS_CONTENT_REGEX.test(sanitized)) return '';
```

A intenção (documentada nas linhas 3-6) é correta: defesa em profundidade barata sobre a saída do DOMPurify. O problema é que o segundo padrão, `\son\w+\s*=`, casa **qualquer atributo cujo nome comece com `on`** — não apenas handlers de evento. Atributos SVG/SMIL legítimos que a allowlist do DOMPurify (`USE_PROFILES: { svg: true, svgFilters: true }`, linhas 23-25) preserva e que casam com o padrão:

- `onload` — sim, é handler, e o DOMPurify remove; mas
- `opacity`? não casa (`\so` seguido de `n` é exigido).
- O caso real: **`offset=`** não casa (`of`, não `on`). Já **`onset`**, e sobretudo qualquer atributo customizado ou de namespace começando por `on`, casa.

Mais relevante na prática: o padrão também casa dentro de **conteúdo de texto**. Um SVG com `<text> on = ligado</text>` — ou qualquer legenda em inglês contendo `on =` — dispara o descarte total, mesmo tendo passado pelo DOMPurify sem nenhuma remoção. O mesmo vale para `<title>`, `<desc>` e valores de atributo como `aria-label=" on = x"`.

E o primeiro padrão, `<script`, casa dentro de texto e de comentários preservados: um SVG contendo a string literal `<script` escapada como `&lt;script` **não** casa (correto), mas um `<desc>Exemplo de &lt;script&gt;</desc>` decodificado pelo DOMPurify na saída pode reintroduzir a sequência.

O teste `'descarta o conteúdo inteiro se um <script> sobreviver (defesa em profundidade)'` (`tests/helpers/sanitizeSvg.test.ts:61`) cobre o verdadeiro-positivo. Nenhum teste cobre falso-positivo.

## Impacto

Ícones legítimos desaparecem da interface sem erro nem log — `sanitizeSvg` devolve `''`, e o consumidor (a store de ícones, `useIconStore`) trata como ausência de ícone. O sintoma é "o ícone não carrega", com a causa a três camadas de distância. Como a função é aplicada a SVGs vindos do Iconify por fetch, o conjunto de ícones afetados não é previsível a partir do código.

## Plano de correção

1. Restringir a checagem à **estrutura**, não à string: parsear o resultado sanitizado (`DOMParser`) e inspecionar atributos reais dos elementos, em vez de aplicar regex ao markup bruto.
2. Se a regex for mantida por custo, ao menos ancorar o padrão de handler à posição de atributo real e restringi-lo à lista conhecida de eventos DOM (`onload|onerror|onclick|onmouseover|onbegin|onend|onrepeat|...`), em vez de `on\w+`.
3. Registrar um `console.warn` quando o descarte por defesa em profundidade ocorrer — hoje o retorno `''` é silencioso, o que torna o falso-positivo praticamente indiagnosticável.
4. Confirmar que o DOMPurify já cobre os casos que a regex tenta pegar; se cobrir integralmente, avaliar remover a segunda checagem em favor da configuração explícita `FORBID_ATTR`.

## Verificação

- Testes a criar/ajustar: `tests/helpers/sanitizeSvg.test.ts` — adicionar falsos-positivos: SVG com `<text>status on = true</text>`; SVG com `<desc>` contendo a palavra `script`; assertar que **não** são descartados. Manter os 6 casos atuais passando.
- Comandos: `npx vitest run tests/helpers/sanitizeSvg.test.ts`, `npm run type-check`, `npm run lint`
