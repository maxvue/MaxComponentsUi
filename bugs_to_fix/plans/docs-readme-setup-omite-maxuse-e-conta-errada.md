# `README.md`: instruções de desenvolvimento não funcionam (omitem `../MaxUse`) e contagem de componentes errada

- **Categoria:** documentação
- **Severidade:** alta
- **Arquivo(s):** `README.md:192-196`, `README.md:223`, `CONTRIBUTING.md:11`, `package.json:46-47`
- **Domínio:** docs-qualidade-testes

## Problema

### 1. `npm install` documentado no README não funciona a partir de um clone limpo

A seção "🛠️ Desenvolvimento" do `README.md:192-196` diz:

```bash
# Instalar dependências
npm install
```

Sem nenhuma pré-condição. Mas o `package.json` declara **duas dependências por caminho de
arquivo**:

```json
"@maxvue/max-pinia": "file:../MaxPinia",
"@maxvue/max-use": "file:../MaxUse",
```

Se os repositórios irmãos `../MaxUse` e `../MaxPinia` não estiverem clonados no mesmo
diretório pai, o `npm install` **falha**. Quem seguir apenas o README fica travado sem
saber por quê.

Essa informação existe — mas só no `CONTRIBUTING.md:11`, e ainda assim de forma
**incompleta**, mencionando apenas uma das duas:

> - A biblioteca irmã [`@maxvue/max-use`](https://github.com/maxvue/MaxUse) clonada no mesmo diretório pai (é referenciada via `file:../MaxUse`)

`@maxvue/max-pinia` (`file:../MaxPinia`) não é citado em lugar nenhum da documentação.
O `CLAUDE.md` menciona apenas o `MaxUse`, repetindo a mesma omissão.

Um `grep -n "MaxUse\|max-use\|MaxPinia" README.md` retorna **nenhuma** ocorrência das
dependências locais (o único hit é a palavra `MaxUserAvatar` na linha 149, coincidência
de substring).

### 2. Contagem de componentes errada na estrutura do projeto

`README.md:223` declara:

```
├── components/          # 59 componentes Vue (.vue)
```

O valor real é **101** (`ls src/components/*.vue | wc -l`) — e isso sem contar os quatro
de `src/components/base/`. A documentação está defasada em 42 componentes.

### 3. Descrição das stores incompleta na mesma seção

`README.md:229` descreve o diretório de stores como:

```
├── stores/              # Pinia stores (ícones, popover, modal, confirm)
```

São **12** stores em `src/stores/` (`useIcon`, `useLoading`, `useUser`, `useSystem`,
`useLogin`, `useSearchBar`, `useListMenus`, `useTopToolbar`, `usePopover`, `useToast`,
`useConfirm`, `useModal`), todas exportadas pelo barrel `src/stores/index.ts:1-12`.
A lista do README cita 4.

## Impacto

- **Bloqueio total de onboarding:** o primeiro comando da seção de desenvolvimento falha,
  com uma mensagem de erro do npm que não explica a causa raiz (caminho `file:` não
  resolvido). É o pior lugar possível para um erro de documentação.
- **Informação crítica fragmentada:** a pré-condição está no `CONTRIBUTING.md`, arquivo
  que muitos leem só depois de tentar rodar o projeto — e mesmo lá está incompleta.
- **`@maxvue/max-pinia` totalmente invisível:** não aparece no README, no CONTRIBUTING
  nem no CLAUDE.md. Mesmo seguindo o CONTRIBUTING à risca, o `npm install` ainda falha.
- **Perda de confiança na documentação:** "59 componentes" quando há 101 sinaliza que o
  README não é mantido, levando o leitor a desconfiar do resto (incluindo os exemplos de
  uso).

## Plano de correção

1. **Adicionar bloco de pré-requisitos** no início da seção "🛠️ Desenvolvimento" do
   `README.md` (antes da linha 192), explicitando as duas dependências locais e a
   estrutura de diretórios esperada:
   ```bash
   # Pré-requisito: os repositórios irmãos devem estar clonados no mesmo diretório pai
   # <pai>/
   # ├── MaxComponentsUi   (este repositório)
   # ├── MaxUse            (file:../MaxUse)
   # └── MaxPinia          (file:../MaxPinia)
   ```
   com os comandos `git clone` correspondentes.
2. **Completar o `CONTRIBUTING.md:11`** incluindo `@maxvue/max-pinia` (`file:../MaxPinia`)
   ao lado do `@maxvue/max-use`.
3. **Completar o `CLAUDE.md`**, que hoje só cita o `MaxUse`, para mencionar também o
   `MaxPinia` — caso contrário todo agente que tentar preparar o ambiente vai falhar.
4. **Corrigir os números do `README.md:223`** para a contagem real, e — como qualquer
   número fixo volta a envelhecer — preferir uma descrição não numérica
   (ex.: `# Componentes Vue (.vue) — ver COMPONENTS.md`).
5. **Corrigir a descrição das stores (`README.md:229`)** para refletir as 12 existentes ou
   apontar para `docs/STORES.md` em vez de listar um subconjunto.
6. **Validar o fluxo do zero:** clonar os três repositórios em um diretório limpo e
   seguir o README literalmente, sem conhecimento prévio.

## Verificação

- Em uma máquina/diretório limpo, seguir **apenas** o `README.md` leva a um
  `npm install` bem-sucedido, seguido de `npm run type-check` e `npm run test` verdes.
- `grep -n "MaxUse" README.md CONTRIBUTING.md CLAUDE.md` retorna ocorrências nos três.
- `grep -n "MaxPinia" README.md CONTRIBUTING.md CLAUDE.md` retorna ocorrências nos três.
- Nenhum número fixo de componentes/stores no README que contradiga
  `ls src/components/*.vue | wc -l` e `ls src/stores/use*.ts | wc -l`.
