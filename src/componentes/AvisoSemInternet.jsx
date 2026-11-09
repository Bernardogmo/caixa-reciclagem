// Faixa discreta no topo quando o aparelho está sem internet. O app continua
// funcionando: os lançamentos ficam no cache do Firestore e sobem sozinhos
// quando a conexão volta.
import { useEffect, useState } from "react";

function estaOnline() {
  return typeof navigator === "undefined" || !("onLine" in navigator) ? true : navigator.onLine;
}

export default function AvisoSemInternet() {
  const [online, setOnline] = useState(estaOnline);

  useEffect(() => {
    const ficouOnline = () => setOnline(true);
    const ficouOffline = () => setOnline(false);
    window.addEventListener("online", ficouOnline);
    window.addEventListener("offline", ficouOffline);
    return () => {
      window.removeEventListener("online", ficouOnline);
      window.removeEventListener("offline", ficouOffline);
    };
  }, []);

  if (online) return null;
  return (
    <div className="faixa-offline" role="status">
      📴 Sem internet — os lançamentos ficam no aparelho e sobem sozinhos.
    </div>
  );
}
