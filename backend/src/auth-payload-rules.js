export function validateLoginPayload(payload = {}) {
  const { email, senha } = payload;

  if (!email || !senha) {
    return { valid: false, status: 400, message: 'Email e senha são obrigatórios' };
  }

  return {
    valid: true,
    data: {
      email,
      senha,
    },
  };
}

export function validateRefreshTokenPayload(payload = {}) {
  const { refreshToken } = payload;

  if (!refreshToken) {
    return { valid: false, status: 400, message: 'refreshToken é obrigatório' };
  }

  return {
    valid: true,
    data: {
      refreshToken,
    },
  };
}
