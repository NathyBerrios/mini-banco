import { describe, it, expect } from 'vitest';
import { validarTransferencia } from './validaciones';

describe('validarTransferencia', () => {
  it('rechaza transferencias con monto negativo o cero', () => {
    // Arrange & Act
    const resultadoNegativo = validarTransferencia(-50000, 100000, 'test@test.com', 'yo@test.com');
    const resultadoCero = validarTransferencia(0, 100000, 'test@test.com', 'yo@test.com');
    
    // Assert
    expect(resultadoNegativo).toBe('Monto inválido');
    expect(resultadoCero).toBe('Monto inválido');
  });

  it('rechaza cuando el monto es mayor al saldo disponible', () => {
    const resultado = validarTransferencia(200000, 100000, 'test@test.com', 'yo@test.com');
    expect(resultado).toBe('Saldo insuficiente');
  });

  it('rechaza un monto no numérico', () => {
    // Arrange & Act
    const resultado = validarTransferencia('abc', 100000, 'test@test.com', 'yo@test.com');
    // Assert
    expect(resultado).toBe('Monto inválido');
  });

  it('rechaza un monto con decimales inválidos', () => {
    // Arrange & Act
    const resultado = validarTransferencia(150.5, 100000, 'test@test.com', 'yo@test.com');
    // Assert
    expect(resultado).toBe('El monto no puede tener decimales');
  });

  it('rechaza la transferencia a uno mismo', () => {
    const resultado = validarTransferencia(10000, 100000, 'yo@test.com', 'yo@test.com');
    expect(resultado).toBe('No puedes transferirte a ti mismo');
  });

  it('rechaza destinatarios con formato de email inválido', () => {
    const resultadoVacio = validarTransferencia(10000, 100000, '', 'yo@test.com');
    const resultadoSinArroba = validarTransferencia(10000, 100000, 'test.com', 'yo@test.com');
    
    expect(resultadoVacio).toBe('Destinatario inválido');
    expect(resultadoSinArroba).toBe('Destinatario inválido');
  });

  it('acepta la transferencia cuando todos los datos son válidos (caso feliz)', () => {
    const resultado = validarTransferencia(50000, 100000, 'destino@test.com', 'yo@test.com');
    expect(resultado).toBeNull();
  });
});