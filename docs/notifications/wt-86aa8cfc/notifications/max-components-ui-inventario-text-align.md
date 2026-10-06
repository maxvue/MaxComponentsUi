# Inventário de dependências não inclui TextAlign

Data: 06/10/2026. Worktree: `wt-86aa8cfc`.
Classificação: divergência documental fora do escopo da correção de versões Tiptap.

## Localização e evidência

- `docs/DEPENDENCIES.md:19–45`: a matriz de dependências de produção lista extensões Tiptap, mas não contém `@tiptap/extension-text-align`.
- `package.json:601`: o pacote está declarado como dependência direta.
- `src/components/MaxInputHtml.vue:75` e configuração do editor em `:336–352`: o componente importa e utiliza TextAlign customizado.

## Impacto

O inventário que se apresenta como fonte de verdade está incompleto e pode induzir revisão ou manutenção de dependências a ignorar uma extensão necessária ao editor HTML. Isso não prova falha de runtime e não é a causa do deploy bloqueado: a causa demonstrada são requisitos flutuantes no manifesto.

## Encaminhamento

Em manutenção documental separada, incluir a dependência na matriz e indicar seu uso no editor HTML. Não modificar comportamento, versão-alvo nem gate do consumidor para resolver esta divergência. Nenhuma correção desse documento foi executada nesta sessão.
