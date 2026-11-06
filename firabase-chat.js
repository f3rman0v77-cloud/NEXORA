// firebase-chat.js - Tam və Hazır Fayl

// Firebase Modulları (Birbaşa CDN-dən yüklənir)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Sizin Firebase Konfiqurasiya Açarlarınız
const firebaseConfig = {
  apiKey: "SİZİN_APİ_KEY", // Firebase paneldən aldığınız API key-i bura yazın
  authDomain: "nexora-social-186f7.firebaseapp.com",
  projectId: "nexora-social-186f7",
  storageBucket: "nexora-social-186f7.appspot.com",
  messagingSenderId: "535287491337",
  appId: "1:535287491337:web:db16492584fc9f777501d8"
};

// Firebase-i başladırıq
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 1. Mesaj Göndərmə Funksiyası
export async function sendMessage(text, senderEmail = "nexora@user.com") {
  try {
    await addDoc(collection(db, "messages"), {
      text: text,
      sender: senderEmail,
      createdAt: serverTimestamp()
    });
    console.log("Mesaj bazaya uğurla yazıldı!");
  } catch (e) {
    console.error("Xəta baş verdi: ", e);
  }
}

// 2. Real-time (Canlı) Dinləmə Funksiyası
export function listenMessages(updateUIcallback) {
  onSnapshot(collection(db, "messages"), (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    // Mesajlar yenilənəndə bu hissə işləyəcək
    if (updateUIcallback) updateUIcallback(messages);
  });
}

// 3. HTML-dəki düymə və inputları avtomatik idarə etmək üçün
document.addEventListener("DOMContentLoaded", () => {
  // Qeyd: Saytınızdakı input və düymənin ID-ləri fərqlidirsə, aşağıdakıları dəyişə bilərsiniz
  const sendBtn = document.getElementById("send-btn"); 
  const messageInput = document.getElementById("message-input"); 

  if (sendBtn && messageInput) {
    sendBtn.addEventListener("click", async () => {
      const text = messageInput.value.trim();
      if (text) {
        await sendMessage(text);
        messageInput.value = ""; // Göndərəndən sonra inputu təmizləyir
      }
    });
  }
});
