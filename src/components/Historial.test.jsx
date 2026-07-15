
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Historial from './Historial';
import { onSnapshot } from 'firebase/firestore';

vi.mock('../firebase/config', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn()
}));

describe('Componente Historial', () => {
  const mockUsuario = { uid: 'user123', email: 'yo@test.com' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // RT4: Muestra un estado vacío cuando no hay movimientos
  it('muestra mensaje de estado vacío si no hay transacciones', () => {
    // Simulamos que onSnapshot devuelve un arreglo vacío
    onSnapshot.mockImplementationOnce((query, callback) => {
      callback([]); // Snapshot vacío
      return vi.fn(); // Función de limpieza (unsubscribe)
    });

    render(<Historial usuario={mockUsuario} />);
    
    expect(screen.getByText(/no tienes movimientos aún/i)).toBeInTheDocument();
  });

  // RT4: Renderiza los movimientos y distingue envíos de recepciones
  it('renderiza la lista de movimientos distinguiendo ingresos y egresos', () => {
    // Datos de prueba simulando Firestore
    const mockDocs = [
      {
        id: 'mov1',
        data: () => ({
          emisorUid: 'user123', // El usuario envió
          receptorUid: 'destino456',
          receptorEmail: 'destino@test.com',
          monto: 15000,
          fecha: { toDate: () => new Date('2026-07-10T10:00:00Z') }
        })
      },
      {
        id: 'mov2',
        data: () => ({
          emisorUid: 'origen789',
          receptorUid: 'user123', // El usuario recibió
          emisorEmail: 'origen@test.com',
          monto: 30000,
          fecha: { toDate: () => new Date('2026-07-11T12:00:00Z') }
        })
      }
    ];

    onSnapshot.mockImplementationOnce((query, callback) => {
      callback(mockDocs); // Le pasamos los datos falsos al componente
      return vi.fn();
    });

    render(<Historial usuario={mockUsuario} />);

    // Verificamos el envío (Transferencia a:)
    expect(screen.getByText(/transferencia a: destino@test.com/i)).toBeInTheDocument();
    expect(screen.getByText(/-\$15.000/i)).toBeInTheDocument(); // Debería tener el signo menos

    // Verificamos la recepción (Recibido de:)
    expect(screen.getByText(/recibido de: origen@test.com/i)).toBeInTheDocument();
    expect(screen.getByText(/\+\$30.000/i)).toBeInTheDocument(); // Debería tener el signo más
  });

  // BONUS: Verificar que al desmontar el componente se llama la función unsubscribe
  it('llama a la función unsubscribe al desmontar el componente (Bonus)', () => {
    const mockUnsubscribe = vi.fn();
    
    onSnapshot.mockImplementationOnce((query, callback) => {
      callback([]);
      return mockUnsubscribe; // Retornamos nuestro mock
    });

    // Renderizamos y guardamos la función 'unmount'
    const { unmount } = render(<Historial usuario={mockUsuario} />);
    
    // Desmontamos el componente para simular que el usuario cambió de pantalla
    unmount();

    // Verificamos que la limpieza se ejecutó para evitar memory leaks
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});