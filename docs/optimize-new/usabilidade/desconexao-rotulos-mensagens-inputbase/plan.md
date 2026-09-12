# Plano de implementação — conectar InputBase ao controle real

## Objetivo e resultado

Garantir que os 25 consumidores apliquem ID, nome, descrição, invalidade, obrigatoriedade e attrs nativos ao elemento operável, deixando layout attrs na raiz. Labels devem focar o controle e mensagens ser anunciadas.

## Escopo e arquivos

- Alterar `src/components/InputBase.vue` e `tests/components/InputBase.test.ts`.
- Alterar os consumidores encontrados por `rg '<InputBase' src/components` e seus testes por família.
- Criar helper/tipos para separar `controlAttrs`/`rootAttrs`, se necessário.
- Não alterar associação própria de Radio/Checkbox que já seja correta.

## Fora de escopo

Não redesenhar a aparência dos inputs, alterar validação de domínio ou substituir associações nativas já corretas de checkbox/radio.

## Dependências e ordem

1. Definir contrato de slot/attrs e testes de integração.
2. Migrar Text/Number/máscaras.
3. Migrar compostos Phone/Date/AutoComplete/Select/Chips/OTP/Switch/Markdown.
4. Ativar inventário arquitetural.
5. Coordenar com contrato combobox/disabled.

## Passos

1. Fazer InputBase expor `inputId`, `messageId`, `ariaDescribedby`, `ariaInvalid` e `ariaRequired`; mensagem só entra em describedby quando relevante/existente.
2. Em consumidores usar slot com escopo explícito e aplicar valores no dono do foco/papel.
3. Adotar `inheritAttrs:false` onde fallthrough cai no wrapper e classificar attrs: `name`, `autocomplete`, `maxlength`, `disabled`, `required`, `inputmode` e `aria-*` vão ao controle; class/style/layout ficam na raiz.
4. Evitar sobrescrever `aria-describedby` do consumidor: mesclar IDs.
5. Em controles compostos escolher um único owner e associar label a ele.
6. Corrigir Toggle/Phone para propagar disabled/required/name ao input nativo correto.
7. Teste arquitetural exige consumo dos slot props ou associação nativa comprovada.

## Migração e testes

DOM attrs mudam de wrapper para controle, correção intencional. Classes/props/emits ficam. Testes unitários por família e integração final verificam clique no label, IDs únicos, describedby, invalid/required e attrs; axe/leitor cobre erro/ajuda. Benchmark não se aplica.

## Aceite

100% dos consumidores têm associação válida; label foca; erro/ajuda são descritos; aria-invalid/required e attrs nativos estão no owner; nenhuma duplicação de ID em múltiplas instâncias.

## Riscos e rollback

Mover class/style indevidamente quebra layout; usar allowlist semântica e testes. Attr duplicado em wrapper/controle pode confundir; remover origem antiga. Rollback por família com gate indicando pendência, não reverter o contrato base.

## Validação final

Inventário dos 25, testes por família/axe, formulário nativo (submit/autofill), suíte, type-check, lint e `git diff --check`.
