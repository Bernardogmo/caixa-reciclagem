// filepath: /c:/Users/berna/Documents/treino-react/Controle-caixa-reciclagem/src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDZHlOgkWzgaFcwebq9WLQwarqAt-bO48g",
    authDomain: "caixa-da-reciclagem.firebaseapp.com",
    projectId: "caixa-da-reciclagem",
    storageBucket: "caixa-da-reciclagem.firebasestorage.app",
    messagingSenderId: "559630262609",
    appId: "1:559630262609:web:9e0630e5c67229f92eb370",
    measurementId: "G-CB49YL8873"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };