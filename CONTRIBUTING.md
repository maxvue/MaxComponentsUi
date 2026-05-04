# Guia de Contribuição

Contribuições são fundamentais para manter esta biblioteca robusta e útil. Siga estas diretrizes ao adicionar ou modificar componentes.

## Adicionando Novos Componentes

1. **Localização:** Crie o arquivo `.vue` na pasta `src/components/`.
2. **Base:** Sempre que possível, utilize o componente `InputBase` como wrapper para garantir consistência visual e de comportamento.
3. **TypeScript:** Utilize `<script setup lang="ts">` e defina props utilizando interfaces para melhor tipagem.
4. **Exportação:** Adicione a exportação do novo componente no arquivo `src/index.ts`.
5. **Estilos:** Utilize o UnoCSS (via `virtual:uno.css`) ou SCSS seguindo o padrão de variáveis CSS do tema Max.

## Padrão de Documentação

Todos os componentes devem incluir comentários TSDoc para facilitar o uso por outros desenvolvedores.

```typescript
/**
 * Descrição curta do propósito do componente.
 */
<script setup lang="ts">
  const props = defineProps<{
    /** Descrição da propriedade */
    minhaProp: string;
  }>();
</script>
```

## Processo de Desenvolvimento

1. Instale as dependências: `npm install`
2. Rode o playground para testar: `npm run dev:playground`
3. Verifique a tipagem: `npm run type-check`
4. Gere o build final: `npm run build`

## Publicação

A publicação é feita automaticamente via script de `postbuild` ao rodar o build na branch `main`. Certifique-se de que todas as alterações foram testadas e a tipagem está correta.
