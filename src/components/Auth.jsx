
import { auth, db } from "../firebase/config";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Estados para manejar la carga y los errores visuales 
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  // Handler nombrado y con responsabilidad clara
  const handleSubmit = async (e) => {
    e.preventDefault(); // Evitamos que el formulario recargue la página
    setError("");
    setCargando(true);

    try {
      if (isLogin) {
        // Lógica para Iniciar Sesión
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Lógica para Registrar usuario nuevo
        const credenciales = await createUserWithEmailAndPassword(auth, email, password);
        
        // RF1: Al registrarse, se crea su cuenta en Firestore con saldo de 100.000
        // Usamos setDoc apuntando específicamente al UID (ID único) del usuario
        await setDoc(doc(db, "users", credenciales.user.uid), {
          email: credenciales.user.email,
          nombre: "Usuario Nuevo",
          saldo: 100000
        });
      }
    } catch (errorFirebase) {
      // Feedback claro al usuario si algo sale mal
      setError("Error: " + errorFirebase.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>{isLogin ? "Iniciar Sesión" : "Registrarse"}</h2>
      
      {/* Formulario controlado por el estado */}
      <form onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="email">Correo electrónico</label>
        <input
          id="email"
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label className="sr-only" htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          placeholder="Contraseña (mínimo 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        {/* Mostramos el error explícitamente en la interfaz */}
        {error && <p style={{ color: "red" }}>{error}</p>}
        
        {/* Deshabilitar botón durante el proceso evita transferencias o registros duplicados */}
        <button type="submit" disabled={cargando}>
          {cargando ? "Procesando..." : (isLogin ? "Entrar" : "Crear cuenta")}
        </button>
      </form>

      <button onClick={() => setIsLogin(!isLogin)} type="button">
        {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
      </button>
    </div>
  );
};

export default Auth;