let counter = 0;

/**
 * Gera um ID único incremental para instâncias de componentes.
 */
export const nextInstanceId = (prefix = 'id'): string => `${prefix}-${++counter}`;

/**
 * Reseta o contador de instâncias (útil em suites de testes).
 */
export const resetInstanceIdCounter = (): void => {
    counter = 0;
};
