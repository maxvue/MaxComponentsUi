# MaxLogo usa alt="Image" e link para "/" sem nome acessível

- **Categoria:** acessibilidade
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxLogo.vue:2-6`
- **Domínio:** tabela-layout-exibicao

## Problema

```vue
<div class="logo" pointer :rounded="props.rounded ? true : undefined">
    <RouterLink to="/">
        <img v-if="props.src" :src="`${props.src}`" alt="Image" />
    </RouterLink>
</div>
```

Três defeitos:

1. **`alt="Image"` é um texto alternativo inútil.** Um leitor de tela anuncia literalmente "Image" — não informa que é o logotipo, nem de qual organização. Um texto alternativo genérico é pior que nenhum: para uma imagem decorativa o correto seria `alt=""`, e para o logotipo (que aqui é o conteúdo de um link) é obrigatório descrever o destino.

2. **O link não tem nome acessível.** O `RouterLink` envolve apenas a imagem; o nome acessível do link é derivado do `alt` da imagem — que é "Image". O usuário ouve "link, Image", sem saber que vai para a página inicial.

3. **Link vazio quando `src` é ausente.** O `v-if="props.src"` está no `<img>`, não no `RouterLink`. Sem `src`, o `RouterLink` renderiza um `<a>` **completamente vazio** — um alvo de clique invisível e um link sem conteúdo, que ferramentas de auditoria sinalizam e leitores de tela anunciam como "link" sem descrição.

Não há prop para customizar nenhum desses textos, nem para alterar o destino do link (fixo em `/`).

## Impacto

- Violação de WCAG 1.1.1 (Non-text Content) e 2.4.4 (Link Purpose) — nível A.
- Usuários de leitor de tela não identificam o logotipo nem o destino do link.
- `<a>` vazio no DOM quando `src` não é fornecido.

## Plano de correção

1. Adicionar props para os textos e o destino, com defaults sensatos:
   ```ts
   const props = withDefaults(defineProps<{
       src?: string;
       rounded?: boolean;
       alt?: string;
       to?: RouteLocationRaw;
   }>(), { src: undefined, rounded: false, alt: 'Página inicial', to: '/' });
   ```
2. Aplicar `:alt="props.alt"` na imagem e `:to="props.to"` no `RouterLink`.
3. Mover o `v-if="props.src"` para o `RouterLink`, eliminando o link vazio:
   ```vue
   <RouterLink v-if="props.src" :to="props.to">
       <img :src="props.src" :alt="props.alt" />
   </RouterLink>
   ```
4. Considerar `aria-label` no `RouterLink` para desacoplar o nome do link do texto alternativo da imagem, caso ambos precisem diferir.

## Verificação

- Teste asserindo que `alt` reflete a prop e que o default não é "Image".
- Teste sem `src`, asserindo que nenhum `<a>` é renderizado.
- Teste com `to` customizado, asserindo o destino do `RouterLink`.
- `npx vitest run tests/components/MaxLogo.test.ts`.
