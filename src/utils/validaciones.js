export const validarTransferencia = (montoInput, saldoDisponible, emailDestino, emailOrigen) => {
  const monto = Number(montoInput);

  // Vacío o no numérico (Number('') es 0, así que lo distinguimos aparte)
  if (montoInput === '' || montoInput === null || montoInput === undefined || Number.isNaN(monto)) {
    return "Monto inválido";
  }
  if (monto <= 0) {
    return "Monto inválido";
  }
  if (!Number.isInteger(monto)) {
    return "El monto no puede tener decimales";
  }
  if (monto > saldoDisponible) {
    return "Saldo insuficiente";
  }
  if (!emailDestino || !emailDestino.includes('@')) {
    return "Destinatario inválido";
  }
  if (emailDestino.toLowerCase() === emailOrigen.toLowerCase()) {
    return "No puedes transferirte a ti mismo";
  }
  return null; // Caso feliz: no hay error
};