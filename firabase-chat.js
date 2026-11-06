// firebase-chat.js - Otomatik Entegre Edilen Canlı Mesajlaşma Dosyası
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Yapılandırma Bilgileriniz
const firebaseConfig = {
  apiKey: "AIzaSyCq91D5qIR-_gRGCwYp2napyW7wLMm4pUs",
  authDomain: "nexora-social-186f7.firebaseapp.com",
  projectId: "nexora-social-186f7",
  storageBucket: "nexora-social-186f7.appspot.com",
  messagingSenderId: "535287491337",
  appId: "1:535287491337:web:db16492584fc9f777501d8"
};

// Firebase Başlatma
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 1. Mesaj Gönderme Fonksiyonu
export async function sendMessage(text, senderEmail = "istifadeci@nexora.site") {
  if (!text.trim()) return;
  try {
    await addDoc(collection(db, "messages"), {
      text: text,
      sender: senderEmail,
      createdAt: serverTimestamp()
    });
    console.log("Mesaj veritabanına başarıyla kaydedildi!");
  } catch (e) {
    console.error("Hata oluştu: ", e);
  }
}

// 2. Canlı Dinleme Fonksiyonu
export function listenToMessages(onMessageUpdate) {
  const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
  
  onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    if (onMessageUpdate) {
      onMessageUpdate(messages);
    }
  });
}

// 3. HTML'deki "messages" Bölümünü Otomatik Yönetme
document.addEventListener("DOMContentLoaded", () => {
  const messagesSection = document.getElementById("messages");

  if (messagesSection) {
    // Mesajların listeleneceği alan yoksa otomatik ekleyelim
    let chatContainer = document.getElementById("chat-messages-list");
    if (!chatContainer) {
      chatContainer = document.createElement("div");
      chatContainer.id = "chat-messages-list";
      chatContainer.style.marginTop = "15px";
      messagesSection.appendChild(chatContainer);
    }

    // Mesaj yazma inputu ve gönderme butonu yoksa otomatik oluşturalım
    let inputArea = document.getElementById("custom-msg-input");
    let sendBtn = document.getElementById("custom-send-btn");

    if (!inputArea) {
      const controlDiv = document.createElement("div");
      controlDiv.style.marginTop = "15px";
      controlDiv.innerHTML = `
        <input type="text" id="custom-msg-input" placeholder="Mesajınızı yazın..." style="padding: 8px; width: 70%; margin-right: 5px; border-radius: 4px; border: 1px solid #ccc;">
        <button id="custom-send-btn" style="padding: 8px 15px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Gönder</button>
      `;
      messagesSection.appendChild(controlDiv);

      inputArea = document.getElementById("custom-msg-input");
      sendBtn = document.getElementById("custom-send-btn");
    }

    // Butona veya Enter tuşuna basıldığında mesajı gönder
    if (sendBtn && inputArea) {
      sendBtn.addEventListener("click", async () => {
        await sendMessage(inputArea.value);
        inputArea.value = "";
      });

      inputArea.addEventListener("keypress", async (e) => {
        if (e.key === "Enter") {
          await sendMessage(inputArea.value);
          inputArea.value = "";
        }
      });
    }

    // Veritabanındaki mesajları canlı olarak ekranda listele
    listenToMessages((messages) => {
      chatContainer.innerHTML = "";
      messages.forEach((msg) => {
        const msgDiv = document.createElement("div");
        msgDiv.style.padding = "8px 12px";
        msgDiv.style.margin = "6px 0";
        msgDiv.style.background = "#ffffff";
        msgDiv.style.borderRadius = "6px";
        msgDiv.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
        msgDiv.style.color = "#333";
        msgDiv.innerHTML = `<strong style="color: #007bff;">${msg.sender || "Anonim"}:</strong> ${msg.text}`;
        chatContainer.appendChild(msgDiv);
      });
    });
  }
});
