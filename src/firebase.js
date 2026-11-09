// Único lugar que inicializa o Firebase. Exporta:
//  - `app`: o app principal do Firebase;
//  - `auth`: login por e-mail e senha (sessão fica salva no aparelho);
//  - `db`: Firestore com cache local persistente (IndexedDB). É esse cache que
//    faz o app funcionar offline: as leituras vêm do cache e as escritas feitas
//    sem internet ficam na fila e sobem sozinhas quando a conexão volta.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

// Configuração pública do projeto Firebase (não é segredo: quem protege os
// dados são as regras do Firestore).
export const firebaseConfig = {
  apiKey: "AIzaSyDZHlOgkWzgaFcwebq9WLQwarqAt-bO48g",
  authDomain: "caixa-da-reciclagem.firebaseapp.com",
  projectId: "caixa-da-reciclagem",
  storageBucket: "caixa-da-reciclagem.firebasestorage.app",
  messagingSenderId: "559630262609",
  appId: "1:559630262609:web:9e0630e5c67229f92eb370",
  measurementId: "G-CB49YL8873",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
