# Plano de Implementação — Issue #61

## Descrição e Causa Raiz

### Problema
No helper `src/helpers/setCached.ts`, a função `setCached` realiza a serialização de dados via `JSON.stringify` e a gravação no armazenamento local via `localStorage.setItem(key, clean_data)` diretamente no escopo da função, sem nenhum bloco de proteção `try/catch`.

Quando o navegador opera em condições restritivas de armazenamento — tais como:
1. **Estouro de Cota (`QuotaExceededError` / `DOMException` code 22):** Quando o limite de 5MB do `localStorage` da origem é atingido;
2. **Acesso Bloqueado / Restrições de Segurança (`SecurityError` / `DOMException`):** Navegação anônima com bloqueio de cookies/storage (ex.: Safari / Firefox restrito) ou iframes sem permissões `allow-same-origin`;
3. **Estruturas Circulares (`TypeError`):** Passagem de objetos com referências circulares para `JSON.stringify`;
4. **Ambientes SSR / Sem Storage:** Execução em contexto onde `localStorage` não está disponível.

Nesses cenários, `localStorage.setItem` ou `JSON.stringify` dispara uma exceção não tratada (`DOMException` / `TypeError`), que interrompe a execução do fluxo da aplicação consumidora (UI ou rotina de cache), degradando a experiência do usuário.

Em contrapartida, o helper irmão `src/helpers/getCached.ts:4-12` já possui tratamento com `try/catch` e log seguro de erro via `console.error`.

### Causa Raiz Comprovada
- **Localização:** `src/helpers/setCached.ts:1-7`
```typescript
export function setCached(key: string | null, data: any) {
    if (!key) return;
    const data_save = { key: key, data: data };
    const clean_data = JSON.stringify(data_save);
    localStorage.setItem(key, clean_data);
}
```
- **Fluxo Causal:**
  `Caller (Componente / Store / Aplicação)` ➔ `setCached(key, data)` ➔ `JSON.stringify` / `localStorage.setItem` ➔ dispara `DOMException` (ex: cota excedida / security error) ➔ exceção não capturada interrompe o fluxo do chamador.

---

## Arquivos Afetados

1. `src/helpers/setCached.ts` — Adição do bloco `try/catch` para capturar exceções durante serialização e gravação no `localStorage`, registrando o erro via `console.error`.
2. `tests/helpers/cached.test.ts` — Adição de cenários de teste automatizados para validar a resiliência contra `QuotaExceededError`, `SecurityError`, estruturas circulares e validação de não interrupção da execução.

---

## Execuções Propostas

### 1. Atualização do Helper `src/helpers/setCached.ts`
- Envolver a lógica de serialização (`JSON.stringify`) e escrita (`localStorage.setItem`) em um bloco `try/catch`.
- No bloco `catch (error)`, registrar aviso/erro no console utilizando `console.error('Erro ao salvar no localStorage:', error)` de forma análoga ao `getCached.ts:10`.
- Manter o guard clause inicial `if (!key) return;`.
- Manter a assinatura e tipagem da função intactas para garantir 100% de compatibilidade retroativa.

### 2. Atualização da Suíte de Testes `tests/helpers/cached.test.ts`
- Implementar testes com spies do `vi.spyOn(localStorage, 'setItem')`:
  - Teste simulando `DOMException` (`QuotaExceededError`) ao invocar `setCached`.
  - Teste simulando `DOMException` (`SecurityError`) ao invocar `setCached`.
  - Teste passando objeto com referência circular para `setCached` (disparando `TypeError` no `JSON.stringify`).
  - Validar que em nenhum dos casos é lançada exceção (`expect(() => setCached(...)).not.toThrow()`).
  - Validar que `console.error` é acionado quando ocorre a falha de escrita.

---

## Especificação de Teste TDD (Red-Green)

### 1. Etapa Red (Falha Prévia)
Adicionar os seguintes casos de teste em `tests/helpers/cached.test.ts`:
```typescript
it('não lança erro quando localStorage.setItem estoura QuotaExceededError', () => {
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => setCached('chave_teste', 'valor_teste')).not.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith('Erro ao salvar no localStorage:', expect.any(DOMException));

    spy.mockRestore();
    consoleSpy.mockRestore();
});

it('não lança erro quando localStorage.setItem bloqueia com SecurityError', () => {
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new DOMException('The operation is insecure.', 'SecurityError');
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => setCached('chave_teste', 'valor_teste')).not.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith('Erro ao salvar no localStorage:', expect.any(DOMException));

    spy.mockRestore();
    consoleSpy.mockRestore();
});

it('não lança erro quando os dados possuem referência circular', () => {
    const circular: any = {};
    circular.self = circular;
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => setCached('circular_key', circular)).not.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith('Erro ao salvar no localStorage:', expect.any(TypeError));

    consoleSpy.mockRestore();
});
```
*Execução Red:* No código atual sem `try/catch`, os três testes falham com exceções não capturadas.

### 2. Etapa Green (Sucesso Pós-Correção)
Implementar a proteção em `src/helpers/setCached.ts`:
```typescript
export function setCached(key: string | null, data: any) {
    if (!key) return;

    try {
        const data_save = { key: key, data: data };
        const clean_data = JSON.stringify(data_save);
        localStorage.setItem(key, clean_data);
    } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
    }
}
```
*Execução Green:* Todos os testes passam sem lançar erros, registrando o log apropriado.

---

## Banco de Dados

- **Nenhuma** migration necessária (alteração restrita a helper de cache de frontend).

---

## Riscos de Quebra e Não-Regressão

- **Contrato da Função:** A assinatura `setCached(key: string | null, data: any): void` permanece inalterada.
- **Efeitos Colaterais:** Nenhum efeito colateral adverso em chamadores; chamadores que antes quebravam em ambientes restritos agora degradam graciosamente sem travar a interface.
- **Não-Regressão:** Todos os 9 testes existentes em `tests/helpers/cached.test.ts` e suítes correlatas (`useIconStore`, `maxCacheKeys`) devem continuar passando normalmente.

---

## Validação

- Execução dos testes unitários do helper:
  ```bash
  npx vitest run tests/helpers/cached.test.ts
  ```
- Verificação de tipagem TypeScript:
  ```bash
  npm run type-check
  ```
- Verificação de estilo e linting:
  ```bash
  npm run lint
  ```

---

## Skills Aplicáveis

- `systematic-debugging-best-practices`
- `planning-with-files`
- `vue-debugging-best-practices`
- `tdd`
- `code-review`
- `production-code-audit`
