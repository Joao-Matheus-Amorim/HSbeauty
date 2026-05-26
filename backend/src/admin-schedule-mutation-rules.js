function parseDateField(value, fieldName, { required = false } = {}) {
  if (value === undefined) {
    if (required) return { valid: false, status: 400, message: `${fieldName} é obrigatória` };
    return { valid: true, value: undefined };
  }

  if (value === null || value === '') {
    return { valid: false, status: 400, message: `${fieldName} inválida` };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { valid: false, status: 400, message: `${fieldName} inválida` };
  }

  return { valid: true, value: date };
}

function applyNullableText(data, payload, fieldName) {
  if (payload[fieldName] === undefined) return null;

  const value = payload[fieldName];
  if (value === null || value === '') {
    data[fieldName] = null;
    return null;
  }

  if (typeof value !== 'string') {
    return { valid: false, status: 400, message: `${fieldName} deve ser texto` };
  }

  data[fieldName] = value.trim();
  return null;
}

function validateRange(dataInicio, dataFim) {
  if (dataFim <= dataInicio) {
    return { valid: false, status: 400, message: 'Data de fim deve ser posterior à data de início' };
  }

  return null;
}

export function validateAdminScheduleCreatePayload(payload = {}) {
  const startResult = parseDateField(payload.dataInicio, 'dataInicio', { required: true });
  if (!startResult.valid) return startResult;

  const endResult = parseDateField(payload.dataFim, 'dataFim', { required: true });
  if (!endResult.valid) return endResult;

  const rangeError = validateRange(startResult.value, endResult.value);
  if (rangeError) return rangeError;

  const data = {
    dataInicio: startResult.value,
    dataFim: endResult.value,
  };

  for (const field of ['horaInicio', 'horaFim', 'motivo']) {
    const error = applyNullableText(data, payload, field);
    if (error) return error;
  }

  return { valid: true, data };
}

export function validateAdminScheduleUpdatePayload(payload = {}, currentSchedule = {}) {
  const data = {};

  const startResult = parseDateField(payload.dataInicio, 'dataInicio');
  if (!startResult.valid) return startResult;
  if (startResult.value) data.dataInicio = startResult.value;

  const endResult = parseDateField(payload.dataFim, 'dataFim');
  if (!endResult.valid) return endResult;
  if (endResult.value) data.dataFim = endResult.value;

  for (const field of ['horaInicio', 'horaFim', 'motivo']) {
    const error = applyNullableText(data, payload, field);
    if (error) return error;
  }

  if (payload.ativo !== undefined) {
    if (typeof payload.ativo !== 'boolean') {
      return { valid: false, status: 400, message: 'Ativo deve ser true ou false' };
    }

    data.ativo = payload.ativo;
  }

  if (Object.keys(data).length === 0) {
    return { valid: false, status: 400, message: 'Nenhum campo para atualizar' };
  }

  const effectiveStart = data.dataInicio ?? currentSchedule.dataInicio;
  const effectiveEnd = data.dataFim ?? currentSchedule.dataFim;

  if (effectiveStart && effectiveEnd) {
    const rangeError = validateRange(new Date(effectiveStart), new Date(effectiveEnd));
    if (rangeError) return rangeError;
  }

  return { valid: true, data };
}
