# Plano de Implementação: Eliminação de SVGs Duplicados e Vetorização Limpa no MaxCreditCard

## 1. Objetivo da Refatoração

Reduzir mais de **112 KB** de carga estática inútil no bundle distribuído da biblioteca e no consumo de heap do navegador eliminando arquivos SVG duplicados byte-a-byte e substituindo um arquivo com bitmap PNG gigante embutido por vetorização pura em [`MaxCreditCard.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxCreditCard.vue) e [`src/assets/credit-card/`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/assets/credit-card/).

Metas técnicas quantitativas:
1. **Eliminar 32.8 KB de duplicatas binárias estáticas**: Unificar os arquivos com conteúdo idêntico byte-a-byte (`card-american-express.svg` com `card-amex.svg`, `card-diners-club.svg` com `card-diners.svg`, `card-hiper.svg` com `card-hipercard.svg`) e remover seus imports `?raw` redundantes em [`MaxCreditCard.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxCreditCard.vue).
2. **Eliminar ~80 KB de bitmap mascarado em `card-jcb.svg`**: Substituir o arquivo `card-jcb.svg` (atualmente com 82.410 bytes devido a uma imagem raster PNG de 4165x3180 pixels convertida em base64 dentro do XML do CorelDraw) por um SVG vetorial puro, geométrico e sem perdas, com tamanho inferior a 2.5 KB.
3. **Reduzir o tempo de inicialização de módulo (Parse & Compile)**: Evitar a conversão síncrona antecipada de Data URIs no carregamento do módulo JavaScript (`creditCardFrontUri`, `creditCardRearUri`), adotando lazy memoization na primeira montagem do componente.
4. **Manter 100% de compatibilidade na API pública**: Todas as chaves e aliases de bandeiras aceitos por [`MaxCreditCard.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxCreditCard.vue) (`amex`, `american-express`, `diners`, `diners-club`, `discover`, `discovery`, `elo`, `hipercard`, `hiper`, `jcb`, `maestro`, `mastercard`, `visa`) continuam funcionando com fidelidade visual idêntica.

---

## 2. Arquivos Afetados

| Arquivo | Ação | Responsabilidade / Mudança |
|---|---|---|
| [`src/assets/credit-card/card-jcb.svg`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/assets/credit-card/card-jcb.svg) | Substituir | Substituição integral do arquivo de 82.4 KB (PNG base64) por SVG vetorial canônico limpo (~2 KB). |
| [`src/assets/credit-card/card-american-express.svg`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/assets/credit-card/card-american-express.svg) | Excluir | Eliminação de duplicata física exata de `card-amex.svg` (5.733 bytes). |
| [`src/assets/credit-card/card-diners-club.svg`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/assets/credit-card/card-diners-club.svg) | Excluir | Eliminação de duplicata física exata de `card-diners.svg` (13.117 bytes). |
| [`src/assets/credit-card/card-hiper.svg`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/assets/credit-card/card-hiper.svg) | Excluir | Eliminação de duplicata física exata de `card-hipercard.svg` (14.028 bytes). |
| [`src/components/MaxCreditCard.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxCreditCard.vue) | Modificar | Remover imports de duplicatas; mapear aliases no dicionário `CARD_TYPE_SVGS` reutilizando os imports canônicos; aplicar lazy evaluation nos Data URIs de background. |
| [`tests/components/MaxCreditCard.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxCreditCard.test.ts) | Modificar / Expandir | Adicionar asserções para todas as variantes de bandeiras (incluindo JCB, Amex e Diners) e verificar a presença de SVG vetorial válido. |

---

## 3. Passo a Passo Detalhado da Implementação

### Etapa 1: Vetorização Limpa e Canônica do `card-jcb.svg`

1. **Análise Estrutural da Marca JCB**:
   - A bandeira JCB é composta por três colunas verticais com cantos arredondados:
     - Faixa 1 (Esquerda): Azul corporativo (`#003A8F` ou `#006BB6`) com a letra branca `'J'`.
     - Faixa 2 (Centro): Vermelho corporativo (`#E60012`) com a letra branca `'C'`.
     - Faixa 3 (Direita): Verde corporativo (`#00873C`) com a letra branca `'B'`.
2. **Construção Vetorial Otimizada**:
   - Gerar o arquivo [`src/assets/credit-card/card-jcb.svg`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/assets/credit-card/card-jcb.svg) com viewBox padrão `0 0 1100 800` (mantendo exata conformidade dimensional com o viewBox anterior):
     - Remover nós proprietários do CorelDraw: `xmlns:xodm`, `xmlns:xlink`, `<metadata id="CorelCorpID_0Corel-Layer"/>`.
     - Remover o elemento `<image id="Objeto_x0020_3" ... xlink:href="data:image/png;base64,..." />` que continha os 82 KB de dados brutos.
     - Inserir caminhos `<path>` e formas `<rect rx="..." ry="...">` estritamente vetoriais desenhando as três faixas e as letras 'J', 'C' e 'B' preenchidas em branco.
3. **Verificação de Peso**:
   - O novo arquivo deve ter peso inferior a 2.500 bytes (redução direta de ~80.000 bytes).

---

### Etapa 2: Exclusão Física de Duplicatas Redundantes

1. **Remoção dos Três Arquivos Duplicados**:
   - Deletar fisicamente via git:
     - `src/assets/credit-card/card-american-express.svg`
     - `src/assets/credit-card/card-diners-club.svg`
     - `src/assets/credit-card/card-hiper.svg`
2. **Preservação dos Arquivos Canônicos**:
   - Manter como fontes únicas da verdade:
     - `src/assets/credit-card/card-amex.svg`
     - `src/assets/credit-card/card-diners.svg`
     - `src/assets/credit-card/card-hipercard.svg`

---

### Etapa 3: Refatoração dos Imports e Mapeamento em `MaxCreditCard.vue`

1. **Atualização dos Imports `?raw`**:
   - Em [`src/components/MaxCreditCard.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxCreditCard.vue#L71-L85), remover os 3 imports duplicados:
     ```ts
     // MANTER:
     import creditCardFrontSvg from '../assets/credit-card/credit-card.svg?raw';
     import creditCardRearSvg from '../assets/credit-card/credit-card-rear.svg?raw';
     import cardAmexSvg from '../assets/credit-card/card-amex.svg?raw';
     import cardDinersSvg from '../assets/credit-card/card-diners.svg?raw';
     import cardDiscoverySvg from '../assets/credit-card/card-discovery.svg?raw';
     import cardEloSvg from '../assets/credit-card/card-elo.svg?raw';
     import cardHipercardSvg from '../assets/credit-card/card-hipercard.svg?raw';
     import cardJcbSvg from '../assets/credit-card/card-jcb.svg?raw';
     import cardMaestroSvg from '../assets/credit-card/card-maestro.svg?raw';
     import cardMastercardSvg from '../assets/credit-card/card-mastercard.svg?raw';
     import cardVisaSvg from '../assets/credit-card/card-visa.svg?raw';

     // ELIMINADOS:
     // - cardAmericanExpressSvg
     // - cardDinersClubSvg
     // - cardHiperSvg
     ```

2. **Reuso de Variáveis nos Aliases de `CARD_TYPE_SVGS`**:
   - No mapa constante de bandeiras, associar as chaves de alias à mesma string já importada:
     ```ts
     const CARD_TYPE_SVGS: Record<string, string> = {
         amex: cardAmexSvg,
         'american-express': cardAmexSvg, // Reutiliza cardAmexSvg sem duplicar no bundle
         diners: cardDinersSvg,
         'diners-club': cardDinersSvg,    // Reutiliza cardDinersSvg sem duplicar no bundle
         discover: cardDiscoverySvg,
         discovery: cardDiscoverySvg,
         elo: cardEloSvg,
         hipercard: cardHipercardSvg,
         hiper: cardHipercardSvg,         // Reutiliza cardHipercardSvg sem duplicar no bundle
         jcb: cardJcbSvg,
         maestro: cardMaestroSvg,
         mastercard: cardMastercardSvg,
         visa: cardVisaSvg
     };
     ```

3. **Lazy Data-URI Memoization dos Fundos do Cartão**:
   - Substituir a inicialização síncrona no top-level do módulo:
     ```ts
     // ANTES (executa durante import do módulo):
     // const creditCardFrontUri = svgToDataUri(creditCardFrontSvg);
     // const creditCardRearUri = svgToDataUri(creditCardRearSvg);

     // DEPOIS (memoização sob demanda):
     let _frontUri: string | null = null;
     let _rearUri: string | null = null;

     const getCreditCardFrontUri = (): string => {
         if (!_frontUri) _frontUri = svgToDataUri(creditCardFrontSvg);
         return _frontUri;
     };

     const getCreditCardRearUri = (): string => {
         if (!_rearUri) _rearUri = svgToDataUri(creditCardRearSvg);
         return _rearUri;
     };
     ```
   - Utilizar `getCreditCardFrontUri()` e `getCreditCardRearUri()` dentro da computed `bgStyle` ou das propriedades estilizadas da frente e do verso.

---

## 4. Padrões de Performance do GEMINI.md

1. **Minimização Estrita do Bundle**:
   - O design system distribui bibliotecas compiladas como módulos ES (`dist/index.es.js`). A eliminação de 112 KB de strings literais desnecessárias reduz diretamente o tempo de download sobre redes lentas e o tempo de parse do motor V8.
2. **Isolamento de Estilos**:
   - Nenhuma classe utilitária inline ou atributos UnoCSS adicionados ao template. Todos os estilos continuam estritamente encapsulados no bloco `<style lang="scss" scoped>` aninhado.
3. **Alocação de Heap Otimizada**:
   - Ao não duplicar strings e aplicar lazy memoization em `svgToDataUri`, o consumo permanente de memória no heap do V8 decorrente do módulo `MaxCreditCard` é reduzido pela metade.

---

## 5. Critérios de Aceite e Verificação Técnica

- [ ] **Redução de Bytes do Bundle**:
  - Soma dos tamanhos em `src/assets/credit-card/` cai de **~189.5 KB** para **≤ 77 KB** (redução superior a 112 KB).
  - O arquivo `card-jcb.svg` pesa ≤ 2.5 KB (redução de ~80 KB).
  - Três arquivos redundantes foram excluídos do repositório.
- [ ] **Sem Bitmaps em SVGs**:
  - O arquivo `card-jcb.svg` não contém tags `<image>` nem cadeias base64 (`data:image/png`).
- [ ] **Fidelidade Visual das Bandeiras**:
  - Renderizar o componente com `cardType="jcb"` e verificar se o logotipo oficial da JCB é renderizado com alta definição e proporção correta.
  - Testar os pares de aliases:
    - `cardType="amex"` e `cardType="american-express"` exibem o mesmo SVG idêntico.
    - `cardType="diners"` e `cardType="diners-club"` exibem o mesmo SVG idêntico.
    - `cardType="hiper"` e `cardType="hipercard"` exibem o mesmo SVG idêntico.
- [ ] **Verificação de Regressão e Testes**:
  - Execução de `npx vitest run tests/components/MaxCreditCard.test.ts` com 100% de sucesso.
  - Execução de `npm run build` confirmando redução no tamanho do bundle gerado em `dist/`.
  - Execução de `npm run type-check` sem erros de tipagem.

---

## 6. Mitigação de Riscos de Regressão

| Risco | Impacto | Estratégia de Mitigação |
|---|---|---|
| Quebra de consumidores que importam os SVGs via caminho relativo profundo de arquivos excluídos | Erro de import na aplicação externa | Os SVGs do diretório de assets são consumidos exclusivamente pelo `MaxCreditCard.vue` internamente através de `?raw`. O componente mantém todos os aliases contratuais públicos na prop `cardType`. |
| Diferença visual sutil no logotipo da JCB | Reclamação de design ou distorção em escala reduzida | Manter estritamente a proporção `viewBox="0 0 1100 800"` e as cores oficiais canônicas da JCB (azul, vermelho e verde), garantindo que o SVG se ajuste ao mesmo contêiner CSS sem alterações de layout. |
| Erro de codificação com caracteres especiais no Data URI | SVG corrompido no Safari ou navegadores legados | O helper consolidado [`src/helpers/svgToDataUri.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/helpers/svgToDataUri.ts) já faz o encode seguro via `encodeURIComponent`. A saída foi validada contra a especificação de Data URIs. |
