# Achado UX-04: Ausência de Progresso Real, Degradação Efêmera de Erros e Dropzones Inertes no Módulo de Upload

## Severidade: Alta

### Componentes Impactados
- [`MaxInputFileUpload.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileUpload.vue)
- [`MaxInputFileUploadBig.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileUploadBig.vue)
- [`MaxInputFileProject.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileProject.vue)
- [`MaxInputFile.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFile.vue)

---

## 1. Sintoma Observado vs Causa Raiz Profunda

### Sintomas Observados
1. **Desaparecimento Silencioso de Erros de Upload após 3 Segundos ("Error Ghosting")**:
   Ao tentar enviar um arquivo em `MaxInputFileUpload.vue` ou `MaxInputFileUploadBig.vue` que seja rejeitado pelo backend (ex.: erro HTTP 413 "Payload Too Large", erro 422 de formato não suportado ou erro 500), uma mensagem genérica de erro surge na tela e **some misteriosamente após 3 segundos**. Simultaneamente, a lista de arquivos selecionados é esvaziada (`files.value = []`). O componente retorna ao estado inicial como se nada tivesse acontecido. O usuário não tem tempo suficiente para ler a mensagem, não é informado do motivo da falha, não recebe código de status e perde a seleção do arquivo, ficando sem ação de reenvio (*retry*).
2. **Promessa Não Cumprida de Progresso de Upload**:
   A documentação e os comentários de `MaxInputFileUpload.vue` declaram: *"Suporta múltiplos arquivos, pré-visualização (thumbnails), progresso de upload e integração com backend"*. Contudo, na implementação real da requisição `XMLHttpRequest`, não existe nenhum manipulador conectado a `xhr.upload.onprogress`. O usuário que envia arquivos pesados (como plantas elétricas em DWG/PDF de 30MB a 100MB) visualiza apenas um spinner estático girando indefinidamente, sem percentual, sem bytes transferidos e sem estimativa de tempo restante.
3. **Dropzone Inerte com Descarte Silencioso de Documentos**:
   No componente `MaxInputFileProject.vue` (destinado ao envio de documentos de projetos fotovoltaicos), a interface exibe a instrução explícita: *"Clique aqui ou arraste e solte os documentos para carregar"*. Quando o usuário arrasta documentos sobre a área, a borda reage visualmente (`isOverDropZone`), mas ao soltar os arquivos, **nada acontece**. A função interna `onDrop` está completamente comentada e vazia. Os documentos do usuário são descartados sem nenhum aviso sonoro ou visual.
4. **Dependência Frágil de CDN Remoto para Exibição de Estados Lottie**:
   O componente `MaxInputFileUploadBig.vue` utiliza a biblioteca `@lottiefiles/dotlottie-vue` para carregar animações de loading e erro a partir de URLs públicas externas (`https://lottie.host/...`). Em ambientes corporativos com proxies restritivos, redes offline ou quando bloqueadores de anúncios interceptam o domínio externo, as animações falham silenciosamente, deixando blocos vazios ou quebrando a experiência visual com atributos de teste legados (`background="red"`).

### Causa Raiz Profunda
A causa raiz é a **ausência de uma máquina de estados finitos (State Machine) resiliente para operações assíncronas de arquivos** e a **adoção de temporizadores imperativos (`setTimeout`) para esconder falhas em vez de tratá-las**:
- **Tratamento Ilusório de Erro com `setTimeout`**: O uso de `setTimeout(() => { showError.value = false; files.value = []; }, 3000)` trata um erro de rede/servidor como um incômodo passageiro a ser varrido para debaixo do tapete, em vez de um estado persistente que exige feedback claro, detalhamento do erro (payload retornado) e botão de ação ("Tentar Novamente").
- **Código Morto e Incompleto em Handlers de Drag-and-Drop**: O abandono da função `onDrop` em `MaxInputFileProject.vue` demonstra ausência de testes e2e de arrastar e soltar e falta de compromisso com a funcionalidade anunciada no template.

---

## 2. Evidência Técnica

### Evidência 1: O timer de 3 segundos que apaga o erro e zera os arquivos
Localização: [`MaxInputFileUpload.vue#L185-L190`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileUpload.vue#L185-L190)

```ts
    watch(showError, (val) => {
        if (val) setTimeout(() => {
            showError.value = false;
            files.value = []; // Apaga os arquivos do usuário!
        }, 3000);
    });
```

E em `MaxInputFileUploadBig.vue#L83-L86`:
```ts
    watch(showError, (val) => {
        if (val) setTimeout(() => { showError.value = false; }, 3000);
    });
```

Se o usuário piscar os olhos ou desviar a atenção por 3 segundos, ele volta para o computador e vê o campo limpo, sem saber se o upload deu certo, se foi cancelado ou se deu erro.

### Evidência 2: Ausência de ouvinte de progresso em `XMLHttpRequest`
Localização: [`MaxInputFileUpload.vue#L231-L258`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileUpload.vue#L231-L258)

```ts
        const xhr = new XMLHttpRequest();
        currentXhr = xhr;

        const formData = new FormData();
        // ...
        xhr.withCredentials = true;
        xhr.open('POST', url, true);

        onBeforeUpload({ xhr, formData });

        // NENHUMA linha configurando xhr.upload.onprogress!
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) onUploadHandler({ xhr });
            else onError({ xhr });
            currentXhr = null;
        };

        xhr.onerror = () => {
            onError({ xhr });
            currentXhr = null;
        };

        xhr.send(formData);
```

Não há cálculo de percentual de upload, nem emissão de evento de progresso (`upload-progress`), deixando o usuário no escuro durante uploads demorados.

### Evidência 3: Handler `onDrop` abandonado e comentado em `MaxInputFileProject.vue`
Localização: [`MaxInputFileProject.vue#L112-L116`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileProject.vue#L112-L116) e [`MaxInputFileProject.vue#L193-L195`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileProject.vue#L193-L195)

```ts
    const { isOverDropZone } = useDropZone(drop_zone_ref as any, {
        onDrop,
        multiple: true,
        preventDefaultForUnhandled: false
    });

    // ...

    function onDrop(_files: File[] | null) {
        // if (files) emit('files-selected', files);
    }
```

O código que deveria processar os arquivos soltos na dropzone foi comentado e esquecido, inutilizando a funcionalidade de arrastar e soltar.

### Evidência 4: Animações de loading dependentes de CDN externo com `background="red"`
Localização: [`MaxInputFileUploadBig.vue#L21-L40`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileUploadBig.vue#L21-L40)

```html
        <!-- Estado de upload em progresso -->
        <div v-else-if="uploading" class="upload-state">
            <slot name="uploading">
                <div class="screen-animation">
                    <DotLottieVue style="height: 300px; width: 300px;" background="red" autoplay loop src="https://lottie.host/1c897063-7dec-4b92-b8db-ecd2cd67f48e/ofrND79jXr.lottie" />
                </div>
            </slot>
        </div>
```

---

## 3. Impacto na Experiência do Usuário Final e no Produto

1. **Perda de Dados e Incerteza Operacional Crítica**: Em sistemas de gestão de homologação (onde o upload de faturas de energia, procurações e diagramas unifilares é pré-requisito indispensável), o usuário não sabe se os arquivos foram salvos. Ao ver o campo vazio após 3 segundos de um erro não percebido, o usuário pode avançar no processo acreditando que a etapa foi concluída.
2. **Frustração por Falta de Feedback em Conexões Lentas**: Ao fazer upload de arquivos pesados em áreas rurais ou conexões móveis (situação cotidiana de integradores solares em campo), a ausência de barra de progresso dá a falsa impressão de que a aplicação travou.
3. **Quebra de Expectativa em Ações de Arrastar e Soltar**: Arrastar um documento e vê-lo desaparecer sem efeito causa confusão imediata e leva o usuário a desconfiar da robustez da plataforma.

---

## 4. Recomendações de Solução Arquitetural de UX
1. **Adotar uma Máquina de Estados Persistente para Upload**:
   - Estados: `idle` | `dragover` | `selected` | `uploading` (com `%` de 0 a 100) | `success` | `error`.
   - Manter o estado de erro persistente até que o usuário clique em "Fechar Erro" ou "Tentar Novamente".
   - Exibir os detalhes do erro (mensagem retornada pelo backend ou motivo técnico legível, como "Arquivo excede o limite de 20MB").
2. **Implementar Suporte Completo a `xhr.upload.onprogress`**:
   - Calcular e expor a porcentagem concluída (`Math.round((event.loaded / event.total) * 100)`), renderizando uma barra de progresso visual fluida e acessível (`role="progressbar"`).
3. **Corrigir o `onDrop` em `MaxInputFileProject.vue`**:
   - Conectar o handler `onDrop` para invocar a mesma rotina de processamento do file dialog (`handleFiles(files)`).
4. **Substituir Dependências Externas Lottie por Indicadores CSS/SVG Nativos**:
   - Utilizar componentes leves nativos do design system (`MaxLoaderIcon`, spinners SVG e ícones semânticos) para loading e erro, garantindo operação offline e tempo de resposta instantâneo.
