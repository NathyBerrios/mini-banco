
import { db } from "../firebase/config";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import React, { useState, useEffect } from "react";

const Historial = ({ usuario }) => {
  const [movimientos, setMovimientos] = useState([]);

  useEffect(() => {
    if (!usuario) return;

    // 1. Consulta: Traer la colección ordenada del más reciente al más antiguo
    const q = query(
      collection(db, "movimientos"),
      orderBy("fecha", "desc")
    );

    // 2. Suscripción en tiempo real (onSnapshot)
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historial = [];
      
      snapshot.forEach((doc) => {
        const mov = doc.data();
        // 3. Filtramos para mostrar solo los movimientos donde este usuario participa
        if (mov.emisorUid === usuario.uid || mov.receptorUid === usuario.uid) {
          // El ID del documento es la "key" obligatoria para React
          historial.push({ id: doc.id, ...mov });
        }
      });
      
      setMovimientos(historial);
    });

    // 4. Limpieza obligatoria para la nota (evita fugas de memoria)
    return () => unsubscribe();
  }, [usuario]); // Arreglo de dependencias correcto

  return (
    <div style={{ background: "#161b22", padding: "20px", borderRadius: "10px", marginTop: "20px", border: "1px solid #30363d" }}>
      <h3 style={{ color: "#58a6ff", marginTop: 0 }}>Historial de Movimientos</h3>
      
      {movimientos.length === 0 ? (
        <p style={{ color: "#8b949e" }}>No tienes movimientos aún.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {movimientos.map((mov) => {
            // Evaluamos si el usuario actual fue el que envió el dinero
            const esEnvio = mov.emisorUid === usuario.uid;
            
            return (
              <li key={mov.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #30363d" }}>
                <div>
                  {/* Mostramos la contraparte y el tipo */}
                  <p style={{ margin: 0, fontWeight: "bold", color: "#e6edf3" }}>
                    {esEnvio ? "Transferencia a: " + mov.receptorEmail : "Recibido de: " + mov.emisorEmail}
                  </p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#8b949e" }}>
                    {/* Transformamos el Timestamp de Firebase a una fecha legible en Chile */}
                    {mov.fecha && new Date(mov.fecha.toDate()).toLocaleString("es-CL")}
                  </p>
                </div>
                
                {/* Monto en rojo si es envío, verde si es recepción */}
                <div style={{ fontWeight: "bold", color: esEnvio ? "#f85149" : "#3fb950", fontSize: "18px" }}>
                  {esEnvio ? "-" : "+"}${mov.monto.toLocaleString("es-CL")}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Historial;