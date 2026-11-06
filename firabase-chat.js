// firebase-chat.js - Canlı Mesajlaşma Dəstəyi ilə Tam Fayl
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Sizin Firebase Konfiqurasiya Açarlarınız
const firebaseConfig = {
  apiKey: "AIzaSyCq91D5qIR-_gRGCwYp2napyW7wLMm4pUs",
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
export async function sendMessage(text, senderEmail = "istifadeci@nexora.site") {
  if (!text.trim()) return;
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

// 2. Canlı Dinləmə və Ekrana Yazdırma Funksiyası
export function listenToMessages(onMessageUpdate) {
  // Mesajları tarixə görə sıralayırıq
  const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
  
  onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    // Hər hansı yeni mesaj gələndə bu hissə işləyəcək
    if (onMessageUpdate) {
      onMessageUpdate(messages);
    }
  });
}

// 3. Avtomatik UI İdarəetməsi (Düymə və İnput bağlantısı)
document.addEventListener("DOMContentLoaded", () => {
  const sendBtn = document.getElementById("send-btn"); 
  const messageInput = document.getElementById("message-input"); 
  const messageContainer = document.getElementById("messages-container"); // Mesajların göründüyü yer

  // Göndərmə düyməsinə kliklədikdə
  if (sendBtn && messageInput) {
    sendBtn.addEventListener("click", async () => {
      await sendMessage(messageInput.value);
      messageInput.value = ""; // İnputu təmizlə
    });

    // Enter düyməsinə basdıqda da göndərsin
    messageInput.addEventListener("keypress", async (e) => {
      if (e.key === "Enter") {
        await sendMessage(messageInput.value);
        messageInput.value = "";
      }
    });
  }

  // Bazadan gələn mesajları avtomatik ekranda göstər
  listenToMessages((messages) => {
    if (messageContainer) {
      messageContainer.innerHTML = ""; // Köhnə siyahını təmizləyib yenidən yığır
      messages.forEach((msg) => {
        const msgDiv = document.createElement("div");
        msgDiv.className = "message-item";
        msgDiv.innerHTML = `<strong>${msg.sender || "Anonim"}:</strong> ${msg.text}`;
        messageContainer.appendChild(msgDiv);
      });
    }
  });
});
