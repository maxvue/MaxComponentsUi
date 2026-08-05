export interface ScrollLock {
    lock: () => void;
    unlock: () => void;
}

/**
 * Contador de locks de scroll compartilhado entre TODAS as instancias que
 * consumirem este helper (por isso vive no escopo do modulo, fora de
 * qualquer funcao — modulos ES sao avaliados uma unica vez e cacheados pelo
 * runtime, ao contrario do corpo de um `<script setup>`, que roda de novo a
 * cada instancia de componente).
 *
 * Sem esse compartilhamento, dois overlays (ex.: dois MaxDrawer) com
 * `blockScroll` abertos ao mesmo tempo brigariam pelo
 * `document.body.style.overflow`: fechar um restauraria o scroll da pagina
 * mesmo com o outro ainda aberto e visivel. So restauramos o valor original
 * quando o ultimo lock e liberado (contador chega a 0).
 */
let lock_count = 0;

/** Valor de `overflow` salvo antes do primeiro lock, para restaurar (nao forcar ''). */
let previous_overflow = '';

/**
 * Trava o scroll do `body` de forma cumulativa: cada chamada a `lock()`
 * precisa de uma chamada correspondente a `unlock()` para ser desfeita.
 */
export const useScrollLock = (): ScrollLock => {

    const lock = () => {
        if (lock_count === 0) previous_overflow = document.body.style.overflow;
        lock_count += 1;
        document.body.style.overflow = 'hidden';
    };

    const unlock = () => {
        if (lock_count === 0) return;
        lock_count -= 1;
        if (lock_count === 0) document.body.style.overflow = previous_overflow;
    };

    return { lock, unlock };
};
