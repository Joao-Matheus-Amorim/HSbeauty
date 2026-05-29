/**
 * Regras compartilhadas de validacao de URL de imagem.
 * Usadas por categoria, servico e configuracao de site.
 */
const IMAGEM_URL_MAX = 500;
const DATA_URI_MAX = 1024 * 1024 * 2; // 2MB de base64 (~1.5MB de imagem real)

export function validateImagemUrl(value) {
  if (value === undefined) return { valid: true, value: undefined };
  if (value === null || value === '') return { valid: true, value: null };

  if (typeof value !== 'string') {
    return { valid: false, status: 400, message: 'imagemUrl deve ser texto' };
  }

  const trimmed = value.trim();

  if (trimmed.startsWith('data:image/')) {
    if (trimmed.length > DATA_URI_MAX) {
      return { valid: false, status: 400, message: 'Imagem em data URI excede 2MB' };
    }
    return { valid: true, value: trimmed };
  }

  if (trimmed.length > IMAGEM_URL_MAX) {
    return { valid: false, status: 400, message: `imagemUrl excede ${IMAGEM_URL_MAX} caracteres` };
  }

  if (!/^(https?:)?\/\//i.test(trimmed)) {
    return { valid: false, status: 400, message: 'imagemUrl deve ser uma URL http(s) ou data URI de imagem' };
  }

  return { valid: true, value: trimmed };
}
