import { useState, useEffect } from "react";
import { auth } from "./firebase/config";
import { onAuthStateChanged, signOut } from "firebase/auth";

// Importaremos los componentes después
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";

function App() {
  const [usuarioActivo, setUsuarioActivo] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Escuchamos si hay un usuario logueado en tiempo real
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuarioActivo(user);
      setCargando(false);
    });
    
    return () => unsubscribe(); // Limpiamos la suscripción
  }, []);

  // RF5: Función para cerrar sesión
  const cerrarSesion = async () => {
    await signOut(auth);
  };

  if (cargando) return <div>Cargando banco...</div>;

  return (
    <div className="app-container">
      {usuarioActivo ? (
        <div>
          <header>
            <h1>XBank</h1>
            <button onClick={cerrarSesion}>Cerrar Sesión</button>
          </header>
          {/* Aquí irá el Dashboard que crearemos luego */}
          <p>Bienvenido, {usuarioActivo.email}</p>
        </div>
      ) : (
        <div>
           <Auth />
        </div>
      )}
    </div>
  );
}

export default App;