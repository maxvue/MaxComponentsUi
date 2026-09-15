import { describe, it, expect, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import { createApp, h, ref, type App } from 'vue';
import MaxCreditCard from '../../src/components/MaxCreditCard.vue';
import { installBrowserTestApp } from './bootstrap';

let activeApp: App | null = null;
let hostElement: HTMLElement | null = null;

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function waitTicks(count = 5): Promise<void> {
    for (let i = 0; i < count; i++) await nextFrame();

}

async function mountCreditCard(props: Record<string, unknown> = {}) {
    if (activeApp) {
        activeApp.unmount();
        activeApp = null;
    }
    if (hostElement) {
        hostElement.remove();
        hostElement = null;
    }

    hostElement = document.createElement('div');
    hostElement.id = 'credit-card-test-host';
    hostElement.dataset.testid = 'max-credit-card-visual';
    hostElement.style.width = '420px';
    hostElement.style.padding = '20px';
    document.body.appendChild(hostElement);

    const reactiveProps = ref({ ...props });

    const app = createApp({
        render() {
            return h(MaxCreditCard, reactiveProps.value);
        }
    });
    installBrowserTestApp(app);

    activeApp = app;
    app.mount(hostElement);

    // Aguarda carregamento assíncrono dos assets SVG e renderização
    await waitTicks(10);

    return {
        host: hostElement,
        props: reactiveProps,
        app
    };
}

afterEach(() => {
    if (activeApp) {
        activeApp.unmount();
        activeApp = null;
    }
    if (hostElement) {
        hostElement.remove();
        hostElement = null;
    }
    document.body.innerHTML = '';
});

describe('MaxCreditCard no Chromium Real (R21 / F27: Integridade e Regressão Visual)', () => {
    it('renderiza frente do cartão com proporção visual estável e SVG de fundo', async () => {
        const { host } = await mountCreditCard({
            number: '4111 2222 3333 4444',
            name: 'MARIA SILVA',
            date: '1228',
            cvv: '123',
            side: 'front'
        });

        const cardContainer = host.querySelector('.max-credit-card') as HTMLElement;
        expect(cardContainer).not.toBeNull();

        const frontSvg = host.querySelector('.flip-card-front svg') as SVGSVGElement;
        expect(frontSvg).not.toBeNull();
        expect(frontSvg.getAttribute('viewBox')).toBe('0 0 700 430');

        // Imagem de fundo do cartão frontal carregada
        const bgImage = frontSvg.querySelector('image') as SVGImageElement;
        expect(bgImage).not.toBeNull();
        const bgHref = bgImage.getAttribute('href') || bgImage.getAttribute('xlink:href');
        expect(bgHref).toMatch(/^data:image\/svg\+xml;base64,/);

        // Textos renderizados no SVG
        const numberText = host.querySelector('.credit-card-number') as SVGTextElement;
        expect(numberText).not.toBeNull();
        expect(numberText.textContent?.replace(/\s+/g, '')).toContain('4111222233334444');

        const nameText = host.querySelector('.credit-card-name') as SVGTextElement;
        expect(nameText).not.toBeNull();
        expect(nameText.textContent).toBe('MARIA SILVA');
    });

    it('renderiza bandeira Visa sob demanda com elemento image no SVG', async () => {
        const { host } = await mountCreditCard({
            cardType: 'visa',
            number: '4111 2222 3333 4444'
        });

        // O segundo elemento <image> no SVG da frente é a bandeira
        const images = host.querySelectorAll('.flip-card-front svg image');
        expect(images.length).toBe(2);

        const brandImage = images[1] as SVGImageElement;
        expect(brandImage.getAttribute('x')).toBe('540');
        expect(brandImage.getAttribute('y')).toBe('320');
        expect(brandImage.getAttribute('width')).toBe('138');
        expect(brandImage.getAttribute('height')).toBe('92');

        const href = brandImage.getAttribute('href') || brandImage.getAttribute('xlink:href');
        expect(href).toMatch(/^data:image\/svg\+xml;base64,/);

        // Referência raster versionada: detecta regressões de layout, crop ou
        // desaparecimento da bandeira que verificações apenas de DOM não veem.
        await expect.element(page.getByTestId('max-credit-card-visual')).toMatchScreenshot('max-credit-card-visa', {
            comparatorName: 'pixelmatch',
            comparatorOptions: {
                allowedMismatchedPixelRatio: 0.001,
                threshold: 0.1
            }
        });
    });

    it('renderiza bandeira JCB otimizada no Chromium sem distorção e com data URI válida', async () => {
        const { host } = await mountCreditCard({
            cardType: 'jcb',
            number: '3528 0000 0000 0000'
        });

        const images = host.querySelectorAll('.flip-card-front svg image');
        expect(images.length).toBe(2);

        const jcbImage = images[1] as SVGImageElement;
        expect(jcbImage).not.toBeNull();
        const href = jcbImage.getAttribute('href') || jcbImage.getAttribute('xlink:href');
        expect(href).toMatch(/^data:image\/svg\+xml;base64,/);

        // Valida que o container da bandeira mantém dimensões e posicionamento corretos
        const width = Number(jcbImage.getAttribute('width'));
        const height = Number(jcbImage.getAttribute('height'));
        expect(width).toBe(138);
        expect(height).toBe(92);
        expect(width / height).toBeCloseTo(138 / 92, 2);
    });

    it('todas as marcas principais renderizam suas respectivas logos no Chromium', async () => {
        const testBrands = ['mastercard', 'amex', 'elo', 'hipercard', 'diners', 'discover', 'maestro'];

        for (const brand of testBrands) {
            const { host } = await mountCreditCard({
                cardType: brand,
                number: '5555 4444 3333 2222'
            });

            const images = host.querySelectorAll('.flip-card-front svg image');
            expect(images.length, `Marca ${brand} deve renderizar fundo e logo`).toBe(2);

            const brandImage = images[1] as SVGImageElement;
            const href = brandImage.getAttribute('href') || brandImage.getAttribute('xlink:href');
            expect(href, `Data URI da marca ${brand} deve ser válida`).toMatch(/^data:image\/svg\+xml;base64,/);
        }
    });

    it('renderiza o verso do cartão ao alternar side para back com efeito flip', async () => {
        const { host, props } = await mountCreditCard({
            number: '4111 2222 3333 4444',
            cvv: '888',
            side: 'front'
        });

        const flipCard = host.querySelector('.flip-card') as HTMLElement;
        expect(flipCard.classList.contains('flip')).toBe(false);

        // Alterna para verso
        props.value = { ...props.value, side: 'back' };
        await waitTicks(5);

        expect(flipCard.classList.contains('flip')).toBe(true);

        const rearSvg = host.querySelector('.flip-card-back svg') as SVGSVGElement;
        expect(rearSvg).not.toBeNull();

        const cvvText = rearSvg.querySelector('.credit-card-cvv') as SVGTextElement;
        expect(cvvText).not.toBeNull();
        expect(cvvText.textContent).toContain('888');
    });

    it('evita race condition visual ao alternar rapidamente entre bandeiras', async () => {
        const { host, props } = await mountCreditCard({
            cardType: 'jcb',
            number: '3528 0000 0000 0000'
        });

        // Alterna rapidamente JCB -> Mastercard -> Visa
        props.value = { ...props.value, cardType: 'mastercard' };
        props.value = { ...props.value, cardType: 'visa' };

        await waitTicks(10);

        const images = host.querySelectorAll('.flip-card-front svg image');
        expect(images.length).toBe(2);

        const brandImage = images[1] as SVGImageElement;
        const href = brandImage.getAttribute('href') || brandImage.getAttribute('xlink:href');
        expect(href).toBeTruthy();
    });
});
