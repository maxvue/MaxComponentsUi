import { describe, it, expect, beforeEach } from 'vitest';
import { getCached } from '../../src/helpers/getCached';
import { setCached } from '../../src/helpers/setCached';

describe('getCached e setCached', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('armazena e recupera um objeto simples', async () => {
        const dados = { nome: 'João', idade: 30 };
        setCached('usuario', dados);

        const resultado = await getCached('usuario');
        expect(resultado).toEqual(dados);
    });

    it('armazena e recupera um array', async () => {
        const lista = [1, 2, 3, 'quatro'];
        setCached('lista', lista);

        const resultado = await getCached('lista');
        expect(resultado).toEqual(lista);
    });

    it('armazena e recupera uma string', async () => {
        setCached('texto', 'Olá mundo');
        const resultado = await getCached('texto');
        expect(resultado).toBe('Olá mundo');
    });

    it('armazena e recupera um número', async () => {
        setCached('numero', 42);
        const resultado = await getCached('numero');
        expect(resultado).toBe(42);
    });

    it('retorna null para key nula no getCached', async () => {
        const resultado = await getCached(null);
        expect(resultado).toBeNull();
    });

    it('não lança erro para key nula no setCached', () => {
        expect(() => setCached(null, 'dados')).not.toThrow();
    });

    it('retorna null para chave inexistente', async () => {
        const resultado = await getCached('chave_inexistente');
        expect(resultado).toBeNull();
    });

    it('retorna null quando o localStorage contém JSON inválido', async () => {
        localStorage.setItem('invalido', 'isso não é json');
        const resultado = await getCached('invalido');
        expect(resultado).toBeNull();
    });

    it('sobrescreve valor existente com setCached', async () => {
        setCached('key', 'valor1');
        setCached('key', 'valor2');

        const resultado = await getCached('key');
        expect(resultado).toBe('valor2');
    });
});
