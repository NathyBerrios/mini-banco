import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Auth from './Auth';
import { signInWithEmailAndPassword } from 'firebase/auth';

// RT5: Aislar Firebase mediante mocks
vi.mock('../firebase/config', () => ({
  auth: {},
  db: {}
}));

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn()
}));

describe('Componente Auth (Login)', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Limpiamos el estado de los mocks antes de cada test
  });

  // RT4: Con campos vacíos no se llama al servicio de autenticación
  // (el atributo 'required' del HTML5 evita el submit; verificamos que el mock no se disparó)
  it('no llama al servicio de autenticación si los campos están vacíos', async () => {
    // Arrange
    render(<Auth />);
    const user = userEvent.setup();

    // Act
    const boton = screen.getByRole('button', { name: /entrar/i });
    await user.click(boton);

    // Assert
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  // RT4: Si el servicio mockeado rechaza, se muestra un mensaje de error al usuario
  it('muestra un mensaje de error si las credenciales son inválidas', async () => {
    // Arrange
    render(<Auth />);
    const user = userEvent.setup();
    signInWithEmailAndPassword.mockRejectedValueOnce(new Error('Credenciales inválidas'));

    // Act
    await user.type(screen.getByLabelText(/correo electrónico/i), 'test@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    // Assert
    expect(await screen.findByText(/Error: Credenciales inválidas/i)).toBeInTheDocument();
  });

  // RT5: mock que resuelve con éxito + verificación de llamada con los argumentos correctos
  it('llama al servicio de autenticación con el correo y contraseña ingresados', async () => {
    // Arrange
    render(<Auth />);
    const user = userEvent.setup();
    signInWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: 'user123' } });

    // Act
    await user.type(screen.getByLabelText(/correo electrónico/i), 'test@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    // Assert
    await waitFor(() => expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(1));
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith({}, 'test@test.com', 'password123');
  });

  // Test extra para comprobar el comportamiento del botón (deshabilitado al cargar)
  it('deshabilita el botón mientras procesa la solicitud', async () => {
    // Arrange
    render(<Auth />);
    const user = userEvent.setup();
    signInWithEmailAndPassword.mockImplementationOnce(() => new Promise(() => {}));

    // Act
    await user.type(screen.getByLabelText(/correo electrónico/i), 'test@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');
    const boton = screen.getByRole('button', { name: /entrar/i });
    await user.click(boton);

    // Assert
    expect(boton).toBeDisabled();
    expect(boton).toHaveTextContent(/procesando/i);
  });
});
