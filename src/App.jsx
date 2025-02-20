import { useState, useEffect } from "react";
import { materiais } from "./materiais";
import './App.css'; // Import the CSS file
import { db } from "./firebaseConfig";
import { collection, addDoc } from "firebase/firestore";

const App = () => {
  const [caixa, setCaixa] = useState(() => {
    const savedCaixa = localStorage.getItem("caixa");
    return savedCaixa ? parseFloat(savedCaixa) : null;
  });
  const [materialSelecionado, setMaterialSelecionado] = useState(materiais[0]);
  const [peso, setPeso] = useState("");
  const [compras, setCompras] = useState(() => {
    const savedCompras = localStorage.getItem("compras");
    return savedCompras ? JSON.parse(savedCompras) : [];
  });
  const [desconto, setDesconto] = useState("");

  useEffect(() => {
    if (caixa === null) {
      const valorInicial = parseFloat(prompt("Digite o valor inicial do caixa:"));
      if (!isNaN(valorInicial) && valorInicial >= 0) {
        setCaixa(valorInicial);
        localStorage.setItem("caixa", valorInicial);
      } else {
        alert("Valor inválido. O valor inicial do caixa será 0.");
        setCaixa(0);
        localStorage.setItem("caixa", 0);
      }
    }
  }, [caixa]);

  useEffect(() => {
    if (caixa !== null) {
      localStorage.setItem("caixa", caixa);
    }
  }, [caixa]);

  useEffect(() => {
    localStorage.setItem("compras", JSON.stringify(compras));
  }, [compras]);

  const finalizarCaixa = async () => {
    try {
      await addDoc(collection(db, "compras"), {
        data: new Date().toLocaleDateString(),
        caixa,
        compras
      });
      alert("Caixa finalizado e dados salvos com sucesso!");
      setCaixa(0);
      setCompras([]);
      localStorage.removeItem("caixa");
      localStorage.removeItem("compras");
    } catch (e) {
      console.error("Erro ao salvar os dados: ", e);
      alert("Erro ao salvar os dados.");
    }
  };

  const adicionarCompra = () => {
    if (!peso || isNaN(peso) || peso <= 0) {
      alert("Digite um peso válido.");
      return;
    }
    
    const valorCompra = materialSelecionado.preco * parseFloat(peso);
    let valorComDesconto = valorCompra;

    if (desconto && !isNaN(desconto) && desconto > 0){
      valorComDesconto -= parseFloat(desconto);
      if (valorComDesconto < 0) valorComDesconto = 0;
    }

    const novaCompra = {
      material: materialSelecionado.nome,
      peso: parseFloat(peso),
      valor: valorComDesconto.toFixed(2),
    };
    
    setCompras([...compras, novaCompra]);
    setCaixa(caixa - valorComDesconto);
    setPeso("");
    setDesconto("");
  };

  return (
    <div className="container">
      <h2 className="title">Controle de Compras - {new Date().toLocaleDateString()}</h2>
      
      <div className="balance">
        <p className="balance-text">Caixa: R$ {caixa !== null ? caixa.toFixed(2) : "0.00"}</p>
      </div>
      
      <div className="input-group">
        {/* Material */}
        <div className="input-item">
          <label className="label">Selecione o material:</label>
          <select
            className="input"
            value={materialSelecionado.nome}
            onChange={(e) =>
              setMaterialSelecionado(materiais.find(m => m.nome === e.target.value))
            }
          >
            {materiais.map((material, index) => (
              <option key={index} value={material.nome}>
                {material.nome} - R$ {material.preco}/kg
              </option>
            ))}
          </select>
        </div>

        {/* Peso */}
        <div className="input-item">
          <label className="label">Peso (kg):</label>
          <input
            type="number"
            className="input"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
          />
        </div>

        {/* Desconto */}
        <div className="input-item">
          <label className="label">Desconto (R$):</label>
          <input
            type="number"
            className="input"
            value={desconto}
            onChange={(e) => setDesconto(e.target.value)}
          />
        </div>
      </div>
      
      <button 
        className="button"
        onClick={adicionarCompra}
      >
        Adicionar Compra
      </button>
      
      <h2 className="subtitle">Compras do Dia</h2>
      <ul className="purchase-list">
        {compras.map((compra, index) => (
          <li key={index} className="purchase-item">
            {compra.peso}kg de {compra.material} - R$ {compra.valor}
          </li>
        ))}
      </ul>

      <button 
        className="button"
        onClick={finalizarCaixa}
      >
        Finalizar Caixa
      </button>
    </div>
  );
};

export default App;
