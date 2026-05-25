function buildLogPayload(context, error, req) {
  const payload = {
    context,
    method: req?.method,
    path: req?.originalUrl || req?.url,
    message: error?.message || String(error),
  };

  if (error?.code) payload.code = error.code;
  if (process.env.NODE_ENV !== 'production' && error?.stack) payload.stack = error.stack;

  return payload;
}

export function sendError(res, status, message) {
  return res.status(status).json({ erro: message });
}

export function logError(context, error, req) {
  console.error('[HSBeauty API error]', buildLogPayload(context, error, req));
}

export function handleInternalError(res, error, context, publicMessage, req) {
  logError(context, error, req);
  return sendError(res, 500, publicMessage);
}

export function handlePrismaConflict(res, error, conflictMessage) {
  if (error?.code === 'P2002') {
    return sendError(res, 409, conflictMessage);
  }

  return null;
}
