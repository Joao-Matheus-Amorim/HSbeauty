const REQUIRED_ENV_VARS = ['DATABASE_URL', 'JWT_SECRET'];

function buildMissingEnvMessage(missing) {
  const suffix = missing.length === 1 ? 'é obrigatório' : 'são obrigatórios';
  return `${missing.join(', ')} ${suffix}`;
}

export function validateRequiredEnv(env = process.env, requiredVars = REQUIRED_ENV_VARS) {
  const missing = requiredVars.filter((name) => !env[name]);

  if (missing.length > 0) {
    return {
      valid: false,
      message: buildMissingEnvMessage(missing),
      missing,
    };
  }

  return { valid: true, missing: [] };
}

export function assertRequiredEnv(env = process.env, requiredVars = REQUIRED_ENV_VARS) {
  const validation = validateRequiredEnv(env, requiredVars);

  if (!validation.valid) {
    throw new Error(validation.message);
  }

  return validation;
}
