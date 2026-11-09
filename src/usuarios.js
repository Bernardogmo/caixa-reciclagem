// Login e contas de usuário.
//
// O Firebase Auth guarda e-mail/senha; quem tem acesso ao caixa é definido
// pelo documento usuarios/{uid} no Firestore:
//   { nome, email, papel: "admin" | "comum", criadoEm }
// Sem esse documento a pessoa consegue logar, mas não vê nada (as regras
// bloqueiam) — é assim que o gestor tira o acesso de alguém.
//
// Contas novas são criadas pelo gestor DENTRO do app. Para criar um usuário no
// Auth sem derrubar a sessão do gestor, usamos um app Firebase secundário só
// para a criação (o Auth guarda a sessão por app), e depois o descartamos.
import { deleteApp, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  inMemoryPersistence,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { auth, db, firebaseConfig } from "./firebase";

// ---------------------------------------------------------------- mensagens

// Traduz os erros do Firebase Auth para frases que qualquer um entende.
export function traduzirErroAuth(erro) {
  const codigo = erro?.code || "";
  switch (codigo) {
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "E-mail ou senha incorretos.";
    case "auth/invalid-email":
      return "Esse e-mail não parece certo. Confira e tente de novo.";
    case "auth/missing-password":
      return "Digite a senha.";
    case "auth/weak-password":
      return "A senha precisa ter pelo menos 6 letras ou números.";
    case "auth/email-already-in-use":
      return "Já existe uma conta com esse e-mail.";
    case "auth/network-request-failed":
      return "Sem internet. Na primeira vez em cada aparelho é preciso internet para entrar.";
    case "auth/too-many-requests":
      return "Muitas tentativas seguidas. Espere um pouco e tente de novo.";
    case "auth/user-disabled":
      return "Esta conta foi desativada.";
    case "auth/operation-not-allowed":
      return "O login por e-mail e senha ainda não está ligado no Firebase.";
    default:
      return `Não deu para completar. Tente de novo${codigo ? ` (${codigo})` : ""}.`;
  }
}

// ------------------------------------------------------------------- sessão

// Avisa quando alguém entra ou sai. Devolve a função para parar de ouvir.
export function observarSessao(aoMudar) {
  return onAuthStateChanged(auth, (usuario) => {
    aoMudar(usuario ? { uid: usuario.uid, email: usuario.email } : null);
  });
}

export async function entrar(email, senha) {
  const credencial = await signInWithEmailAndPassword(auth, email.trim(), senha);
  return credencial.user.uid;
}

export async function sair() {
  await signOut(auth);
}

export async function recuperarSenha(email) {
  await sendPasswordResetEmail(auth, email.trim());
}

// ------------------------------------------------------ perfil e permissão

// Acompanha o documento usuarios/{uid} (o papel pode mudar ou o acesso ser
// removido enquanto a pessoa usa). Chama com `null` se o documento não existe.
export function observarMeuUsuario(uid, aoMudar, aoFalhar) {
  return onSnapshot(
    doc(db, "usuarios", uid),
    (snap) => aoMudar(snap.exists() ? { uid, ...snap.data() } : null),
    (erro) => {
      if (aoFalhar) aoFalhar(erro);
    },
  );
}

// Lista de contas para a tela do gestor (em tempo real).
export function observarTodosUsuarios(aoMudar, aoFalhar) {
  return onSnapshot(
    collection(db, "usuarios"),
    (snap) => {
      const lista = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      lista.sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR"));
      aoMudar(lista);
    },
    (erro) => {
      if (aoFalhar) aoFalhar(erro);
    },
  );
}

// ---------------------------------------------------------- criar/remover

// Cria a conta no Auth e o documento em usuarios/{uid}. Só funciona logado
// como admin (as regras barram o resto).
export async function criarUsuario({ nome, email, senha, papel }) {
  const nomeApp = `criacao-conta-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const secundario = initializeApp(firebaseConfig, nomeApp);
  try {
    const authSecundario = getAuth(secundario);
    // Sessão só na memória: não encosta na sessão do gestor neste aparelho.
    await setPersistence(authSecundario, inMemoryPersistence);
    const credencial = await createUserWithEmailAndPassword(authSecundario, email.trim(), senha);
    await setDoc(doc(db, "usuarios", credencial.user.uid), {
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      papel,
      criadoEm: new Date().toISOString(),
    });
    return credencial.user.uid;
  } finally {
    try {
      await signOut(getAuth(secundario));
    } catch {
      // sem sessão para encerrar — segue em frente
    }
    await deleteApp(secundario).catch(() => {});
  }
}

// Tira o acesso: apaga usuarios/{uid}. A conta do Auth continua existindo,
// mas sem o documento a pessoa não lê nem grava nada.
export async function removerAcesso(uid) {
  await deleteDoc(doc(db, "usuarios", uid));
}
