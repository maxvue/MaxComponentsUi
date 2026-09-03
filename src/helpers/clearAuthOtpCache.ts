/**
 * Limpa o cache de sessão e cooldown OTP do localStorage.
 * Pode ser chamado diretamente em qualquer lugar do projeto consumidor (ex: ao deslogar ou ao efetuar login com sucesso).
 *
 * @param cacheKeyPrefix Prefixo da chave no localStorage (padrão: 'max_auth_otp_')
 * @param phone Número de telefone opcional para limpar chaves específicas
 */
export function clearAuthOtpCache(cacheKeyPrefix = 'max_auth_otp_', phone?: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        localStorage.removeItem(`${cacheKeyPrefix}session`);
        if (phone) {
            const clean = phone.replace(/\D/g, '');
            if (clean) localStorage.removeItem(`${cacheKeyPrefix}${clean}`);
        } else {
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(cacheKeyPrefix)) keysToRemove.push(key);
            }
            keysToRemove.forEach((k) => localStorage.removeItem(k));
        }
    } catch {
        // Ignora possíveis erros de acesso ao storage em ambientes com restrição
    }
}
