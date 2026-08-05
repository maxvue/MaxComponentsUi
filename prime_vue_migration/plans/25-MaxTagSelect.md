# Plano 25 — `MaxTagSelect` (substitui `primevue/select`)

| | |
|---|---|
| **id** | 25 |
| **Arquivo** | `src/components/MaxTagSelect.vue` |
| **Primitiva eliminada** | `Select` |
| **Depende de** | 23 (`MaxInputSelect`) |
| **Teste existente** | nenhum — **criar do zero** |

⚠️ **Sem rede de segurança.** Não há teste existente para este componente. Escreva o
teste **antes** de migrar (capturando o comportamento atual) para ter um baseline real
de regressão.

---

## 1. Levantamento obrigatório

Antes de mudar qualquer coisa:

```bash
sed -n '1,80p' src/components/MaxTagSelect.vue    # template
grep -rn "MaxTagSelect" src/ playground/          # consumidores
```

Registre em `notas`:
- é seleção múltipla (tags acumuladas) ou única?
- as tags são removíveis individualmente?
- permite criar tag nova digitando (free-solo)?
- quais props/slots/eventos o componente expõe?

---

## 2. Estratégia

O `Select` do PrimeVue aqui é usado como o dropdown de escolha; as tags selecionadas
são renderizadas pelo próprio `MaxTagSelect`. Verifique também
`src/components/MaxTagsList.vue` — se ele já renderiza a lista de tags sem PrimeVue,
reuse-o.

Substitua o `Select` por:
- **`MaxInputSelect`** se a estrutura de `InputBase` for compatível; ou
- **`MaxBaseOverlay` + lista própria** se o `MaxTagSelect` já tem seu próprio `InputBase`
  (evita aninhamento).

Registre a decisão.

---

## 3. Pontos de atenção

- **Não mute o array de tags recebido por prop.** Emita sempre um array novo.
- **Tag duplicada**: definir se é bloqueada ou permitida — preserve o comportamento atual.
- **Remoção de tag**: o botão de remover precisa de `aria-label` (ex.: `Remover ${tag}`),
  não apenas um "×" visual.
- **Backspace com input vazio** costuma remover a última tag — se o componente faz isso,
  preserve e teste.

## 4. Teste — `tests/components/MaxTagSelect.test.ts` (criar)

Escreva-o **contra a versão atual com PrimeVue** primeiro, confirme que passa, e só
então migre. Cobertura:

1. renderiza as tags do `modelValue`;
2. abrir o dropdown lista as opções disponíveis;
3. selecionar uma opção adiciona a tag e emite `update:modelValue`;
4. o array original não é mutado;
5. remover uma tag emite o array sem ela;
6. opções já selecionadas não aparecem (ou aparecem marcadas — conforme o atual);
7. `disabled` impede adicionar e remover;
8. botão de remover tem `aria-label`;
9. teclado: navegação e seleção no dropdown;
10. comportamento de duplicata conforme o atual.

## 5. Checklist

- [ ] Levantamento da seção 1 registrado em `notas`
- [ ] **Teste criado e passando ANTES da migração** (baseline)
- [ ] Sem PrimeVue após a migração
- [ ] Mesmo teste passa depois, sem enfraquecimento
- [ ] Array não mutado
- [ ] `aria-label` nos botões de remoção
- [ ] `type-check`, `lint`, `test` OK
