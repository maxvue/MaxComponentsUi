# Plano de Implementação: Destruição e Recriação de Instância do Chart.js em Mutações de Dados

## 1. Diagnóstico e Objetivo

No componente `MaxChart.vue`, os watchers para `props.data` e `props.options` invocam incondicionalmente o método assíncrono `initChart()`. Esse método destrói a instância anterior do Chart.js (`destroyChart()`), realiza a resolução da promise de import dinâmico de `chart.js/auto` e instancia um novo objeto `new Chart(...)` no canvas:

```typescript
// MaxChart.vue atual:
watch(() => props.data, () => void initChart(), { deep: true });
watch(() => props.type, () => void initChart());
watch(() => props.options, () => void initChart(), { deep: true });
```

**Problemas identificados:**
1. **Destruição do ciclo de animação e flickering:** A cada mutação de dados ou ajuste de opções, o gráfico pisca em branco na tela porque o canvas perde seu contexto de renderização e buffers internos.
2. **Layout Thrashing e Alocação no GC:** A criação contínua de instâncias de `Chart` e seus respectivos canvas renderers sobrecarrega o Garbage Collector e gera reflows desnecessários.
3. **Overhead de import dinâmico redundante:** A resolução de `import('chart.js/auto')` é chamada a cada reatividade de dados.

**Objetivo:**
Refatorar a reatividade de `MaxChart.vue` para que mutações em `props.data` e `props.options` executem a atualização in-place através de mutação direta nas propriedades da instância ativa (`chart.value.data` e `chart.value.options`) seguida de `chart.value.update()`, preservando a recriação via `initChart()` estritamente quando `props.type` for alterado ou quando a instância ainda não existir.

---

## 2. Arquivos a Modificar

- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxChart.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxChart.vue)
- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxChart.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxChart.test.ts)

---

## 3. Especificação Técnica Cirúrgica

### 3.1. Modificações em `src/components/MaxChart.vue`

No script setup de [MaxChart.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxChart.vue):

1. Criar a função `updateChartData`:
   - Verifica se `chart.value` existe. Se não existir, redireciona para `void initChart()`.
   - Caso `props.data` esteja ausente (`null`), destrói a instância do gráfico chamando `destroyChart()`.
   - Se `props.data` existir, atualiza `chart.value.data` diretamente com `props.data`.
   - Atualiza `chart.value.options` mesclando `baseOptions()` com `props.options ?? {}`.
   - Invoca `chart.value.update()`.
2. Atualizar os watchers:
   - `watch(() => props.data, updateChartData, { deep: true })`
   - `watch(() => props.options, updateChartData, { deep: true })`
   - `watch(() => props.type, () => void initChart())` (mantém destruição e recriação quando o tipo geométrico do gráfico mudar)

```typescript
// Implementação cirúrgica em src/components/MaxChart.vue

const updateChartData = () => {
    if (!props.data) {
        destroyChart();
        return;
    }

    if (!chart.value) {
        void initChart();
        return;
    }

    // Atualização eficiente in-place compatível com Chart.js
    chart.value.data = props.data;
    if (props.options) {
        chart.value.options = { ...baseOptions(), ...props.options };
    }
    chart.value.update();
};

// Observadores reativos otimizados
watch(() => props.data, updateChartData, { deep: true });
watch(() => props.options, updateChartData, { deep: true });
watch(() => props.type, () => void initChart());
```

Template e estilos SCSS scoped mantêm-se estritamente intactos:

```html
<template>
    <div class="max-chart-main-div">
        <canvas ref="canvas_ref" :aria-label="ariaLabel || undefined" :role="ariaLabel ? 'img' : undefined"></canvas>
    </div>
</template>
```

```scss
<style lang="scss" scoped>
    .max-chart-main-div {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 0;

        canvas {
            display: block;
            width: 100%;
            height: 100%;
        }
    }
</style>
```

---

### 3.2. Atualização dos Testes Unitários em `tests/components/MaxChart.test.ts`

Adequar a asserção no teste `recria a instância quando os dados mudam` para verificar que a instância é mantida e `update()` é chamado sem chamar `destroy()`:

```typescript
it('atualiza os dados in-place via update() sem destruir a instância quando os dados mudam', async () => {
    const wrapper = mountChart();
    await flushPromises();

    expect(destroyMock).not.toHaveBeenCalled();

    await wrapper.setProps({ data: { labels: ['x'], datasets: [{ data: [9] }] } });
    await flushPromises();

    expect(updateMock).toHaveBeenCalled();
    expect(destroyMock).not.toHaveBeenCalled();
    expect(wrapper.vm.getChart()).toBeInstanceOf(FakeChart);
});

it('destrói e recria a instância quando o type muda', async () => {
    const wrapper = mountChart();
    await flushPromises();

    destroyMock.mockClear();
    await wrapper.setProps({ type: 'bar' });
    await flushPromises();

    expect(destroyMock).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.getChart()).toBeInstanceOf(FakeChart);
});
```

---

## 4. Garantia de Retrocompatibilidade

- **Contrato de Props:** Nenhuma prop foi removida ou modificada. `type`, `data`, `options`, `plugins` e `ariaLabel` operam identicamente.
- **Expose:** Métodos expostos (`getChart()`, `getCanvas()`, `refresh()`, `reinit()`, `toBase64Image()`) permanecem 100% inalterados.
- **Eventos:** Eventos `loaded` e `select` mantêm seus payloads e comportamento originais.
- **Degradação graciosa:** Se `props.data` for passado como `null`, o gráfico é destruído limpando o canvas, preservando o comportamento prévio.

---

## 5. Critérios de Aceitação e Comandos de Validação

1. Ao alterar `props.data` de um gráfico montado, a função `chart.update()` deve ser executada sem invocação de `chart.destroy()`.
2. Ao alterar `props.type`, o gráfico deve ser destruído e reinicializado com a nova configuração.
3. As transições de animação de dados devem ocorrer suavemente sem telas brancas (*flicker*).
4. Checagem de tipagem estrita com sucesso:
   ```bash
   npm run type-check
   ```
5. Execução dos testes unitários com 100% de sucesso:
   ```bash
   npx vitest run tests/components/MaxChart.test.ts
   ```
