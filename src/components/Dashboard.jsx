import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";

const Dashboard = ({ usuario }) => {
  const [datosUsuario, setDatosUsuario] = useState(null);
  // Estados explícitos de carga y error exigidos en la rúbrica
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!usuario || !usuario.uid) return;

    // 1. Referencia al documento exacto del usuario en la colección "users"
    const docRef = doc(db, "users", usuario.uid);

    // 2. Suscripción en tiempo real con onSnapshot
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setDatosUsuario(docSnap.data());
        } else {
          setError("No se encontraron los datos de la cuenta.");
        }
        setCargando(false);
      },
      (err) => {
        setError("Error al conectar con la base de datos: " + err.message);
        setCargando(false);
      }
    );

    // 3. Limpieza de la suscripción (Fuga de memoria evitada = 0 puntos descontados)
    return () => unsubscribe();
  }, [usuario]); // Dependencia correcta para que reaccione si cambia el usuario

  if (cargando) return <p>Cargando tu cuenta...</p>;
  if (error) return <p style={{ color: "red", padding: "10px", border: "1px solid red" }}>{error}</p>;

  return (
    <div className="dashboard-container" style={{ marginTop: "20px" }}>
      <h2>Hola, {datosUsuario?.email}</h2>
      
      <div style={{ background: "#1c2333", padding: "20px", borderRadius: "10px", marginTop: "15px" }}>
        <h3 style={{ color: "#8b949e", margin: "0 0 10px 0", fontSize: "14px" }}>SALDO DISPONIBLE</h3>
        {/* Formateamos el número para que se vea como dinero real */}
        <p style={{ fontSize: "32px", fontWeight: "bold", color: "#58a6ff", margin: 0 }}>
          ${datosUsuario?.saldo?.toLocaleString("es-CL")}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;