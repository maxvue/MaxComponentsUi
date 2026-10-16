# Seleção segmentada local pode perder entrada por Tab

- Data: 16/10/2026.
- Localização: MaxAiManager `resources/Vue/Components/SelectionButtonGroup.vue:62–73`.
- Evidência estática: `selectedIndex` encontra a opção selecionada sem excluir opções desabilitadas. `getTabIndex` retorna `-1` para a opção desabilitada; para as demais retorna `0` somente quando o índice coincide com `selectedIndex`, caso exista seleção.
- Condição concreta: a seleção atual permanece na lista, mas sua opção passa a `disabled=true`, enquanto há outra opção habilitada. Nesse estado, todos os botões recebem tabindex -1. Os testes existentes inspecionados não cobrem esse caso.

**Impacto potencial:** o grupo deixa de ser alcançável por navegação sequencial com teclado, embora haja opções utilizáveis. Não foi feita reprodução em navegador; o diagnóstico se limita ao fluxo determinístico do código.

**Encaminhamento fora do escopo:** em correção própria do consumidor, escolher a seleção habilitada como parada Tab; se indisponível, usar o primeiro habilitado, sem alterar automaticamente o valor. Incluir transições dinâmicas de opções nos testes. O MaxSegmentedControl proposto já inclui esse critério, mas sua criação não corrige o componente local automaticamente.

Nenhuma edição foi feita no MaxAiManager.
