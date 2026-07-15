import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Transferencia from './Transferencia';
import { getDocs, updateDoc, addDoc } from 'firebase/firestore';

// RT5: Mock de la capa de servicios (Firebase)
vi.mock('../firebase/config', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
  addDoc: vi.fn()
}));

describe('Componente Transferencia', () => {
  const mockUsuario = { uid: 'user123', email: 'yo@test.com' };
  const saldoActual = 100000;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // RT3: Renderiza los campos y el botón de enviar
  it('renderiza el formulario correctamente', () => {
    render(<Transferencia usuario={mockUsuario} saldoActual={saldoActual} />);
    
    expect(screen.getByPlaceholderText(/correo del destinatario/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/monto a transferir/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar dinero/i })).toBeInTheDocument();
  });

  // RT3: Monto inválido muestra error y NO llama al servicio
  it('muestra error y no llama a Firebase si el saldo es insuficiente', async () => {
    const user = userEvent.setup();
    render(<Transferencia usuario={mockUsuario} saldoActual={saldoActual} />);

    await user.type(screen.getByPlaceholderText(/correo del destinatario/i), 'destino@test.com');
    await user.type(screen.getByPlaceholderText(/monto a transferir/i), '200000'); // Mayor al saldo
    await user.click(screen.getByRole('button', { name: /enviar dinero/i }));

    expect(await screen.findByText(/saldo insuficiente/i)).toBeInTheDocument();
    expect(getDocs).not.toHaveBeenCalled();
    expect(updateDoc).not.toHaveBeenCalled();
  });

  // RT3: Mientras la transferencia está en curso, el botón queda deshabilitado
  it('deshabilita el botón mientras procesa la transferencia', async () => {
    const user = userEvent.setup();
    render(<Transferencia usuario={mockUsuario} saldoActual={saldoActual} />);

    // Simulamos una promesa pendiente para atrapar el estado "cargando"
    getDocs.mockImplementationOnce(() => new Promise(() => {}));

    await user.type(screen.getByPlaceholderText(/correo del destinatario/i), 'destino@test.com');
    await user.type(screen.getByPlaceholderText(/monto a transferir/i), '10000');
    
    const boton = screen.getByRole('button', { name: /enviar dinero/i });
    await user.click(boton);

    expect(boton).toBeDisabled();
    expect(boton).toHaveTextContent(/procesando transferencia/i);
  });

  // RT3 y RT5: Datos válidos llaman al servicio mockeado exactamente una vez
  it('ejecuta la transferencia correctamente con datos válidos', async () => {
    const user = userEvent.setup();
    render(<Transferencia usuario={mockUsuario} saldoActual={saldoActual} />);

    // Mockeamos la respuesta de getDocs simulando que el destinatario existe
    getDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: 'destino456', data: () => ({ saldo: 50000 }) }]
    });

    await user.type(screen.getByPlaceholderText(/correo del destinatario/i), 'destino@test.com');
    await user.type(screen.getByPlaceholderText(/monto a transferir/i), '25000');
    await user.click(screen.getByRole('button', { name: /enviar dinero/i }));

    // Verificamos el feedback de éxito
    expect(await screen.findByText(/transferencia de \$25000 enviada con éxito/i)).toBeInTheDocument();

    // Verificamos que se llamó a la base de datos para descontar y abonar
    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(updateDoc).toHaveBeenCalledTimes(2); // Una para el emisor, otra para el receptor
    expect(addDoc).toHaveBeenCalledTimes(1); // El registro del movimiento en el historial
  });
});