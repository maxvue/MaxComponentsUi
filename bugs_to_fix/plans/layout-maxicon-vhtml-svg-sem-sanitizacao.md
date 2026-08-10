# MaxIcon injeta SVG remoto via v-html sem sanitização

- **Categoria:** segurança
- **Severidade:** alta
- **Arquivo(s):** `src/components/MaxIcon.vue:4`, `src/components/MaxIcon.vue:135-144`
- **Domínio:** tabela-layout-exibicao

## Problema

O conteúdo do ícone vem da `useIconStore` (que faz fetch na API do Iconify) e é injetado diretamente no DOM:

```vue
<div class="max-icon" v-html="svgContent" v-bind="attrs" flex :style="style" />
```

`v-html` não sanitiza. Um SVG é um documento capaz de carregar `<script>`, `<foreignObject>` com HTML arbitrário, e atributos de evento (`onload`, `onclick`) — todos executáveis quando inseridos via `innerHTML` no contexto da página.

O vetor concreto: `icon_name` (linha 72) vem de `props.i ?? props.icon`, valores frequentemente derivados de dados da aplicação (configuração de menu, registros de banco, resposta de API). Um nome de ícone controlado por atacante direciona o fetch da store para um caminho arbitrário na API do Iconify; e um comprometimento (ou MITM sem HTTPS estrito, ou uma configuração de endpoint customizado na store) do provedor de ícones resulta em execução de script no contexto da aplicação.

O mesmo padrão de `v-html` sem sanitização aparece em `MaxTitle1.vue:9` e `MaxTitle2.vue:8` (`v-html="resolvedSubtitle"`) e em `MaxEmptyDiv.vue:9` (`v-html="attrs.label"`), todos alimentados por props do consumidor — superfície menor, mas o mesmo tipo de risco quando o texto vem de dados do usuário.

## Impacto

- Execução de script arbitrário no contexto da aplicação caso o conteúdo do ícone seja adulterado — roubo de sessão, exfiltração de dados, ações em nome do usuário.
- Superfície ampla: `MaxIcon` é usado por praticamente todos os componentes da biblioteca.
- Aplica-se também aos subtítulos de `MaxTitle1`/`MaxTitle2` e ao label do `MaxEmptyDiv` quando alimentados por conteúdo não confiável.

## Plano de correção

1. Sanitizar o SVG antes da injeção. A opção mais robusta é fazê-lo **uma única vez na store**, ao cachear o resultado do fetch, e não em cada render do componente — assim o cache guarda apenas conteúdo já limpo.
2. Estratégia de sanitização, em ordem de preferência:
   - Parsear com `DOMParser` e reconstruir apenas os nós/atributos de uma allowlist SVG (`svg`, `path`, `g`, `circle`, `rect`, `defs`, `linearGradient`, `stop`, `d`, `fill`, `viewBox`, `transform`, ...), descartando `script`, `foreignObject` e todo atributo `on*` e `href`/`xlink:href` com esquema `javascript:`.
   - Ou adotar uma dependência dedicada (DOMPurify com `USE_PROFILES: { svg: true, svgFilters: true }`).
3. Validar o formato de `icon_name` antes do fetch (ex.: `/^[a-z0-9-]+:[a-z0-9-]+$/i`), rejeitando nomes que não sejam `prefixo:nome` — impede que o nome vire um caminho arbitrário.
4. Para `MaxTitle1`/`MaxTitle2`/`MaxEmptyDiv`: documentar explicitamente que o subtítulo/label aceita HTML e é responsabilidade do consumidor sanitizá-lo, ou aplicar a mesma sanitização.

## Verificação

- Teste alimentando a store com um SVG contendo `<script>alert(1)</script>` e um `onload=`, asserindo que nenhum dos dois sobrevive ao render.
- Teste com `icon` em formato inválido, asserindo que nenhum fetch é disparado.
- `npx vitest run tests/components/MaxIcon.test.ts` e os testes da `useIcon.Store`.
