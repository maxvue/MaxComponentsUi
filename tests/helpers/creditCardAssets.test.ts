import { describe, it, expect, beforeEach } from 'vitest';
import {
    resolveCanonicalCardBrand,
    resolveCanonicalCardType,
    resolveCanonicalAssetKey,
    loadCardBrandUri,
    loadCardBackgroundUri,
    isCardBrandCached,
    isCardBackgroundCached,
    clearCardAssetsCache,
    _setBrandLoaderForTest,
    _setBackgroundLoaderForTest
} from '../../src/helpers/creditCardAssets';

describe('creditCardAssets helper', () => {
    beforeEach(() => {
        clearCardAssetsCache();
    });

    describe('resolução canônica de marcas e aliases', () => {
        it('resolve nomes canônicos diretamente', () => {
            expect(resolveCanonicalCardBrand('amex')).toBe('amex');
            expect(resolveCanonicalCardBrand('diners')).toBe('diners');
            expect(resolveCanonicalCardBrand('discover')).toBe('discover');
            expect(resolveCanonicalCardBrand('elo')).toBe('elo');
            expect(resolveCanonicalCardBrand('hipercard')).toBe('hipercard');
            expect(resolveCanonicalCardBrand('jcb')).toBe('jcb');
            expect(resolveCanonicalCardBrand('maestro')).toBe('maestro');
            expect(resolveCanonicalCardBrand('mastercard')).toBe('mastercard');
            expect(resolveCanonicalCardBrand('visa')).toBe('visa');
        });

        it('resolve aliases sem prefixo card-', () => {
            expect(resolveCanonicalCardBrand('american-express')).toBe('amex');
            expect(resolveCanonicalCardBrand('diners-club')).toBe('diners');
            expect(resolveCanonicalCardBrand('hiper')).toBe('hipercard');
            expect(resolveCanonicalCardBrand('discovery')).toBe('discover');
        });

        it('resolve aliases deduplicados com prefixo card-', () => {
            expect(resolveCanonicalCardBrand('card-american-express')).toBe('amex');
            expect(resolveCanonicalCardBrand('card-amex')).toBe('amex');
            expect(resolveCanonicalCardBrand('card-diners-club')).toBe('diners');
            expect(resolveCanonicalCardBrand('card-diners')).toBe('diners');
            expect(resolveCanonicalCardBrand('card-hiper')).toBe('hipercard');
            expect(resolveCanonicalCardBrand('card-hipercard')).toBe('hipercard');
            expect(resolveCanonicalCardBrand('card-discover')).toBe('discover');
            expect(resolveCanonicalCardBrand('card-discovery')).toBe('discover');
            expect(resolveCanonicalCardBrand('card-elo')).toBe('elo');
            expect(resolveCanonicalCardBrand('card-jcb')).toBe('jcb');
            expect(resolveCanonicalCardBrand('card-maestro')).toBe('maestro');
            expect(resolveCanonicalCardBrand('card-mastercard')).toBe('mastercard');
            expect(resolveCanonicalCardBrand('card-visa')).toBe('visa');
        });

        it('trata maiúsculas e espaços em branco', () => {
            expect(resolveCanonicalCardBrand('  VISA  ')).toBe('visa');
            expect(resolveCanonicalCardBrand('American-Express')).toBe('amex');
            expect(resolveCanonicalCardBrand('CARD-DINERS-CLUB')).toBe('diners');
        });

        it('retorna null para valores nulos, vazios ou desconhecidos', () => {
            expect(resolveCanonicalCardBrand(null)).toBeNull();
            expect(resolveCanonicalCardBrand(undefined)).toBeNull();
            expect(resolveCanonicalCardBrand('')).toBeNull();
            expect(resolveCanonicalCardBrand('   ')).toBeNull();
            expect(resolveCanonicalCardBrand('desconhecido')).toBeNull();
            expect(resolveCanonicalCardType('invalido')).toBeNull();
        });

        it('resolveCanonicalAssetKey mapeia aliases para o asset canônico correspondente', () => {
            expect(resolveCanonicalAssetKey('card-american-express')).toBe('card-amex');
            expect(resolveCanonicalAssetKey('american-express')).toBe('card-amex');
            expect(resolveCanonicalAssetKey('amex')).toBe('card-amex');
            expect(resolveCanonicalAssetKey('card-diners-club')).toBe('card-diners');
            expect(resolveCanonicalAssetKey('diners-club')).toBe('card-diners');
            expect(resolveCanonicalAssetKey('card-hiper')).toBe('card-hipercard');
            expect(resolveCanonicalAssetKey('hiper')).toBe('card-hipercard');
            expect(resolveCanonicalAssetKey('visa')).toBe('card-visa');
            expect(resolveCanonicalAssetKey('invalido')).toBeNull();
        });
    });

    describe('carregamento assíncrono e cache de imagens de fundo', () => {
        it('carrega o fundo frontal com Data URI válida e aplica cache de Promise', async () => {
            expect(isCardBackgroundCached('front')).toBe(false);

            const promise1 = loadCardBackgroundUri('front');
            expect(isCardBackgroundCached('front')).toBe(true);

            const uri1 = await promise1;
            expect(uri1).toMatch(/^data:image\/svg\+xml;base64,/);

            // Segunda chamada deve retornar a mesma Promise em cache
            const promise2 = loadCardBackgroundUri('front');
            expect(promise2).toBe(promise1);

            const uri2 = await promise2;
            expect(uri2).toBe(uri1);
        });

        it('carrega o verso com Data URI válida para rear e back', async () => {
            const uriRear = await loadCardBackgroundUri('rear');
            expect(uriRear).toMatch(/^data:image\/svg\+xml;base64,/);

            // 'back' resolve para o mesmo asset canônico 'rear'
            const uriBack = await loadCardBackgroundUri('back');
            expect(uriBack).toBe(uriRear);
        });

        it('trata falha de carregamento de fundo graciosamente sem rejeição', async () => {
            _setBackgroundLoaderForTest('front', () => Promise.reject(new Error('Falha no chunk de fundo')));

            const uri = await loadCardBackgroundUri('front');
            expect(uri).toBeNull();
            // Deve remover do cache após erro para permitir retry
            expect(isCardBackgroundCached('front')).toBe(false);
        });
    });

    describe('carregamento assíncrono e cache de bandeiras', () => {
        it('carrega a bandeira Visa sob demanda e armazena em cache', async () => {
            expect(isCardBrandCached('visa')).toBe(false);

            const promise1 = loadCardBrandUri('visa');
            expect(isCardBrandCached('visa')).toBe(true);

            const uri1 = await promise1;
            expect(uri1).toMatch(/^data:image\/svg\+xml;base64,/);

            const promise2 = loadCardBrandUri('visa');
            expect(promise2).toBe(promise1);

            const uri2 = await promise2;
            expect(uri2).toBe(uri1);
        });

        it('aliases compartilham a mesma Promise e cache do canônico', async () => {
            const promiseAmex = loadCardBrandUri('amex');
            const promiseAlias = loadCardBrandUri('american-express');
            const promiseCardAlias = loadCardBrandUri('card-american-express');

            expect(promiseAlias).toBe(promiseAmex);
            expect(promiseCardAlias).toBe(promiseAmex);

            const [uriAmex, uriAlias, uriCardAlias] = await Promise.all([
                promiseAmex,
                promiseAlias,
                promiseCardAlias
            ]);

            expect(uriAlias).toBe(uriAmex);
            expect(uriCardAlias).toBe(uriAmex);
        });

        it('retorna null para bandeira nula ou inexistente', async () => {
            const uriNull = await loadCardBrandUri(null);
            expect(uriNull).toBeNull();

            const uriDesconhecida = await loadCardBrandUri('inexistente');
            expect(uriDesconhecida).toBeNull();
        });

        it('trata falha de carregamento do chunk de bandeira graciosamente', async () => {
            _setBrandLoaderForTest('mastercard', () => Promise.reject(new Error('Falha de rede ao carregar chunk')));

            const uri = await loadCardBrandUri('mastercard');
            expect(uri).toBeNull();
            expect(isCardBrandCached('mastercard')).toBe(false);
        });

        it('clearCardAssetsCache esvazia o cache e limpa loaders injetados', async () => {
            await loadCardBrandUri('visa');
            await loadCardBackgroundUri('front');

            expect(isCardBrandCached('visa')).toBe(true);
            expect(isCardBackgroundCached('front')).toBe(true);

            clearCardAssetsCache();

            expect(isCardBrandCached('visa')).toBe(false);
            expect(isCardBackgroundCached('front')).toBe(false);
        });
    });
});
