export const validarTransferencia = (monto, saldoDisponible, emailDestino, emailOrigen) => {
  if (typeof monto !== 'number' || monto <= 0 || isNaN(monto)) {
    return "Monto inválido";
  }
  if (monto > saldoDisponible) {
    return "Saldo insuficiente";
  }
  if (!emailDestino || !emailDestino.includes('@')) {
    return "Destinatario inválido";
  }
  if (emailDestino === emailOrigen) {
    return "No puedes transferirte a ti mismo";
  }
  return null; // Caso feliz: no hay error
};