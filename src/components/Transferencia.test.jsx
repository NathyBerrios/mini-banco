import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Transferencia from './Transferencia';
import { collection, where, doc, getDocs, updateDoc, addDoc } from 'firebase/firestore';

// RT5: Mock de la capa de servicios (Firebase).
// collection/doc devuelven un token identificable para poder verificar
// después con toHaveBeenCalledWith exactamente a qué documento se escribió.
vi.mock('../firebase/config', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, nombre) => `collection:${nombre}`),
  query: vi.fn((...args) => ({ query: args })),
  where: vi.fn((...args) => ({ where: args })),
  doc: vi.fn((_db, coleccion, id) => `doc:${coleccion}/${id}`),
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
    // Arrange + Act
    render(<Transferencia usuario={mockUsuario} saldoActual={saldoActual} />);

    // Assert
    expect(screen.getByLabelText(/correo del destinatario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/monto a transferir/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar dinero/i })).toBeInTheDocument();
  });

  // RT3: Monto inválido muestra error y NO llama al servicio
  it('muestra error y no llama a Firebase si el monto supera el saldo disponible', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Transferencia usuario={mockUsuario} saldoActual={saldoActual} />);

    // Act
    await user.type(screen.getByLabelText(/correo del destinatario/i), 'destino@test.com');
    await user.type(screen.getByLabelText(/monto a transferir/i), '200000'); // Mayor al saldo
    await user.click(screen.getByRole('button', { name: /enviar dinero/i }));

    // Assert
    expect(await screen.findByText(/saldo insuficiente/i)).toBeInTheDocument();
    expect(getDocs).not.toHaveBeenCalled();
    expect(updateDoc).not.toHaveBeenCalled();
  });

  // RT2 aplicado en el componente: transferencia a uno mismo también se rechaza antes de tocar Firestore
  it('muestra error y no llama a Firebase si el destinatario es uno mismo', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Transferencia usuario={mockUsuario} saldoActual={saldoActual} />);

    // Act
    await user.type(screen.getByLabelText(/correo del destinatario/i), 'YO@test.com');
    await user.type(screen.getByLabelText(/monto a transferir/i), '1000');
    await user.click(screen.getByRole('button', { name: /enviar dinero/i }));

    // Assert
    expect(await screen.findByText(/no puedes transferirte a ti mismo/i)).toBeInTheDocument();
    expect(getDocs).not.toHaveBeenCalled();
  });

  // RT3: Mientras la transferencia está en curso, el botón queda deshabilitado
  it('deshabilita el botón mientras procesa la transferencia', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Transferencia usuario={mockUsuario} saldoActual={saldoActual} />);

    // Simulamos una promesa pendiente para atrapar el estado "cargando"
    getDocs.mockImplementationOnce(() => new Promise(() => {}));

    // Act
    await user.type(screen.getByLabelText(/correo del destinatario/i), 'destino@test.com');
    await user.type(screen.getByLabelText(/monto a transferir/i), '10000');

    const boton = screen.getByRole('button', { name: /enviar dinero/i });
    await user.click(boton);

    // Assert
    expect(boton).toBeDisabled();
    expect(boton).toHaveTextContent(/procesando transferencia/i);
  });

  // RT3 y RT5: Datos válidos llaman al servicio mockeado exactamente una vez y con los argumentos correctos
  it('ejecuta la transferencia correctamente con datos válidos', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Transferencia usuario={mockUsuario} saldoActual={saldoActual} />);

    // Mockeamos la respuesta de getDocs simulando que el destinatario existe
    getDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: 'destino456', data: () => ({ saldo: 50000 }) }]
    });

    // Act
    await user.type(screen.getByLabelText(/correo del destinatario/i), 'destino@test.com');
    await user.type(screen.getByLabelText(/monto a transferir/i), '25000');
    await user.click(screen.getByRole('button', { name: /enviar dinero/i }));

    // Assert: feedback de éxito
    expect(await screen.findByText(/transferencia de \$25000 enviada con éxito/i)).toBeInTheDocument();

    // Assert: se llamó a la base de datos con los argumentos correctos (RT5)
    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(where).toHaveBeenCalledWith('email', '==', 'destino@test.com');

    expect(updateDoc).toHaveBeenCalledTimes(2); // Una para el emisor, otra para el receptor
    expect(updateDoc).toHaveBeenCalledWith('doc:users/user123', { saldo: 75000 }); // 100000 - 25000
    expect(updateDoc).toHaveBeenCalledWith('doc:users/destino456', { saldo: 75000 }); // 50000 + 25000

    expect(addDoc).toHaveBeenCalledTimes(1); // El registro del movimiento en el historial
    expect(addDoc).toHaveBeenCalledWith(
      'collection:movimientos',
      expect.objectContaining({
        emisorUid: 'user123',
        receptorUid: 'destino456',
        emisorEmail: 'yo@test.com',
        receptorEmail: 'destino@test.com',
        monto: 25000,
      })
    );
  });

  // RT3: destinatario que no existe en la base de datos
  it('muestra error si el destinatario no existe, sin actualizar saldos', async () => {
    // Arrange
    const user = userEvent.setup();
    getDocs.mockResolvedValueOnce({ empty: true, docs: [] });
    render(<Transferencia usuario={mockUsuario} saldoActual={saldoActual} />);

    // Act
    await user.type(screen.getByLabelText(/correo del destinatario/i), 'noexiste@test.com');
    await user.type(screen.getByLabelText(/monto a transferir/i), '5000');
    await user.click(screen.getByRole('button', { name: /enviar dinero/i }));

    // Assert
    expect(await screen.findByText(/el usuario destinatario no existe/i)).toBeInTheDocument();
    expect(updateDoc).not.toHaveBeenCalled();
    expect(addDoc).not.toHaveBeenCalled();
  });
});
