# Plano 36 — `src/prime/index.ts` (~110 re-exports)

| | |
|---|---|
| **id** | 36 |
| **Arquivo** | `src/prime/index.ts` |
| **Primitivas eliminadas** | ~110 re-exports diretos do PrimeVue |
| **Depende de** | 35 (`MaxStyle`) |

🛑 **NÃO EXECUTE ESTE ITEM SEM CONFIRMAÇÃO EXPLÍCITA DO USUÁRIO.**

Este é o único item da migração que exige uma **decisão de produto**, não técnica.

---

## 1. O problema

`src/prime/index.ts` re-exporta ~110 componentes crus do PrimeVue e é publicado como um
**entry point próprio** do pacote:

```json
"./prime": {
    "types": "./dist/prime/index.d.ts",
    "import": "./dist/prime.es.js"
}
```

O próprio arquivo declara o propósito:

> *"ESTE ARQUIVO CONTÉM OS COMPONENTES DO PRIME VUE QUE NÃO EXISTEM NO MAX COMPONENTS UI…
> PARA SEREM ACESSADOS COMO SE FOSSEM DO MAX COMPONENTS UI"*

Ou seja: apps consumidoras fazem `import { Dialog, Stepper, Tabs } from
'@maxvue/max-components-ui/prime'` para usar componentes que a lib Max não tem.

**Remover este arquivo quebra todas essas apps.** E manter o arquivo significa manter a
dependência do PrimeVue — o oposto do objetivo da migração.

Nenhuma escolha técnica resolve isso. É o usuário quem decide.

---

## 2. Levantamento (faça e apresente ao usuário)

```bash
# Quantos e quais componentes são re-exportados
grep -c "export" src/prime/index.ts
grep -o "as [A-Za-z]*" src/prime/index.ts | sed 's/as //' | sort

# Alguém neste repositório usa?
grep -rn "from '.*prime'" src/ playground/ tests/
```

E, **fora deste repositório**, nas apps consumidoras:

```bash
grep -rn "max-components-ui/prime" ~/GitHub/ --include="*.vue" --include="*.ts" 2>/dev/null
```

Monte a lista dos componentes **efetivamente importados** por alguma app. Essa lista é o
insumo da decisão.

---

## 3. Opções a apresentar

### Opção A — Remover o entry `./prime`
- ✅ Independência total e imediata do PrimeVue.
- ❌ **Breaking change**. Exige `major` semver e migração de todas as apps consumidoras.
- Adequado se o levantamento mostrar que **nada** é realmente importado.

### Opção B — Manter o entry, mas o PrimeVue vira `peerDependency` opcional
- ✅ A lib Max fica independente; quem quiser os extras instala o PrimeVue por conta.
- ✅ Sem breaking change para quem já tem PrimeVue instalado.
- ❌ O PrimeVue 5 não será open source — a saída é adiada, não resolvida.
- Adequado como **passo intermediário**.

### Opção C — Reimplementar os componentes efetivamente usados
- ✅ Independência real, sem breaking change para o que importa.
- ❌ Esforço proporcional à lista do levantamento. Se forem 5 componentes, é viável; se
  forem 40, é outro projeto inteiro.
- Adequado se o levantamento mostrar uma lista curta.

### Opção D — Congelar: copiar o código dos componentes usados para dentro do repo
- ✅ Independência do **pacote**; funciona hoje.
- ❌ Assume a manutenção do código copiado.
- ⚠️ **Verificar a licença.** O PrimeVue 4 é MIT (permite cópia com atribuição), mas isso
  precisa ser confirmado e a atribuição preservada. Não faça isso sem checar o `LICENSE`
  do pacote instalado.

---

## 4. Protocolo do executor

1. Rode o levantamento da seção 2;
2. **Pare a execução deste item**;
3. Apresente ao usuário: a lista de componentes usados + as quatro opções + sua
   recomendação com justificativa;
4. Marque em `notas`: `AGUARDANDO DECISÃO DO USUÁRIO — ver plano 36`;
5. **Siga para o próximo item da fila** — não bloqueie a migração inteira esperando;
6. Ao final da sessão, reporte este item como pendente de decisão.

> Se o usuário já tiver decidido em conversa anterior, registre a decisão em `notas` e
> execute a opção escolhida.

---

## 5. Checklist

- [ ] Levantamento executado e lista de componentes usados montada
- [ ] As quatro opções apresentadas ao usuário com recomendação
- [ ] Decisão registrada em `notas` (ou marcado como pendente)
- [ ] Execução só após decisão explícita
