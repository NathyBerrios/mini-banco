import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Auth from './Auth'; // Ajusta la ruta si tu archivo Auth.jsx está en otra carpeta
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
  // (Esto lo maneja el atributo 'required' del HTML5 por defecto, pero podemos validar que el mock no se disparó)
  it('no llama al servicio de autenticación si los campos están vacíos', async () => {
    render(<Auth />);
    const user = userEvent.setup();
    
    const boton = screen.getByRole('button', { name: /entrar/i });
    await user.click(boton);
    
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  // RT4: Si el servicio mockeado rechaza, se muestra un mensaje de error al usuario
  it('muestra un mensaje de error si las credenciales son inválidas', async () => {
    render(<Auth />);
    const user = userEvent.setup();
    
    // Arrange: Configuramos el mock para que falle
    signInWithEmailAndPassword.mockRejectedValueOnce(new Error('Credenciales inválidas'));

    // Act: Llenamos el formulario y enviamos
    await user.type(screen.getByPlaceholderText(/correo electrónico/i), 'test@test.com');
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    // Assert: Verificamos que el error aparezca en la pantalla de forma asíncrona
    expect(await screen.findByText(/Error: Credenciales inválidas/i)).toBeInTheDocument();
  });

  // Test extra para comprobar el comportamiento del botón (deshabilitado al cargar)
  it('deshabilita el botón mientras procesa la solicitud', async () => {
    render(<Auth />);
    const user = userEvent.setup();
    
    // Hacemos que la promesa se quede pendiente para ver el estado "Procesando..."
    signInWithEmailAndPassword.mockImplementationOnce(() => new Promise(() => {}));

    await user.type(screen.getByPlaceholderText(/correo electrónico/i), 'test@test.com');
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'password123');
    const boton = screen.getByRole('button', { name: /entrar/i });
    
    await user.click(boton);
    
    expect(boton).toBeDisabled();
    expect(boton).toHaveTextContent(/procesando/i);
  });
});