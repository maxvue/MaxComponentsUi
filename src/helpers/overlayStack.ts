/**
 * Estado global de sobreposições, compartilhado por todas as instâncias de
 * MaxBaseOverlay. Substitui o ZIndexUtils do PrimeVue.
 *
 * Precisa viver num módulo: variáveis declaradas dentro de `<script setup>` são
 * compiladas para o corpo de `setup()` e portanto existem uma vez POR INSTÂNCIA —
 * um contador ali dentro daria o mesmo z-index a dois overlays simultâneos.
 */

/** Base acima do tema; cada overlay aberto recebe o próximo valor. */
const Z_INDEX_BASE = 1000;

let zIndexCounter = Z_INDEX_BASE;

/** Aloca um z-index novo. Chame UMA vez por abertura, nunca a cada reposicionamento. */
export const nextZIndex = (): number => ++zIndexCounter;

/**
 * Pilha de overlays abertos, do mais antigo ao mais recente. Serve para que teclas
 * globais (ESC) sejam tratadas apenas pelo overlay do topo — sem isto, em overlays
 * aninhados o listener registrado primeiro (o de baixo) consome o evento.
 */
const stack: symbol[] = [];

export const pushOverlay = (id: symbol): void => {
    if (!stack.includes(id)) stack.push(id);
};

export const removeOverlay = (id: symbol): void => {
    const index = stack.indexOf(id);
    if (index !== -1) stack.splice(index, 1);
};

/** true quando o overlay é o mais recente aberto (o topo visual da pilha). */
export const isTopOverlay = (id: symbol): boolean => stack[stack.length - 1] === id;

/**
 * Trava de scroll do body com contagem de referências.
 *
 * Precisa ser global e contada: com dois overlays modais abertos, um lock por
 * instância faria o primeiro a fechar destravar o body com o segundo ainda aberto —
 * e, pior, o segundo teria guardado 'hidden' como "valor anterior" e o restauraria
 * ao fechar, deixando a página sem scroll permanentemente.
 */
let scrollLockCount = 0;

/**
 * Valor de `body.style.overflow` antes da primeira trava. String vazia é um valor
 * legítimo (o body não tinha a propriedade inline) e deve ser restaurada como tal —
 * por isso o tipo não é anulável.
 */
let previousBodyOverflow = '';

export const lockBodyScroll = (): void => {
    if (scrollLockCount === 0) {
        // Guarda o valor original só na primeira trava; não assuma que era 'visible'.
        previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
    }
    scrollLockCount++;
};

export const unlockBodyScroll = (): void => {
    if (scrollLockCount === 0) return;

    scrollLockCount--;
    if (scrollLockCount > 0) return;

    document.body.style.overflow = previousBodyOverflow;
    previousBodyOverflow = '';
};

/**
 * Devolve o estado inicial.
 * @internal Exclusivo de testes — nenhum caminho de produção deve chamar.
 */
export const resetOverlayStack = (): void => {
    stack.length = 0;
    zIndexCounter = Z_INDEX_BASE;
    scrollLockCount = 0;
    previousBodyOverflow = '';
};
