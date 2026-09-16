# Relatório de Execução — IMP6-R03

- **ID do Papel:** IMP6-R03
- **Bloco:** R03 / E03-01 (Validação estrutural canônica de parentTag/path em legacyClassUsage.test.ts)
- **UUID:** `9c97e1dd-9691-4d86-9f21-de4822a9e321`
- **Parent ID:** `da986479-bddd-4162-bd27-8952f0c5a526`
- **Worktree:** `/home/johnattas/GitHub/MaxAiManager/.worktrees/maxcomponentsui-fix6`
- **Branch:** `fix/fix6-implementation`
- **Status:** CONCLUÍDO

## 1. Escopo e Problema Tratado
Em `tests/architecture/legacyClassUsage.test.ts`, o parser de AST do template (`extractTemplateAstPOccurrences`) já realizava a extração correta de `parentTag` (tag do elemento pai imediato) e `path` (caminho hierárquico ancestral completo separado por ` > `). No entanto, o validador `auditVueFileForLegacyClasses` (linhas 337-345 do baseline) apenas verificava se a tag do nó estava em `allowedTags` e se possuía a classe canônica associada (`requiredSiblingCanonical`), ignorando completamente `parentTag` e `path`.

Essa lacuna permitia que uma classe legada e seu alias canônico fossem transferidos ou inseridos dentro de nós com tag equivalente (por exemplo, mover um cabeçalho ou célula contendo `p-datatable-column-header-content` e `max-table-column-header-content` de dentro de `<th>` para uma `<div>` externa plausível, como a caixa de feedback ou a raiz do componente), preservando cardinalidade e tag `div`, passando na auditoria sem qualquer detecção de deslocamento hierárquico.

## 2. Modificações Realizadas
1. **Modelagem do Contrato Estrutural (`StructuralRule`):**
   - Criada a interface tipada `StructuralRule`:
     - `allowedTags: string[]`: tags HTML permitidas no nó.
     - `requiredSiblingCanonical?: string`: classe canônica `.max-*` obrigatória no mesmo elemento.
     - `allowedParentTags?: string[]`: tags do elemento pai imediato permitidas para o nó.
     - `allowedPathPatterns?: (RegExp | string)[]`: padrões de caminho ancestral hierárquico admitidos para o nó.
   - Atualizada a interface `LegacyExceptionCatalogEntry` para usar `Record<string, StructuralRule>`.

2. **Catalogação Rigorosa de `structuralRules` em `LEGACY_COMPAT_CATALOG`:**
   - **`MaxTable.vue`**: Definidas regras estruturais granulares para `p-datatable`, `p-datatable-scrollable`, `p-datatable-table-container`, `p-datatable-cell`, `p-column`, `p-datatable-column-header-content`, `p-datatable-column-title`, `p-row-even`, `p-row-odd`, especificando `allowedParentTags` e `allowedPathPatterns` (ex.: células exigem pai `tr` e caminho em `tbody`; cabeçalhos exigem pai `th` ou `button` e caminho em `thead > tr > th`).
   - **`MaxTopToolbar.vue`**: Mapeadas regras para `p-menubar-root-list` (pai `nav`, path `div > nav > ul`), `p-menubar-item` (pai `ul`), `p-menubar-item-content` (pai `li`) e `p-menubar-submenu-root` (pai `li`).
   - **`MaxTopToolbarSubmenu.vue`**: Mapeadas regras para `p-menubar-submenu` (pai `root`, path `ul`), `p-menubar-item` (pai `ul`), `p-menubar-item-content` (pai `li`) e `p-menubar-submenu-nested` (pai `li`).
   - **`MaxInputIconPicker.vue`**: Mapeadas regras para `p-drawer-bottom`, `p-drawer-header`, `p-drawer-title`, `p-drawer-close-button`, `p-drawer-content` (exigindo contexto `Teleport > div > div...`).
   - **`MaxInputFileUpload.vue`**: Mapeadas regras para `p-fileupload`, `p-button`, `p-fileupload-choose` e `p-fileupload-content`.

3. **Validação Estrutural Estrita em `auditVueFileForLegacyClasses`:**
   - Adicionada verificação de `rule.allowedParentTags`: emite violação `${basename}: classe '${occ.className}' no nó <${occ.tag}> possui tag pai inválida <${occ.parentTag}> (esperado: [${rule.allowedParentTags.join(', ')}])`.
   - Adicionada verificação de `rule.allowedPathPatterns`: emite violação `${basename}: classe '${occ.className}' no nó <${occ.tag}> possui caminho estrutural inválido '${occ.path}'`.

4. **Testes de Mutação Plausíveis:**
   - Criado teste de mutação em `MaxTable.vue` demonstrando que, ao mover o cabeçalho (`p-datatable-column-header-content` com o alias canônico `max-table-column-header-content`) para uma `<div>` plausível de feedback (`max-table-feedback-box`), mantendo a tag `div`, o alias canônico e a cardinalidade exata (3 ocorrências), o teste anterior passava silenciosamente, enquanto a nova validação detecta e rejeita imediatamente por tag pai inválida `<div` e caminho estrutural inválido.
   - Criado teste de mutação em `MaxTable.vue` demonstrando que ao mover uma célula `p-datatable-cell` com seu alias canônico `max-table-cell` para uma `div` de simulação de célula, a auditoria detecta a tag inválida `div` e o caminho estrutural inválido.

5. **Atualização da Matriz de Orquestração:**
   - Atualizada a linha de `IMP6-R03` em `docs/optimize-new/execution-fix6/MATRIZ_ORQUESTRACAO.md` para `CONCLUÍDO`.

## 3. Comandos Executados e Evidências Reais

### Execução dos Testes Vitest
```bash
$ npx vitest run tests/architecture/legacyClassUsage.test.ts

 RUN  v4.1.11 /home/johnattas/GitHub/MaxAiManager/.worktrees/maxcomponentsui-fix6

 ✓ tests/architecture/legacyClassUsage.test.ts (11 tests) 281ms
   ✓ Auditoria Arquitetural: Uso de Classes Legadas e Desacoplamento PrimeVue (R03 / F04) (11)
     ✓ nenhum componente em src/components/ deve importar pacotes PrimeVue 7ms
     ✓ apenas componentes estritamente catalogados na Fase 2 podem conter seletores ou classes .p-* 218ms
     ✓ cada componente catalogado deve respeitar rigorosamente a cardinalidade exata de seletores e classes .p-* 15ms
     ✓ todos os componentes catalogados devem implementar a anatomia canônica obrigatória .max-* 2ms
     ✓ Mutation test: rejeição de acréscimo, cardinalidade excedente e remoção de anatomia canônica (7)
       ✓ falha na auditoria quando um seletor .p-* arbitrário é injetado em arquivo já catalogado (MaxTopToolbar.vue) 3ms
       ✓ falha na auditoria quando uma segunda ocorrência de seletor allowlisted é adicionada (duplicação de cardinalidade) 12ms
       ✓ falha na auditoria quando uma classe p-* arbitrária é injetada no template de componente catalogado 2ms
       ✓ falha na auditoria quando um seletor .p-* é adicionado em componente não catalogado (MaxButton.vue) 2ms
       ✓ falha na auditoria quando uma classe canônica obrigatória .max-* é removida de componente catalogado 3ms
       ✓ falha na auditoria quando classe legada e seu alias canônico são movidos para uma div plausível fora da hierarquia canônica (violação estrutural de parentTag e path) 8ms
       ✓ falha na auditoria quando classe legada de célula (p-datatable-cell) e seu alias canônico são movidos para uma div plausível 7ms

 Test Files  1 passed (1)
      Tests  11 passed (11)
   Start at  18:53:06
   Duration  1.06s (transform 257ms, setup 342ms, import 79ms, tests 281ms, environment 231ms)
```

### Execução do ESLint
```bash
$ npx eslint tests/architecture/legacyClassUsage.test.ts
# Código de saída 0 (sem erros ou advertências).
```

## 4. Diffs Resumidos
```diff
--- a/tests/architecture/legacyClassUsage.test.ts
+++ b/tests/architecture/legacyClassUsage.test.ts
@@ -28,6 +28,17 @@ export interface TemplateClassOccurrence {
     allClassesInNode: string[];
 }
 
+export interface StructuralRule {
+    /** Tags HTML/componente permitidas para o nó que contém a classe legada */
+    allowedTags: string[];
+    /** Classe canônica .max-* que obrigatoriamente deve coexistir no mesmo nó */
+    requiredSiblingCanonical?: string;
+    /** Tags do elemento pai imediato permitidas para o nó */
+    allowedParentTags?: string[];
+    /** Padrões regex ou literais permitidos para o caminho de tags ancestrais até o nó */
+    allowedPathPatterns?: (RegExp | string)[];
+}
+
 export interface LegacyExceptionCatalogEntry {
...
+                if (rule.allowedParentTags && !rule.allowedParentTags.includes(occ.parentTag)) violations.push(`${basename}: classe '${occ.className}' no nó <${occ.tag}> possui tag pai inválida <${occ.parentTag}> (esperado: [${rule.allowedParentTags.join(', ')}])`);
+
+                if (rule.allowedPathPatterns && rule.allowedPathPatterns.length > 0) {
+                    const matchesPath = rule.allowedPathPatterns.some((pattern) => typeof pattern === 'string' ? occ.path === pattern : pattern.test(occ.path));
+                    if (!matchesPath) violations.push(`${basename}: classe '${occ.className}' no nó <${occ.tag}> possui caminho estrutural inválido '${occ.path}'`);
+                }
```

## 5. Decisões Tomadas
- **Preservação estrita das regras do ESLint do repositório**: A formatação dos blocos condicionais foi alinhada à regra `curly: ["error", "multi-or-nest"]` do ESLint, garantindo conformidade total sem flags de supressão.
- **Isolamento na mutação de validação**: No teste de mutação em que a classe e o alias são movidos para uma `div` de feedback, substituiu-se o elemento de origem para manter a cardinalidade exata (3 ocorrências) inalterada, demonstrando que a falha decorre exclusivamente da violação estrutural de `parentTag` e `path`, e não de cardinalidade.
- **Abrangência de catálogo**: Todas as classes permitidas em template da Fase 2 (em 5 arquivos distintos) foram enriquecidas com `structuralRules` completas (`allowedTags`, `allowedParentTags`, `allowedPathPatterns` e `requiredSiblingCanonical`).
