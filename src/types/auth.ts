/** Provedor de login social configurável */
export interface AuthProvider {
    /** Identificador enviado no evento `social` (ex: 'google') */
    id: string;
    /** Rótulo exibido no botão */
    label: string;
    /** Ícone (ex: 'mdi:google') */
    icon: string;
    /** Classe(s) CSS opcional(is) para customizar a cor de marca */
    class?: string;
}

/** Endpoint de envio/validação de código OTP ordenado por prioridade */
export interface AuthOtpEndpoint {
    /** URL do endpoint no backend (ex: '/api/auth/otp/whatsapp') */
    url?: string;
    /** Rótulo do botão de ação/reenvio (ex: 'Receber via WhatsApp') */
    label: string;
    /** Canal de comunicação (ex: 'whatsapp', 'sms') */
    channel?: 'whatsapp' | 'sms' | string;
    /** Ícone do botão (ex: 'ic:baseline-whatsapp', 'mdi:message-text-outline') */
    icon?: string;
    /** Payload extra opcional enviado junto aos eventos */
    payload?: Record<string, any>;
}

/** Estado da sessão OTP salvo em cache */
export interface AuthOtpSession {
    phone: string;
    timestamp: number;
    channel?: string;
    endpointIndex?: number;
}

export type AuthMode = 'password' | 'phone-otp';
export type AuthStep = 'phone' | 'code';

/** Textos do card (todos com default pt-BR) */
export interface AuthLabels {
    email?: string;
    password?: string;
    remember?: string;
    forgot?: string;
    submit?: string;
    socialDivider?: string;
    registerPrompt?: string;
    register?: string;
    phone?: string;
    phonePlaceholder?: string;
    code?: string;
    codePlaceholder?: string;
    codeTitle?: string;
    sendCode?: string;
    verifyCode?: string;
    resendCode?: string;
    resendIn?: string;
    changePhone?: string;
    codeSentTo?: string;
    didNotReceive?: string;
}
