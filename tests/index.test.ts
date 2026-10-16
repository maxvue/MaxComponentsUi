import { describe, it, expect, vi } from 'vitest';
import { install } from '../src/index';

describe('index install', () => {
    it('deve registrar a diretiva tooltip e não invocar app.use (sem PrimeVue)', () => {
        const app = {
            use: vi.fn(),
            directive: vi.fn()
        };

        install(app as any);

        expect(app.use).not.toHaveBeenCalled();
        expect(app.directive).toHaveBeenCalledWith('tooltip', expect.anything());
    });

    it('exporta MaxStyle e ptBR diretamente', async () => {
        const indexExports = await import('../src/index');
        expect(indexExports.MaxStyle).toBeDefined();
        expect(indexExports.MaxStyle.semantic).toBeDefined();
        expect(indexExports.MaxStyle.semantic.primary).toBeDefined();
        expect(indexExports.ptBR).toBeDefined();
        expect(indexExports.ptBR.accept).toBe('Aceitar');
        expect(indexExports.ptBR.reject).toBe('Cancelar');
        expect(indexExports.ptBR.dayNames).toHaveLength(7);
        expect(indexExports.maxComponentsPtBR).toBeDefined();
        expect(indexExports.maxComponentsPtBR.pdfView.loading).toBe('Carregando PDF');
        expect(indexExports.maxComponentsPtBR.pdfView.progress).toBe('Progresso de carregamento do PDF');
    });

    it('exporta MaxBadgeButtonsGroup e seus aliases', async () => {
        const indexExports = await import('../src/index');
        expect(indexExports.MaxBadgeButtonsGroup).toBeDefined();
        expect(indexExports.MaxBadgeButtonGroup).toBeDefined();
        expect(indexExports.BadgeButtonsGroup).toBeDefined();
        expect(indexExports.BadgeButtonGroup).toBeDefined();
        expect(indexExports.MaxBadgeButtonGroup).toBe(indexExports.MaxBadgeButtonsGroup);
        expect(indexExports.BadgeButtonsGroup).toBe(indexExports.MaxBadgeButtonsGroup);
        expect(indexExports.BadgeButtonGroup).toBe(indexExports.MaxBadgeButtonsGroup);
    });

    it('exporta os dez novos componentes reutilizáveis e seus aliases canônicos', async () => {
        const indexExports = await import('../src/index');

        const pairs: [string, string][] = [
            ['MaxAlert', 'Alert'],
            ['MaxQueryState', 'QueryState'],
            ['MaxFormValidationSummary', 'FormValidationSummary'],
            ['MaxSegmentedControl', 'SegmentedControl'],
            ['MaxPeriodNavigator', 'PeriodNavigator'],
            ['MaxProgressBar', 'ProgressBar'],
            ['MaxFilterBar', 'FilterBar'],
            ['MaxFilePreview', 'FilePreview'],
            ['MaxMarkdownViewer', 'MarkdownViewer'],
            ['MaxCalendar', 'Calendar']
        ];

        for (const [canonical, alias] of pairs) {
            expect((indexExports as any)[canonical]).toBeDefined();
            expect((indexExports as any)[alias]).toBeDefined();
            expect((indexExports as any)[alias]).toBe((indexExports as any)[canonical]);
        }

        expect(indexExports.sanitizeMarkdownHtml).toBeDefined();
        expect(indexExports.isSafeMarkdownUrl).toBeDefined();
        expect(indexExports.escapeHtml).toBeDefined();
    });

    it('exporta os 10 novos inputs de domínio e seus catálogos públicos', async () => {
        const indexExports = await import('../src/index');
        expect(indexExports.MaxInputPhase).toBeDefined();
        expect(indexExports.MaxInputWireSize).toBeDefined();
        expect(indexExports.MaxInputWireType).toBeDefined();
        expect(indexExports.MaxInputAiExecutionType).toBeDefined();
        expect(indexExports.MaxInputAiBillingMode).toBeDefined();
        expect(indexExports.MaxInputAiBillingUnit).toBeDefined();
        expect(indexExports.MaxInputPaymentMethod).toBeDefined();
        expect(indexExports.MaxInputScheduleType).toBeDefined();
        expect(indexExports.MaxInputMonthOccurrence).toBeDefined();
        expect(indexExports.MaxInputContentType).toBeDefined();

        expect(indexExports.PHASE_OPTIONS).toHaveLength(3);
        expect(indexExports.WIRE_SIZE_OPTIONS).toHaveLength(24);
        expect(indexExports.WIRE_TYPE_OPTIONS).toHaveLength(4);
        expect(indexExports.AI_EXECUTION_TYPE_OPTIONS).toHaveLength(2);
        expect(indexExports.AI_BILLING_MODE_OPTIONS).toHaveLength(4);
        expect(indexExports.AI_BILLING_UNIT_OPTIONS).toHaveLength(7);
        expect(indexExports.PAYMENT_METHOD_OPTIONS).toHaveLength(2);
        expect(indexExports.SCHEDULE_TYPE_OPTIONS).toHaveLength(4);
        expect(indexExports.MONTH_OCCURRENCE_OPTIONS).toHaveLength(5);
        expect(indexExports.CONTENT_TYPE_OPTIONS).toHaveLength(5);
    });

    it('exporta os 10 novos inputs semânticos e seus aliases', async () => {
        const indexExports = await import('../src/index');
        const components = [
            ['MaxInputPercent', 'InputPercent'],
            ['MaxInputPower', 'InputPower'],
            ['MaxInputCurrent', 'InputCurrent'],
            ['MaxInputVoltage', 'InputVoltage'],
            ['MaxInputDistance', 'InputDistance'],
            ['MaxInputDuration', 'InputDuration'],
            ['MaxInputTokenLimit', 'InputTokenLimit'],
            ['MaxInputMonthDays', 'InputMonthDays'],
            ['MaxInputWeekInterval', 'InputWeekInterval'],
            ['MaxInputSocialPlatform', 'InputSocialPlatform']
        ];
        for (const [canonical, alias] of components) {
            expect((indexExports as any)[canonical]).toBeDefined();
            expect((indexExports as any)[alias]).toBeDefined();
            expect((indexExports as any)[canonical]).toBe((indexExports as any)[alias]);
        }
    });

    it('exporta os 15 novos inputs especializados e seus catálogos públicos', async () => {
        const indexExports = await import('../src/index');
        const specialized = [
            'MaxInputOccupation',
            'MaxInputFinancingTerm',
            'MaxInputFinancingGracePeriod',
            'MaxInputServicePricingUnit',
            'MaxInputServiceAudience',
            'MaxInputInverterType',
            'MaxInputMonitoringAuthType',
            'MaxInputMonitoringCredentialFlow',
            'MaxInputConsumerUnit',
            'MaxInputAiModelStatus',
            'MaxInputAiPriceItemType',
            'MaxInputAiCacheOperation',
            'MaxInputRagSourceType',
            'MaxInputColorPalette',
            'MaxInputScheduleRules'
        ];

        for (const name of specialized) expect((indexExports as any)[name]).toBeDefined();


        expect(indexExports.OCCUPATION_OPTIONS).toHaveLength(7);
        expect(indexExports.FINANCING_TERM_OPTIONS).toHaveLength(8);
        expect(indexExports.FINANCING_GRACE_PERIOD_OPTIONS).toHaveLength(4);
        expect(indexExports.SERVICE_PRICING_UNIT_OPTIONS).toHaveLength(4);
        expect(indexExports.SERVICE_AUDIENCE_OPTIONS).toHaveLength(4);
        expect(indexExports.INVERTER_TYPE_OPTIONS).toHaveLength(2);
        expect(indexExports.MONITORING_AUTH_TYPE_OPTIONS).toHaveLength(4);
        expect(indexExports.MONITORING_CREDENTIAL_FLOW_OPTIONS).toHaveLength(3);
        expect(indexExports.AI_MODEL_STATUS_OPTIONS).toHaveLength(3);
        expect(indexExports.AI_PRICE_ITEM_TYPE_OPTIONS).toHaveLength(35);
        expect(indexExports.AI_CACHE_OPERATION_OPTIONS).toHaveLength(3);
        expect(indexExports.RAG_SOURCE_TYPE_OPTIONS).toHaveLength(4);
        expect(indexExports.VALID_WEEKDAYS).toHaveLength(7);
        expect(typeof indexExports.isValidDateString).toBe('function');
        expect(typeof indexExports.isValidTimeString).toBe('function');
        expect(typeof indexExports.isValidScheduleRule).toBe('function');
    });
});

