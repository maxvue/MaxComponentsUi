# Violação da Proibição de Estilos Inline no Template e Proliferação de Posicionamento Manual por Ausência de Primitiva de Ancoragem

## Severidade: Alta

## Componentes Impactados
- `src/components/MaxInputSelect.vue` (6 ocorrências de `:style` para coordenadas de dropdown e cores)
- `src/components/MaxTagSelect.vue` (7 ocorrências de `:style` para coordenadas de overlay e estilos de tag)
- `src/components/MaxInputDatePicker.vue` (Coordenadas de dropdown flutuante vinculadas inline)
- `src/components/MaxInputPhone.vue` (Coordenadas flutuantes do dropdown de países)
- `src/components/MaxInputAutoComplete.vue` (Coordenadas do painel de sugestões)
- `src/components/MaxInputAutoCompleteApi.vue` (Coordenadas do painel de sugestões remotas)
- `src/components/MaxPopover.vue` & `src/components/MaxPopoverConfirm.vue` (Opacidade e coordenadas no template)
- `src/components/MaxPopoverMenu.vue` (Coordenadas e dimensões de ícone vinculadas inline)
- `src/components/MaxModal.vue` (Coordenadas e opacidade no template)
- `src/components/MaxUserSection.vue` (Coordenadas do menu de usuário)
- `src/components/MaxInputFileUploadBig.vue` (Estilos inline estáticos `style="height: 300px; width: 300px;"`)
- `src/components/MaxLoaderAi.vue` (Estilos inline estáticos `style="height: 400px; width: 400px;"`)
- `src/components/MaxInputFile.vue` & `src/components/MaxInputFileUpload.vue` (`style="display: none;"`)
- `src/components/MaxImage.vue`, `src/components/MaxListBox.vue`, `src/components/MaxDividers.vue`

---

## Sintoma Observado vs Causa Raiz Profunda

### Sintoma Observado
Existem pelo menos **37 componentes Vue** que utilizam atributos `style="..."` ou `:style="..."` diretamente nas tags do `<template>`, somando mais de 60 declarações de estilo inline no projeto.
Os casos mais alarmantes se dividem em:
1. **Posicionamento de Dropdowns e Overlays**: Expressões como `:style="{ top: position.top + 'px', left: position.left + 'px', zIndex: zIndex }"` repetidas em cada componente que abre um menu ou painel flutuante.
2. **Dimensões e Visibilidade Hardcoded**: Elementos visuais como animações Lottie recebendo `style="height: 300px; width: 300px;"` e inputs nativos recebendo `style="display: none;"`.
3. **Objetos de Estilo Computados Injetados no DOM**: `badgeStyles`, `rootStyle`, `containerStyle` calculando propriedades arbitrárias em JavaScript e injetando como atributo `style`.

### Causa Raiz Profunda
1. **Vácuo de Infraestrutura de Ancoragem (Overlay Engine)**: Quando o PrimeVue foi removido, a biblioteca perdeu a infraestrutura interna do PrimeVue que utilizava o motor Floating UI / Popper para ancorar e orientar balões flutuantes, seletores e calendários. Em vez de se construir uma primitiva reutilizável de ancoragem compartilhada (como um composable `useFloating` ou um `MaxBaseOverlay` que gerencie o posicionamento via CSS Custom Properties ou via Popover API), cada desenvolvedor recriou seu próprio cálculo com `getBoundingClientRect()` e aplicou os pixels calculados diretamente via `:style` no template.
2. **Violação Consciente das Diretrizes Canônicas**: O documento `GEMINI.md` estabelece taxativamente:
   > "REGRAS ESTRITAS DE ESTILIZAÇÃO FRONT-END:
   > 1. Proibição Absoluta de Classes Utilitárias e Atributos de Estilo no Template: É ESTRITAMENTE PROIBIDO utilizar classes utilitárias de estilo inline dentro dos atributos class ou :class nos templates dos componentes Vue...
   > 2. O Único Meio Permitido: Seção `<style lang="scss" scoped>`: O único meio autorizado para aplicar estilização aos componentes Vue é através da tag de estilo do componente."
   A inserção de `style="height: 300px; width: 300px;"` em `MaxInputFileUploadBig.vue` ou `display: none;` em `MaxInputFile.vue` representa pura negligência no cumprimento das regras de encapsulamento semântico.

---

## Evidência Técnica

### 1. Posicionamento Dinâmico Replicado em Múltiplos Componentes
Em `src/components/MaxInputSelect.vue`:
```vue
<!-- Linhas 103-107 -->
<div
    class="select-options-div"
    v-if="is_open"
    :style="{ top: position.top + 'px', left: position.left + 'px', width: (position.width ?? 0) + 'px', zIndex: zIndex }"
>
```

Em `src/components/MaxInputDatePicker.vue`:
```vue
<!-- Linha 78 -->
:style="{ top: position.top + 'px', left: position.left + 'px', zIndex: z_index }"
```

Em `src/components/MaxPopoverConfirm.vue`:
```vue
<!-- Linha 12 -->
:style="{ top: position.top + 'px', left: position.left + 'px' }"
```

Em `src/components/MaxUserSection.vue`:
```vue
<!-- Linha 92 -->
:style="{ top: position.top + 'px', left: position.left + 'px', zIndex: z_index }"
```

### 2. Estilos Inline Estáticos e Arbitrários
Em `src/components/MaxInputFileUploadBig.vue`:
```vue
<!-- Linha 25 -->
<DotLottieVue style="height: 300px; width: 300px;" background="red" autoplay loop src="https://lottie.host/.../ofrND79jXr.lottie" />

<!-- Linha 34 -->
<DotLottieVue style="height: 300px; width: 300px;" background="red" autoplay src="https://lottie.host/.../ghW5oHG5ml.lottie" />
```

Em `src/components/MaxLoaderAi.vue`:
```vue
<!-- Linha 5 -->
<DotLottieVue style="height: 400px; width: 400px;" autoplay loop src="https://lottie.host/.../o6vjcixeiy.lottie" />
```

Em `src/components/MaxInputFile.vue` e `src/components/MaxInputFileUpload.vue`:
```vue
<!-- Linha 5 em MaxInputFile.vue e Linha 7 em MaxInputFileUpload.vue -->
<input
    ref="nativeInputRef"
    type="file"
    class="max-file-native-input"
    style="display: none;"
    ...
/>
```

---

## Impacto na Consistência Visual do Design System

1. **Incompatibilidade com Políticas de Segurança Restritas (CSP)**: Aplicações corporativas que adotam Content Security Policy rigoroso (sem `unsafe-inline`) falham ou são bloqueadas pelo navegador ao renderizar estilos inline diretamente nos nós HTML.
2. **Perda de Reatividade e Desincronização de Layout**: Cálculos de posição manuais em `:style` não reagem fluidamente a mutações de tamanho, zooms do navegador ou scrolls complexos, levando menus a ficarem desalinhados ou "flutuando no ar" fora do campo correspondente.
3. **Quebra do Isolamento SCSS**: A estilização deixa de residir exclusivamente em `<style lang="scss" scoped>`, dispersando regras visuais entre o template Vue e os blocos de estilo, dificultando enormemente a manutenção e auditoria de design tokens.
