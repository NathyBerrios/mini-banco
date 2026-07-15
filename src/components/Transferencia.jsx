import { useState } from "react";
import { db } from "../firebase/config";
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from "firebase/firestore";
import React, { useState } from "react";

const Transferencia = ({ usuario, saldoActual }) => {
  // Formularios controlados por el estado
  const [emailDestino, setEmailDestino] = useState("");
  const [monto, setMonto] = useState("");
  
  // Estados para validaciones y prevención de doble submit
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  // Handler con nombre claro
  const handleTransferSubmit = async (e) => {
    e.preventDefault(); // evita que la página recargue
    setMensaje({ tipo: "", texto: "" });

    const montoTransferencia = Number(monto);

    // 1. Validaciones LOCALES (antes de tocar Firestore)
    if (montoTransferencia <= 0) {
      return setMensaje({ tipo: "error", texto: "El monto debe ser mayor a 0." });
    }
    if (montoTransferencia > saldoActual) {
      return setMensaje({ tipo: "error", texto: "Saldo insuficiente para esta transferencia." });
    }
    if (emailDestino.toLowerCase() === usuario.email.toLowerCase()) {
      return setMensaje({ tipo: "error", texto: "No puedes transferirte dinero a ti mismo." });
    }

    setCargando(true); // Deshabilitamos el botón

    try {
      // 2. Buscar si el destinatario existe en la base de datos
      const q = query(collection(db, "users"), where("email", "==", emailDestino));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setCargando(false);
        return setMensaje({ tipo: "error", texto: "El usuario destinatario no existe." });
      }

      // Extraemos los datos del destinatario
      const destinatarioDoc = querySnapshot.docs[0];
      const destinatarioData = destinatarioDoc.data();
      const destinatarioId = destinatarioDoc.id;

      // 3. Ejecutar la transferencia (Descontar al emisor, abonar al receptor)
      await updateDoc(doc(db, "users", usuario.uid), {
        saldo: saldoActual - montoTransferencia
      });

      await updateDoc(doc(db, "users", destinatarioId), {
        saldo: destinatarioData.saldo + montoTransferencia
      });

      // 4. Registrar el movimiento para el Historial (RF4)
      await addDoc(collection(db, "movimientos"), {
        emisorUid: usuario.uid,
        receptorUid: destinatarioId,
        emisorEmail: usuario.email,
        receptorEmail: emailDestino,
        monto: montoTransferencia,
        fecha: new Date()
      });

      // Feedback de éxito y limpieza del formulario
      setMensaje({ tipo: "exito", texto: `Transferencia de $${montoTransferencia} enviada con éxito.` });
      setMonto("");
      setEmailDestino("");

    } catch (errorFirebase) {
      setMensaje({ tipo: "error", texto: "Error en la transferencia: " + errorFirebase.message });
    } finally {
      setCargando(false); // Volvemos a habilitar el botón
    }
  };

  return (
    <div style={{ background: "#161b22", padding: "20px", borderRadius: "10px", marginTop: "20px", border: "1px solid #30363d" }}>
      <h3 style={{ color: "#58a6ff", marginTop: 0 }}>Transferir Dinero</h3>
      
      <form onSubmit={handleTransferSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input
          type="email"
          placeholder="Correo del destinatario"
          value={emailDestino}
          onChange={(e) => setEmailDestino(e.target.value)}
          required
          style={{ padding: "8px", borderRadius: "5px" }}
        />
        <input
          type="number"
          placeholder="Monto a transferir"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          required
          min="1"
          style={{ padding: "8px", borderRadius: "5px" }}
        />
        
        {/* Mostrar mensajes de error o éxito al usuario */}
        {mensaje.texto && (
          <p style={{ color: mensaje.tipo === "error" ? "#f85149" : "#3fb950", margin: "5px 0" }}>
            {mensaje.texto}
          </p>
        )}

        {/* Prevención de doble submit exigida en la rúbrica */}
        <button type="submit" disabled={cargando} style={{ padding: "10px", background: cargando ? "#8b949e" : "#238636", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
          {cargando ? "Procesando transferencia..." : "Enviar dinero"}
        </button>
      </form>
    </div>
  );
};

export default Transferencia;