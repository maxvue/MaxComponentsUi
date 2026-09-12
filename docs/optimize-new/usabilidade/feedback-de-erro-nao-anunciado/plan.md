# Plano de implementação

## Objetivo e resultado esperado

Fazer erros de autenticação e falhas de cópia serem anunciados uma vez, permanecerem disponíveis e oferecerem recuperação operável, sem duplicar live regions já fornecidas por `InputBase`.

## Escopo e fora de escopo

- Em escopo: erro global/campo de `MaxAuthCard` e ação “Copiar” de `MaxToast`.
- Fora de escopo: upload, política global de duração dos toasts e validação de todos os inputs.

## Arquivos a alterar/criar

- `src/components/MaxAuthCard.vue`
- `src/components/MaxToast.vue`
- `tests/components/MaxAuthCard.test.ts`
- `tests/components/MaxToast.test.ts`

## Dependências e ordem

1. Modelar IDs e destinos do erro de autenticação.
2. Implementar estado de sucesso/falha da cópia.
3. Cobrir anúncio, persistência e recuperação.

## Passos de implementação

1. Criar ID estável para o erro do AuthCard e renderizar uma única região `role="alert"`, `aria-atomic="true"` apenas quando a mensagem mudar/aparecer.
2. Associar o erro ao controle pertinente por `aria-describedby`; quando o erro não puder ser atribuído a um campo, associá-lo ao grupo/formulário e mover foco somente após submissão inválida, nunca em atualização passiva.
3. Evitar anunciar a mesma mensagem simultaneamente no AuthCard e no `InputBase`; definir um único proprietário do feedback por fluxo.
4. No Toast, representar cópia como estados idle/success/error por item e expor sucesso com `role="status"` discreto.
5. Em rejeição ou indisponibilidade da Clipboard API, exibir mensagem persistente `role="alert"`, botão “Tentar novamente” e campo readonly com o texto selecionável para cópia manual.
6. Pausar remoção automática enquanto a recuperação estiver ativa e limpar timers/estado quando o toast for removido ou o componente desmontar.

## Migração e compatibilidade

Preservar props, emits e store. A UI de recuperação só aparece em falha. Se necessário, adicionar prop optativa para personalizar rótulos, com defaults pt-BR, sem alterar chamadas existentes.

## Testes

- Unitários: erro aparece/desaparece e mantém ID; clipboard resolve, rejeita e inexiste; retry e cópia manual.
- Integração: vínculo `aria-describedby` nos fluxos senha, telefone e OTP; remoção do toast limpa estado/timer.
- Acessibilidade: uma região urgente por falha, nomes dos controles e operação completa por teclado.

## Critérios de aceite mensuráveis

- Cada nova falha é anunciada exatamente uma vez e continua visível até resolução/ação.
- Erros de campo referenciam ID existente; erros gerais identificam o fluxo.
- Falha de clipboard nunca é silenciosa e sempre oferece retry e texto selecionável.
- Suítes de AuthCard e Toast passam sem timers pendentes.

## Riscos e rollback

Live regions duplicadas podem causar anúncio repetido e pausar toast pode alterar expectativa temporal. Mitigar com proprietário único e testes com fake timers. Rollback pode desativar a pausa mantendo o alerta e a alternativa manual.

## Validação final

Executar testes focados com fake timers/clipboard, lint/typecheck e teste manual com leitor de tela nos três fluxos do AuthCard e nos estados de cópia.
