import { describe, it, expect, afterEach } from 'vitest';
import { createApp, h, ref, type App } from 'vue';
import MaxCreditCard from '../../src/components/MaxCreditCard.vue';

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
    hostElement.style.width = '420px';
    hostElement.style.padding = '20px';
    document.body.appendChild(hostElement);

    const reactiveProps = ref({ ...props });

    const app = createApp({
        render() {
            return h(MaxCreditCard, reactiveProps.value);
        }
    });

    activeApp = app;
    app.mount(hostElement);

    // Aguarda carregamento assíncrono dos assets SVG e renderização
    await waitTicks(20);

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

    it('snapshot visual estrutural determinístico: geometrias, viewBox e posicionamento de elementos', async () => {
        const { host } = await mountCreditCard({
            cardType: 'visa',
            number: '4111 2222 3333 4444',
            name: 'JOAO SILVA',
            date: '08/30',
            cvv: '999',
            side: 'front'
        });

        const frontSvg = host.querySelector('.flip-card-front svg') as SVGSVGElement;
        expect(frontSvg).not.toBeNull();
        expect(frontSvg.getAttribute('viewBox')).toBe('0 0 700 430');

        // Snapshot determinístico das tags e atributos visuais essenciais
        const images = Array.from(frontSvg.querySelectorAll('image')).map((img) => ({
            x: img.getAttribute('x'),
            y: img.getAttribute('y'),
            width: img.getAttribute('width'),
            height: img.getAttribute('height')
        }));

        expect(images).toEqual([
            { x: '0', y: '0', width: '700', height: '430' }, // fundo ocupa 100% (viewBox 700x430)
            { x: '540', y: '320', width: '138', height: '92' } // bandeira
        ]);

        const texts = Array.from(frontSvg.querySelectorAll('text')).map((t) => ({
            class: t.getAttribute('class'),
            x: t.getAttribute('x'),
            y: t.getAttribute('y')
        }));

        expect(texts).toEqual([
            { class: 'credit-card-number', x: '105', y: '270' },
            { class: 'credit-card-name', x: '35', y: '340' },
            { class: 'credit-card-date', x: '35', y: '380' }
        ]);
    });

    it('renderização gráfica real em Canvas: comprova rasterização de pixels válidos no Chromium', async () => {
        const { host } = await mountCreditCard({
            cardType: 'visa',
            number: '4111 2222 3333 4444'
        });

        const brandImage = host.querySelectorAll('.flip-card-front svg image')[1] as SVGImageElement;
        const href = brandImage.getAttribute('href') || brandImage.getAttribute('xlink:href');
        expect(href).toBeTruthy();

        // Carrega a Data URI em uma imagem HTML e renderiza no canvas
        const img = new Image();
        img.src = href!;
        await img.decode();

        const canvas = document.createElement('canvas');
        canvas.width = 138;
        canvas.height = 92;
        const ctx = canvas.getContext('2d');
        expect(ctx).not.toBeNull();

        ctx!.drawImage(img, 0, 0, 138, 92);
        const imageData = ctx!.getImageData(0, 0, 138, 92);

        // Comprova que o canvas não está em branco (há pixels com opacidade > 0)
        let nonZeroPixels = 0;
        for (let i = 3; i < imageData.data.length; i += 4) if (imageData.data[i] > 0) nonZeroPixels++;

        expect(nonZeroPixels, 'A imagem renderizada da bandeira deve conter pixels não vazios').toBeGreaterThan(100);
    });
});
