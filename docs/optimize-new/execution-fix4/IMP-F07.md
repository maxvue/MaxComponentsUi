# Relatório de Implementação — Bloco F07

- **Subagente**: `IMP-F07`
- **ID da Plataforma**: `4e8e68ae-0411-43e3-b547-ce2ad1fd566e`
- **Parent ID**: `97db74f2-d994-4291-b55b-2b4eff908ba2`
- **Início**: `2026-09-15T06:10:50-03:00`
- **Término**: `2026-09-15T06:24:00-03:00`
- **Status**: `CONCLUÍDO COM SUCESSO`

---

## 1. Escopo e Objetivos

O bloco F07 tem como objetivo reformular o helper compartilhado `src/helpers/useOutsidePointer.ts` e seus testes unitários em `tests/helpers/useOutsidePointer.test.ts`, sanando as seguintes falhas auditadas na Etapa 3:
1. **Dispatcher/listener global unificado**: manter listeners globais únicos compartilhados por todas as instâncias ativas (sem duplicar listeners no DOM por overlay).
2. **Eliminação de listeners `keydown` duplicados**: remover a instalação redundante de `keydown` em `window` e `document`, mantendo apenas o registro unificado no `document`.
3. **Pilha de overlays e camadas superiores**: garantir que apenas a camada no topo da pilha feche em resposta a clique fora ou tecla Escape. Corrigir o erro crítico que tratava camadas inferiores como "inside" do topo, impedindo o fechamento da camada superior quando o usuário clicava em uma camada anterior.
4. **Suporte a clique-through sem dead-clicks e sem focus stealing**: permitir que o clique fora atinja o elemento externo e preserve o foco no controle clicado, sem puxá-lo de volta forçadamente para o trigger do overlay fechado.
5. **Tratamento de âncora desconectada**:
   - No reposicionamento (scroll/resize), detectar se o trigger/âncora foi desconectado do DOM e fechar o overlay graciosamente (`onClose('outside')`).
   - Na restauração de foco ao fechar, caso o trigger explícito tenha sido removido do DOM, realizar fallback seguro para `previousActiveElement` (se conectado) sem gerar erros ou focar nós desconectados.
6. **Suporte a zoom e redimensionamento via `visualViewport`**: escutar eventos de `resize` e `scroll` em `window.visualViewport` quando a API estiver disponível.
7. **Contagem rigorosa ZERO de listeners residuais**: rastrear individualmente cada listener registrado pelo helper, retornando a contagem real precisa via `getActiveOutsidePointerListenersCount()` e garantindo contagem zero após o fechamento ou desmontagem de todas as instâncias.

---

## 2. Arquivos Alterados

- `src/helpers/useOutsidePointer.ts`:
  - Implementado registro explícito `registeredGlobalListeners` com `addGlobalListener` e `removeAllGlobalListeners` para rastreamento exato.
  - Corrigida `getActiveOutsidePointerListenersCount()` para retornar o número real exato de listeners ativos.
  - Eliminado listener redundante `window.addEventListener('keydown')`, mantendo apenas em `document`.
  - Corrigido `onGlobalPointerDown` e `onGlobalClick` para verificar `isInsideElements` exclusivamente em relação a `topOverlay.elements()`. Camadas inferiores agora são tratadas corretamente como outside da camada superior.
  - Adicionada detecção de âncora desconectada no ciclo de reposicionamento global `handleGlobalReposition`.
  - Adicionado suporte a `window.visualViewport` para zoom/scroll em telas com zoom.
  - Aprimorada a lógica de `restoreFocus`: se o clique externo focou outro controle na tela (`document.activeElement`), o foco não é roubado. Se o trigger foi desconectado, faz fallback para `previousActiveElement`.
- `tests/helpers/useOutsidePointer.test.ts`:
  - Adicionados 8 novos casos de teste cobrindo detalhadamente:
    - Registro exclusivo de `keydown` em `document` (nunca em `window`).
    - Fechamento exclusivo da camada superior ao clicar na camada inferior (não considera camada inferior como inside).
    - Fechamento exclusivo do topo ao clicar em elemento externo.
    - Preservação do foco no controle clicado no clique-through.
    - Restauração de foco no Escape com fallback para âncora desconectada.
    - Fechamento do overlay quando a âncora é desconectada durante resize.
    - Compartilhamento de listeners globais entre múltiplas instâncias e contagem zero absoluta de listeners residuais no unmount.
    - Monitoramento de zoom e resize em `window.visualViewport` com limpeza total de listeners.

---

## 3. Comandos Executados e Resultados

1. **Testes Unitários Focais (`useOutsidePointer`)**:
   ```bash
   npx vitest run tests/helpers/useOutsidePointer.test.ts
   ```
   - **Resultado**: `13 passed (13)` em 744ms. Todos os testes passaram com sucesso.

2. **Checagem de Tipos TypeScript (`vue-tsc`)**:
   ```bash
   npm run type-check
   ```
   - **Resultado**: Código de saída `0`, sem erros de tipagem.

3. **Verificação de Regressão em Componentes Consumidores**:
   ```bash
   npx vitest run tests/components/MaxBaseOverlay.test.ts tests/components/MaxTagSelect.test.ts tests/components/MaxInputDatePicker.test.ts tests/components/MaxInputAutoComplete.test.ts tests/components/MaxPopoverMenu.test.ts tests/components/MaxUserSection.test.ts
   ```
   - **Resultado**: `5 passed (5 files), 125 passed (125 tests)`. Zero regressões.

4. **Lint e Formatação (`eslint`)**:
   ```bash
   npx eslint src/helpers/useOutsidePointer.ts tests/helpers/useOutsidePointer.test.ts
   ```
   - **Resultado**: Código de saída `0`, 0 erros, 0 warnings.

---

## 4. Riscos e Plano de Rollback

### Riscos Identificados
- **Comportamento de foco em cliques rápidos**: Se um overlay fechar por clique externo em elemento não focável (ex.: texto comum ou fundo), o foco retorna ao trigger de abertura. Se clicar em elemento focável, o foco permanece no elemento clicado. Esse comportamento é o padrão WAI-ARIA para overlays não modais e previne dead-focus.
- **Camadas aninhadas**: Em layouts com múltiplos popovers aninhados, cada clique fora agora fecha apenas a camada mais recente (topo). Isso é estritamente desejável para menus hierárquicos e popovers encadeados.

### Plano de Rollback
Caso seja necessário reverter a alteração:
```bash
git checkout HEAD -- src/helpers/useOutsidePointer.ts tests/helpers/useOutsidePointer.test.ts
```
Não há migrações de banco de dados ou dependências externas adicionadas.
