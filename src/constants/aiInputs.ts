import type {
    AiBillingModeValue,
    AiBillingUnitValue,
    AiExecutionTypeValue,
    DomainSelectOption
} from '../types/domainInputs';
import type {
    AiCacheOperationValue,
    AiModelStatusValue,
    AiPriceItemTypeValue,
    RagSourceTypeValue
} from '../types/specializedInputs';

export const AI_EXECUTION_TYPE_OPTIONS: readonly DomainSelectOption<AiExecutionTypeValue>[] = Object.freeze([
    { value: 'cloud', label: 'Nuvem', name: 'Nuvem' },
    { value: 'local', label: 'Local', name: 'Local' }
]);

export const AI_BILLING_MODE_OPTIONS: readonly DomainSelectOption<AiBillingModeValue>[] = Object.freeze([
    { value: 'dollar', label: 'Dólar (USD)', name: 'Dólar (USD)' },
    { value: 'bonus', label: 'Bônus (créditos)', name: 'Bônus (créditos)' },
    { value: 'free', label: 'Gratuito', name: 'Gratuito' },
    { value: 'local', label: 'Local (custo zero)', name: 'Local (custo zero)' }
]);

export const AI_BILLING_UNIT_OPTIONS: readonly DomainSelectOption<AiBillingUnitValue>[] = Object.freeze([
    { value: 'm_tokens', label: 'Por 1 milhão de tokens', name: 'Por 1 milhão de tokens' },
    { value: 'tokens', label: 'Por token', name: 'Por token' },
    { value: 'unity', label: 'Por unidade/requisição', name: 'Por unidade/requisição' },
    { value: 'characters', label: 'Por caractere', name: 'Por caractere' },
    { value: 'second', label: 'Por segundo', name: 'Por segundo' },
    { value: 'minute', label: 'Por minuto', name: 'Por minuto' },
    { value: 'hour', label: 'Por hora', name: 'Por hora' }
]);

export const AI_MODEL_STATUS_OPTIONS: readonly DomainSelectOption<AiModelStatusValue>[] = Object.freeze([
    { value: 'approved', label: 'Aprovado', name: 'Aprovado' },
    { value: 'pending', label: 'Pendente', name: 'Pendente' },
    { value: 'failed', label: 'Falhou', name: 'Falhou' }
]);

export const AI_PRICE_ITEM_TYPE_OPTIONS: readonly DomainSelectOption<AiPriceItemTypeValue>[] = Object.freeze([
    { value: 'global', label: 'Global', name: 'Global' },
    { value: 'text', label: 'Texto', name: 'Texto' },
    { value: 'embedding', label: 'Embedding', name: 'Embedding' },
    { value: 'rerank', label: 'Rerank', name: 'Rerank' },
    { value: 'moderation', label: 'Moderação', name: 'Moderação' },
    { value: 'ocr', label: 'OCR', name: 'OCR' },
    { value: 'tts', label: 'Conversão de texto em fala (TTS)', name: 'Conversão de texto em fala (TTS)' },
    { value: 'stt', label: 'Transcrição de fala em texto (STT)', name: 'Transcrição de fala em texto (STT)' },
    { value: 'speech_to_speech', label: 'Fala para fala', name: 'Fala para fala' },
    { value: 'live_audio', label: 'Áudio ao vivo', name: 'Áudio ao vivo' },
    { value: 'live_video', label: 'Vídeo ao vivo', name: 'Vídeo ao vivo' },
    { value: 'document_process', label: 'Processamento de documentos', name: 'Processamento de documentos' },
    { value: 'image_process', label: 'Processamento de imagens', name: 'Processamento de imagens' },
    { value: 'image_create', label: 'Geração de imagem', name: 'Geração de imagem' },
    { value: 'image_edit', label: 'Edição de imagem', name: 'Edição de imagem' },
    { value: 'image_upscale', label: 'Upscale de imagem', name: 'Upscale de imagem' },
    { value: 'image_avatar', label: 'Avatar de imagem', name: 'Avatar de imagem' },
    { value: 'video_process', label: 'Processamento de vídeo', name: 'Processamento de vídeo' },
    { value: 'video_create', label: 'Geração de vídeo', name: 'Geração de vídeo' },
    { value: 'video_edit', label: 'Edição de vídeo', name: 'Edição de vídeo' },
    { value: 'video_upscale', label: 'Upscale de vídeo', name: 'Upscale de vídeo' },
    { value: 'video_avatar', label: 'Avatar de vídeo', name: 'Avatar de vídeo' },
    { value: 'video_add_voice', label: 'Adição de voz a vídeo', name: 'Adição de voz a vídeo' },
    { value: 'video_dubbing', label: 'Dublagem de vídeo', name: 'Dublagem de vídeo' },
    { value: 'audio_process', label: 'Processamento de áudio', name: 'Processamento de áudio' },
    { value: 'audio_create', label: 'Geração de áudio', name: 'Geração de áudio' },
    { value: 'sound_effect_create', label: 'Efeitos sonoros', name: 'Efeitos sonoros' },
    { value: 'voice_create', label: 'Criação de voz', name: 'Criação de voz' },
    { value: 'music_create', label: 'Criação de música', name: 'Criação de música' },
    { value: 'avatar_create', label: 'Criação de avatar', name: 'Criação de avatar' },
    { value: 'voice_clone', label: 'Clonagem de voz', name: 'Clonagem de voz' },
    { value: 'translate_audio', label: 'Tradução de áudio', name: 'Tradução de áudio' },
    { value: 'translate_video', label: 'Tradução de vídeo', name: 'Tradução de vídeo' },
    { value: 'translate_text', label: 'Tradução de texto', name: 'Tradução de texto' },
    { value: 'lip_sync', label: 'Sincronização labial', name: 'Sincronização labial' }
]);

export const AI_CACHE_OPERATION_OPTIONS: readonly DomainSelectOption<AiCacheOperationValue>[] = Object.freeze([
    { value: 'read', label: 'Leitura', name: 'Leitura' },
    { value: 'write', label: 'Escrita', name: 'Escrita' },
    { value: 'storage', label: 'Armazenamento', name: 'Armazenamento' }
]);

export const RAG_SOURCE_TYPE_OPTIONS: readonly DomainSelectOption<RagSourceTypeValue>[] = Object.freeze([
    { value: 'document', label: 'Documento', name: 'Documento' },
    { value: 'url', label: 'URL / Link', name: 'URL / Link' },
    { value: 'text', label: 'Texto direto', name: 'Texto direto' },
    { value: 'mysql', label: 'Banco de dados MySQL', name: 'Banco de dados MySQL' }
]);
