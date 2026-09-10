# Plano de Implementação — Issue #81

## Descrição e Causa Raiz

### Problema
No catálogo oficial de componentes da biblioteca ([`COMPONENTS.md:921-940`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-81/COMPONENTS.md#L921-L940)), o componente `MaxInputFile` está documentado como uma funcionalidade central para upload e seleção de arquivos:
- **Descrição oficial:** "Área de **seleção de arquivos** com drag-and-drop, drop zone e suporte a **colagem (Ctrl+V)**. Exibe pré-visualização dos arquivos selecionados (imagens com thumbnail, demais com ícone + tamanho)."
- **Arquivo declarado:** [`src/components/MaxInputFile.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-81/src/components/MaxInputFile.vue)
- **Aliases:** `InputFile`
- **Props públicas:** `modelValue: File[]` (padrão `[]`), `label: string` (descrição da drop zone).
- **Atributos especiais:** `no-view` / `no-preview` (oculta a pré-visualização), `size-files` / `size-preview` (`'mini'` para exibição compacta).
- **Eventos:** `update:modelValue`.
- **Slots:** `button` (zona de clique e arraste) e `filesPreview` (lista de pré-visualização).

Entretanto, ao inspecionar a branch de desenvolvimento (`dev`), o componente em [`src/components/MaxInputFile.vue:1-8`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-81/src/components/MaxInputFile.vue#L1-L8) encontrava-se como uma casca completamente vazia:
```vue
<template>

</template>
<script setup lang="ts">


</script>

<style lang="scss">
...
```
O componente original não possuía nenhum nó de template (renderizava `wrapper.html() === ''`), não declarava props, não emitia eventos, não implementava o suporte a drag-and-drop nem a captura de colagem via clipboard (Ctrl+V), embora mantivesse 104 linhas residuais de SCSS órfão em seu bloco de estilos.

### Agravantes e Histórico do Portão de Qualidade
Durante a primeira iteração de implementação (commit `121d204a`), foi construída uma versão inicial que atendia ao catálogo funcional, porém a auditoria de qualidade automatizada ([`docs/issues/81/result-check.json`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-81/docs/issues/81/result-check.json)) **reprovou** a entrega com base em duas não-conformidades críticas de segurança e padrões do projeto:
1. **Vulnerabilidade de DOM XSS via `v-html` inseguro:**
   No template, a instrução `<div class="input-file-content-label" v-html="displayLabel"></div>` avaliava `props.label ?? attrs.label` diretamente. Conforme diretriz de segurança estabelecida na Issue #68 (`MaxTitle1`, `MaxTitle2`, `MaxEmptyDiv`), qualquer interpolação via `v-html` no ecossistema deve obrigatoriamente utilizar o helper padronizado `sanitizeHtml` ([`src/helpers/sanitizeHtml.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-81/src/helpers/sanitizeHtml.ts)) para neutralizar payloads de injeção maliciosa (ex.: tags `<script>`, `<iframe>` e atributos como `onerror`/`onload`).
2. **Uso de Tipagem Solta (`any`):**
   O uso de `const attrs: any = useAttrs();` e o cast `dropZoneRef as any` violam as regras estritas de tipagem TypeScript do projeto, que exigem tipagem forte sem o uso de `any` soltos.

### Causa Raiz Comprovada
- **Localização Exata:**
  - `src/components/MaxInputFile.vue:1-8` — Ausência da implementação do componente exigida pela documentação canônica em `COMPONENTS.md:921-940`.
  - `src/components/MaxInputFile.vue:19-20, 106-108` — Injeção de `displayLabel` em `v-html` sem higienização via `sanitizeHtml`.
  - `src/components/MaxInputFile.vue:81, 212` — Uso de tipos soltos `any` em `useAttrs()` e no binding do `useDropZone`.
  - `tests/components/MaxInputFile.test.ts` — Ausência de testes de regressão de segurança contra XSS e ausência de testes cobrindo todas as variantes de contratos documentadas.

- **Fluxo Causal e Rastreamento Reverso de Dados:**
  `Desenvolvedor/Consumidor invoca <MaxInputFile v-model="arquivos" label="Anexos" />` ➔ `Vue monta instância do componente` ➔ **Falha Funcional:** Template vazio renderiza nó nulo no DOM, impossibilitando qualquer seleção de arquivos ➔ **Falha de Segurança:** Caso receba string com tags HTML não sanitizadas em `label`, `v-html="displayLabel"` injeta código arbitrário no DOM sem filtro via `DOMPurify` ➔ Execução potencial de código malicioso no cliente (DOM XSS).

---

## Arquivos Afetados

1. [`src/components/MaxInputFile.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-81/src/components/MaxInputFile.vue)
   - Implementação completa do Single File Component respeitando rigorosamente a ordem estrutural (1º `<template>`, 2º `<script setup lang="ts">`, 3º `<style lang="scss">`).
   - Importação e uso do helper `sanitizeHtml` para higienização estrita de `displayLabel`.
   - Remoção de qualquer uso de `any`, adotando tipagem estrita com `useAttrs()` padrão e `dropZoneRef: Ref<HTMLDivElement | null>` compatível diretamente com `useDropZone`.
   - Gerenciamento de URLs em memória (`URL.createObjectURL` e `URL.revokeObjectURL`) para prevenir vazamento de memória (Memory Leak).
   - Suporte aos slots `#button` e `#filesPreview`, atributos `no-view`/`no-preview` e tamanhos `size-files`/`size-preview="mini"`.
2. [`tests/components/MaxInputFile.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-81/tests/components/MaxInputFile.test.ts)
   - Testes unitários e de integração abrangentes cobrindo toda a especificação de `COMPONENTS.md`.
   - Teste específico de validação de sanitização XSS (garantindo que scripts e manipuladores inline perigosos como `onerror` sejam removidos do `label`).
   - Testes de input nativo, drag-and-drop, colagem (Ctrl+V), remoção e ciclo de vida de liberação de URLs de objeto.

---

## Execuções Propostas

### 1. Refatoração e Implementação em `src/components/MaxInputFile.vue`

1. **Estrutura do Template (1º `<template>`):**
   - Container principal `.input-file-main-div` com `@click="triggerChoose"`, vinculando atributos com `v-bind="attrs"`.
   - Input nativo oculto `input[type="file"]` com `multiple`, `display: none` e listeners de `@change="onNativeInputChange"` e `@click.stop`.
   - Slot `#button`:
     - Área `.input-file-content` exibindo ícone (`lets-icons:upload-light`) e `.input-file-content-label` com `v-html="displayLabel"` (sanitizado).
     - Drop zone container `div ref="dropZoneRef"` com classe condicional `.dropping` quando `isOverDropZone` for verdadeiro, exibindo ícone `tabler:drag-drop` e mensagem de drop.
   - Slot `#filesPreview`:
     - Renderização condicional para `isVisibleFiles && temp_value.length > 0`.
     - Exibição compacta `.files-list-mini` se `sizePreview === 'mini'`.
     - Exibição padrão `.files-list-preview` com miniaturas para imagens (`img` com URL de objeto) e `.file-standard` (com nome e tamanho em KB) para demais arquivos.
     - Ícone de remoção `.trash-icon-remove-clipboard` (`tabler:trash`) com `@click.stop="deleteItem(index)"`.

2. **Lógica de Script (2º `<script setup lang="ts">`):**
   - Importações:
     ```typescript
     import { ref, computed, watch, useAttrs, onBeforeUnmount } from 'vue';
     import type { Ref } from 'vue';
     import { useDropZone, useEventListener } from '@maxvue/max-use';
     import MaxIcon from './MaxIcon.vue';
     import { sanitizeHtml } from '../helpers/sanitizeHtml';
     ```
   - Tipagem estrita:
     - `const attrs = useAttrs();` (sem asserção `any`).
     - Definição de props tipadas com `withDefaults`:
       ```typescript
       const props = withDefaults(
           defineProps<{
               /** Lista de arquivos selecionados (v-model) */
               modelValue?: File[];
               /** Texto descritivo na zona de drop */
               label?: string;
           }>(),
           {
               modelValue: () => []
           }
       );
       ```
     - Emits tipados:
       ```typescript
       const emit = defineEmits<{
           (e: 'update:modelValue', value: File[]): void;
       }>();
       ```
     - Elementos de referência fortemente tipados:
       ```typescript
       const nativeInputRef = ref<HTMLInputElement | null>(null);
       const dropZoneRef = ref<HTMLDivElement | null>(null);
       ```
   - Sanitização de Segurança:
     ```typescript
     const displayLabel = computed((): string => {
         const rawLabel = props.label
             ?? (typeof attrs.label === 'string' ? attrs.label : undefined)
             ?? 'Clique aqui, arraste e solte seus arquivos para enviar ou <b>Cole com Ctrl+V</b>';
         return sanitizeHtml(String(rawLabel));
     });
     ```
   - Atributos especiais:
     ```typescript
     const isVisibleFiles = computed((): boolean => {
         return attrs['no-view'] === undefined && attrs['no-preview'] === undefined;
     });

     const sizePreview = computed((): string => {
         const size = attrs['size-files'] ?? attrs['size-preview'];
         return typeof size === 'string' ? size : '';
     });
     ```
   - Controle de memória e ciclo de vida:
     - `previewUrlMap = new Map<File, string>()`.
     - `getFilePreviewUrl(file: File)`: cria e armazena cache do `URL.createObjectURL(file)`.
     - `cleanupFileUrl(file: File)`: revoga via `URL.revokeObjectURL(url)` e remove do mapa.
     - `cleanupAllUrls()`: limpa todas as URLs alocadas.
     - `onBeforeUnmount(cleanupAllUrls)`.
   - Operações e Eventos:
     - `triggerChoose()`: dispara `.click()` no `nativeInputRef`.
     - `onNativeInputChange()`: adiciona arquivos do input nativo e reseta `target.value = ''`.
     - `handlePaste()`: captura imagens/arquivos via clipboard e os anexa à lista.
     - `useEventListener(window, 'paste', handlePaste)`.
     - `useDropZone(dropZoneRef, { onDrop: ..., multiple: true, preventDefaultForUnhandled: false })` sem casts `as any`.

3. **Estilos (3º `<style lang="scss">`):**
   - Preservação e aplicação integral das classes de estilo pré-existentes: `.input-file-main-div`, `.input-file-content`, `.files-list-mini`, `.files-list-preview`, `.drop-zone-div`, `.dropping`, garantindo a identidade visual da biblioteca.

---

### 2. Especificação de Testes em `tests/components/MaxInputFile.test.ts`

Criar suíte completa de testes no Vitest validando os seguintes cenários:
1. **Renderização dos elementos estruturais:** Container `.input-file-main-div`, input oculto `input.max-input-file-hidden`, rótulo padrão formatado com instrução de clique e Ctrl+V.
2. **Prop e atributo `label`:** Renderização de label customizado tanto por prop quanto por atributo não declarado.
3. **Higienização XSS de `label` (Segurança):** Validação de que tags maliciosas (`<script>`, `<img src=x onerror=alert(1)>`) são devidamente limpas por `sanitizeHtml`, neutralizando vetores de ataque.
4. **Acionamento de seleção:** Disparo do evento `click` no input nativo invisível ao clicar na área do componente.
5. **Seleção de arquivos nativa:** Simulação de evento `change` com objeto `File`, conferindo emissão de `update:modelValue` e geração do preview com nome e tamanho formatado em KB.
6. **Drag-and-Drop (Drop Zone):** Simulação de soltura de arquivo (`drop`) na área `.drop-zone-div` e validação do callback `onDrop` emitindo `update:modelValue`.
7. **Colagem via Área de Transferência (Ctrl+V):** Disparo de evento `paste` no `window` contendo arquivo de imagem e validação da adição aos arquivos gerenciados.
8. **Exclusão de arquivos:** Clique no ícone de lixeira `.trash-icon-remove-clipboard`, confirmando remoção do array e emissão da lista filtrada.
9. **Atributos `no-view` e `no-preview`:** Garantia de que a listagem de pré-visualização fica oculta quando os atributos estiverem presentes.
10. **Modo compacto (`size-files="mini"` e `size-preview="mini"`):** Confirmação de renderização da grade `.files-list-mini` contendo apenas ícones reduzidos.
11. **Slots customizados:** Sobrescrever o conteúdo padrão utilizando `#button` e `#filesPreview`.
12. **Desalocação de memória:** Monitorar com `vi.spyOn(URL, 'revokeObjectURL')` que as URLs geradas são revogadas ao excluir arquivos individuais e ao desmontar o componente (`unmount()`).
13. **Sincronização reativa:** Atualização de `props.modelValue` reflete imediatamente na visualização interna do componente.

---

## Especificação de Teste TDD (Red-Green)

### 1. Etapa Red (Comprovação da Falha)
- Executar teste de renderização e de segurança contra a casca vazia do componente:
  ```typescript
  it('renderiza os elementos estruturais documentados', () => {
      const wrapper = mount(MaxInputFile);
      expect(wrapper.find('.input-file-main-div').exists()).toBe(true);
      expect(wrapper.find('.input-file-content-label').text()).toContain('Clique aqui, arraste e solte');
  });

  it('higieniza conteúdo de label contra XSS', () => {
      const wrapper = mount(MaxInputFile, {
          props: { label: 'Upload seguro <img src=x onerror="alert(1)">' }
      });
      expect(wrapper.html()).not.toContain('onerror');
      expect(wrapper.find('.input-file-content-label').text()).toContain('Upload seguro');
  });
  ```
- **Resultado Red:**
  Na implementação vazia anterior, o teste falha com `AssertionError: expected false to be true` (pois `wrapper.html()` é vazio).
  Na implementação sem sanitização, o teste de segurança falha com `AssertionError: expected string to not contain 'onerror'`.

### 2. Etapa Green (Validação da Correção)
- Com a implementação contendo sanitização estrita e suporte aos contratos:
  - O componente renderiza `.input-file-main-div`;
  - O payload perigoso é higienizado pelo DOMPurify via `sanitizeHtml`;
  - Todos os 13 testes unitários e de integração de `tests/components/MaxInputFile.test.ts` passam com sucesso.

---

## Banco de dados

- **Nenhuma** migration necessária (pacote exclusivo de componentes de interface front-end).

---

## Riscos de quebra e Não-Regressão

- **Contrato com a Documentação:** A implementação alinha estritamente o código com o catálogo oficial em `COMPONENTS.md:921-940`. Não há risco de quebra de contrato, pois o componente anteriormente não possuía implementação funcional.
- **Segurança e XSS:** A inclusão de `sanitizeHtml` elimina a vulnerabilidade de injeção de HTML no DOM (`v-html`), alinhando o componente às diretrizes de segurança da biblioteca (Issue #68).
- **Consumo de Memória:** O ciclo de vida de URLs temporárias é estritamente controlado com `URL.revokeObjectURL` para evitar vazamentos de memória em SPAs de longa execução.
- **Conformidade de Tipos:** A eliminação de tipos soltos `any` garante conformidade com a checagem rigorosa de tipos via `vue-tsc --noEmit`.
- **Integridade Global:** Todos os testes unitários globais da biblioteca continuarão executando com 100% de aprovação.

---

## Validação

A execução dos seguintes comandos comprova conclusivamente o sucesso da implementação:
1. **Testes Unitários do Componente:**
   ```bash
   npx vitest run tests/components/MaxInputFile.test.ts
   ```
2. **Suíte Completa de Testes da Biblioteca:**
   ```bash
   npx vitest run
   ```
3. **Checagem de Tipagem Estrita TypeScript:**
   ```bash
   npm run type-check
   ```
4. **Conformidade de Código ESLint:**
   ```bash
   npx eslint src/components/MaxInputFile.vue tests/components/MaxInputFile.test.ts
   ```
5. **Conformidade de Estilos Stylelint:**
   ```bash
   npx stylelint "src/components/MaxInputFile.vue"
   ```
6. **Compilação e Empacotamento:**
   ```bash
   npm run build
   ```

---

## Skills Aplicáveis

- `vue-components`
- `vue-max-stack-frontend-best-practices`
- `vue-debugging-best-practices`
- `vue-vitest-testing-best-practices`
- `vue-eslint-stylelint-quality-standards`
- `test-driven-development`
- `code-review-and-quality`
- `superpowers`
- `security-audit`
