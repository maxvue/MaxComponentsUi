# Plano de implementação

## Objetivo e resultado esperado

Alinhar disponibilidade, rótulo e resultado das ações de OTP e inserção de mídia: controles habilitados sempre produzem efeito ou feedback, e entradas inválidas permanecem disponíveis para correção.

## Escopo e fora de escopo

- Em escopo: CTA dinâmico de `MaxAuthCard` durante cooldown e popovers de link/imagem do Markdown.
- Fora de escopo: transporte do OTP, regras internas de `isSafeUrl`, comandos gerais da toolbar e estilo global de botões.

## Arquivos a alterar/criar

- `src/components/MaxAuthCard.vue`
- `src/components/MaxInputMarkdownToolbar.vue`
- `tests/components/MaxAuthCard.test.ts`
- `tests/components/MaxInputMarkdownToolbar.test.ts`

## Dependências e ordem

1. Modelar indisponibilidade e anúncio do cooldown.
2. Modelar validação/retenção das URLs.
3. Validar microcopy e teclado nos dois fluxos.

## Passos de implementação

1. Derivar estado explícito do CTA de OTP: enviar, verificar, reenviar ou aguardando cooldown; encaminhar `disabled` quando aguardando ou carregando.
2. Manter a contagem perceptível em texto separado `role="status"` com atualização moderada e associá-la ao CTA por `aria-describedby`; evitar anunciar cada segundo se isso gerar ruído.
3. Garantir que Enter no card respeite o mesmo estado do CTA e nunca contorne o cooldown.
4. Nomear os inputs de URL com labels visíveis ou acessíveis (“URL do link”/“URL da imagem”) e trocar “OK” por “Inserir link”/“Inserir imagem”.
5. Separar `apply` em validar e executar: se vazio, seguir o contrato documentado; se inseguro/inválido, manter popover, valor e foco, marcar `aria-invalid` e exibir mensagem associada `role="alert"`.
6. Limpar o erro ao editar ou após sucesso; fechar e devolver foco ao gatilho somente após ação válida, remoção explícita ou Escape.

## Migração e compatibilidade

Preservar props, emits, endpoints e comandos Tiptap. A mudança do CTA para disabled é deliberada; expor contagem fora do label reduz quebra de layout, mantendo os textos configuráveis existentes.

## Testes

- Unitários: CTA disabled no cooldown, habilita ao zerar, Enter não emite; contagem e descrição associadas.
- Integração: URL segura executa/fecha; inválida preserva valor/foco, não executa e mostra erro; Escape cancela.
- Acessibilidade: nomes específicos, `aria-invalid/describedby`, status sem anúncios excessivos e operação por teclado.

## Critérios de aceite mensuráveis

- Nenhum controle habilitado termina em no-op silencioso nos fluxos cobertos.
- Cooldown bloqueia clique e Enter e informa o tempo/causa.
- URL inválida mantém 100% do texto informado e o popover aberto até correção/cancelamento.
- Rótulos dos CTAs descrevem o verbo e objeto da ação.

## Riscos e rollback

Botão disabled deixa de ser focável e contagem por segundo pode ser ruidosa. Manter explicação em status adjacente e anunciar apenas início/fim. Se consumidores exigirem foco contínuo, usar `aria-disabled` com guard e feedback, sem voltar ao no-op silencioso.

## Validação final

Executar as suítes de AuthCard e MarkdownToolbar com fake timers, lint/typecheck e percorrer os dois fluxos somente por teclado.
