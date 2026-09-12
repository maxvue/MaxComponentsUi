# Plano de implementação — atalhos e paste com escopo

## Objetivo e resultado

Preservar Ctrl/Cmd+F nativo por padrão, oferecer atalho de busca configurável e funcional, e tratar colagem telefônica pelo evento `paste` do input em todas as plataformas.

## Escopo e arquivos

- Alterar `MaxTopMenuSearchBar.vue`, `MaxInputText.vue` e `MaxInputPhone.vue`, seus tipos/testes e documentação de atalhos.
- Remover a duplicidade `useMagicKeys` + listener document para busca.
- Não tratar paste global de MaxInputFile, coberto por achado próprio.

## Fora de escopo

Não criar um gerenciador global de atalhos para toda a biblioteca nem tratar a colagem de `MaxInputFile`; o escopo fica nos três componentes citados.

## Dependências e ordem

1. Expor API de foco tipada.
2. Substituir listener de busca por atalho configurável.
3. Migrar telefone para paste nativo.
4. Testar plataformas/targets/unmount.

## Passos

1. Em `MaxInputText`, guardar ref do input e expor `focus`/`setFocus` tipados; teste exige `document.activeElement`.
2. Adicionar prop/config `shortcut` (false para desligar), com default não reservado como `Ctrl/Cmd+K` ou `/`; nunca Ctrl/Cmd+F.
3. Usar um único listener/composable, normalizar Meta/Control, ignorar inputs/textareas/contenteditable salvo quando o alvo for a própria busca, e prevenir default somente quando o atalho configurado for realmente tratado.
4. Remover watcher global redundante e limpar listener no unmount.
5. Expor affordance/`aria-keyshortcuts` coerente quando ativo.
6. Em Phone, remover detecção `ctrl+v` e ouvir `paste` no input; obter `clipboardData`, normalizar número e atualizar máscara/seleção sem depender de modificador.
7. Preservar paste padrão se não houver texto utilizável e cobrir menu de contexto, Cmd+V e evento programático.

## Migração e testes

Quem dependia de Ctrl+F configura-o explicitamente, com aviso de conflito; default muda para não sequestrar navegador. Unitários cobrem foco real, opt-out, editable targets, Ctrl/Meta e cleanup; integração browser cobre atalho desktop/mobile e paste por teclado/menu; a11y verifica `aria-keyshortcuts`. Benchmark não se aplica.

## Aceite

Ctrl/Cmd+F abre busca nativa por padrão; atalho configurado foca input real; false remove captura; paste funciona sem ctrl e no macOS; listeners não duplicam nem sobrevivem ao unmount.

## Riscos e rollback

Atalho novo pode conflitar com app host; torná-lo configurável e escopado. Manipular paste pode mover cursor; testar seleção e formatos internacionais. Rollback desativa atalho customizado por padrão, mantendo método de foco e paste nativo.

## Validação final

Testes dos três componentes, browser em Windows/macOS emulado e targets editáveis, inspeção de listeners, suíte, type-check, lint e `git diff --check`.
