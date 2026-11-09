(() => {
    const LOCALES = { az: "az-AZ", en: "en-GB", ru: "ru-RU", tr: "tr-TR" };
    const ROWS = [
        // [az, en, ru, tr]
        ["NEXORA — Sosial platforma", "NEXORA — Social platform", "NEXORA — Социальная платформа", "NEXORA — Sosyal platform"],
        ["SƏNİN İCMA, SƏNİN DÜNYAN", "YOUR COMMUNITY, YOUR WORLD", "ТВОЁ СООБЩЕСТВО, ТВОЙ МИР", "SENİN TOPLULUĞUN, SENİN DÜNYAN"],
        ["Welcome", "Welcome", "Добро пожаловать", "Hoş geldin"],
        ["Xoş gəlmisən", "Welcome back", "С возвращением", "Hoş geldin"],
        ["Hesabını yarat", "Create your account", "Создай аккаунт", "Hesabını oluştur"],
        ["Hesabına daxil ol və söhbətə qoşul.", "Sign in to your account and join the conversation.", "Войди в аккаунт и присоединяйся к общению.", "Hesabına giriş yap ve sohbete katıl."],
        ["NEXORA icmasına qoşulmaq üçün qeydiyyatdan keç.", "Sign up to join the NEXORA community.", "Зарегистрируйся, чтобы присоединиться к NEXORA.", "NEXORA topluluğuna katılmak için kaydol."],
        ["Giriş", "Sign in", "Вход", "Giriş"],
        ["Qeydiyyat", "Sign up", "Регистрация", "Kayıt"],
        ["Ad və soyad", "Full name", "Имя и фамилия", "Ad ve soyad"],
        ["Məsələn, Aysel Əliyeva", "e.g. Aysel Aliyeva", "Например, Айсель Алиева", "Örneğin, Aysel Aliyeva"],
        ["İstifadəçi adı", "Username", "Имя пользователя", "Kullanıcı adı"],
        ["istifadeci_adi", "username", "имя_пользователя", "kullanici_adi"],
        ["Şifrə", "Password", "Пароль", "Şifre"],
        ["Ən azı 4 simvol", "At least 4 characters", "Не менее 4 символов", "En az 4 karakter"],
        ["Daxil ol", "Sign in", "Войти", "Giriş yap"],
        ["Qeydiyyatdan keç", "Sign up", "Зарегистрироваться", "Kaydol"],
        ["Demo hesab məlumatları yalnız bu brauzerdə saxlanılır.", "Demo account data is stored only in this browser.", "Данные демо-аккаунта хранятся только в этом браузере.", "Demo hesap bilgileri yalnızca bu tarayıcıda saklanır."],
        ["NEXORA ana səhifə", "NEXORA home", "Главная NEXORA", "NEXORA ana sayfa"],
        ["Paylaşımlarda axtar...", "Search posts...", "Поиск по публикациям...", "Gönderilerde ara..."],
        ["Paylaşımlarda axtarış", "Search posts", "Поиск по публикациям", "Gönderilerde arama"],
        ["Bildirişlər", "Notifications", "Уведомления", "Bildirimler"],
        ["Hələ bildiriş yoxdur.", "No notifications yet.", "Уведомлений пока нет.", "Henüz bildirim yok."],
        ["Tünd rejim", "Dark mode", "Тёмный режим", "Koyu mod"],
        ["İşıqlı rejim", "Light mode", "Светлый режим", "Açık mod"],
        ["Profilə keç", "Go to profile", "Перейти в профиль", "Profile git"],
        ["Çıxış", "Log out", "Выйти", "Çıkış"],
        ["NEXORA istifadəçisi", "NEXORA user", "Пользователь NEXORA", "NEXORA kullanıcısı"],
        ["Əsas menyu", "Main menu", "Главное меню", "Ana menü"],
        ["Ana səhifə", "Home", "Главная", "Ana sayfa"],
        ["Canlı oyunlar", "Live games", "Live-матчи", "Canlı maçlar"],
        ["Anketlər", "Polls", "Опросы", "Anketler"],
        ["Mesajlar", "Messages", "Сообщения", "Mesajlar"],
        ["Profilim", "My profile", "Мой профиль", "Profilim"],
        ["NEXORA əyləncə və idman müzakirəsi üçündür. Real pul mərcləri yoxdur.", "NEXORA is for entertainment and sports talk. No real-money betting.", "NEXORA — для развлечения и обсуждения спорта. Никаких ставок на реальные деньги.", "NEXORA eğlence ve spor sohbeti içindir. Gerçek para bahsi yoktur."],
        ["NEXORA İCMASI", "NEXORA COMMUNITY", "СООБЩЕСТВО NEXORA", "NEXORA TOPLULUĞU"],
        ["İstifadəçi axtar...", "Search users...", "Поиск пользователей...", "Kullanıcı ara..."],
        ["İstifadəçi axtar", "Search users", "Поиск пользователей", "Kullanıcı ara"],
        ["Hekayən", "Your story", "Твоя история", "Hikayen"],
        ["Nə düşünürsən? Oyun və ya video paylaş...", "What's on your mind? Share a game or a video...", "О чём думаешь? Поделись матчем или видео...", "Ne düşünüyorsun? Maç veya video paylaş..."],
        ["Foto/video əlavə et", "Add photo/video", "Добавить фото/видео", "Fotoğraf/video ekle"],
        ["İdman söhbətinə qoşul", "Join the sports talk", "Присоединяйся к спортивному чату", "Spor sohbetine katıl"],
        ["Paylaş", "Post", "Опубликовать", "Paylaş"],
        ["Başqalarının lenti", "Others' feed", "Лента других", "Diğerlerinin akışı"],
        ["Lenti çeşidlə", "Sort feed", "Сортировать ленту", "Akışı sırala"],
        ["Ən yenilər", "Newest", "Новые", "En yeniler"],
        ["Ən populyar", "Most popular", "Популярные", "En popüler"],
        ["Hələ paylaşım yoxdur. İlk paylaşımı sən et.", "No posts yet. Be the first to post.", "Публикаций пока нет. Будь первым.", "Henüz gönderi yok. İlk gönderiyi sen paylaş."],
        ["PULSUZ PROQNOZLAR", "FREE PREDICTIONS", "БЕСПЛАТНЫЕ ПРОГНОЗЫ", "ÜCRETSİZ TAHMİNLER"],
        ["Oyun mərkəzi", "Game center", "Игровой центр", "Maç merkezi"],
        ["DEMO · REAL PUL YOXDUR", "DEMO · NO REAL MONEY", "ДЕМО · БЕЗ РЕАЛЬНЫХ ДЕНЕГ", "DEMO · GERÇEK PARA YOK"],
        ["Oyunları tarixə görə seç", "Choose games by date", "Выбор матчей по дате", "Maçları tarihe göre seç"],
        ["Bu gün", "Today", "Сегодня", "Bugün"],
        ["Sabah", "Tomorrow", "Завтра", "Yarın"],
        ["Canlı indi", "Live now", "Сейчас в эфире", "Şimdi canlı"],
        ["Tarix", "Date", "Дата", "Tarih"],
        ["Oyunların tarixini seç", "Choose the game date", "Выбери дату матчей", "Maç tarihini seç"],
        ["Liqa və ya klub axtar...", "Search league or club...", "Поиск лиги или клуба...", "Lig veya kulüp ara..."],
        ["Liqa və ya klub axtar", "Search league or club", "Поиск лиги или клуба", "Lig veya kulüp ara"],
        ["Liqaya görə süz", "Filter by league", "Фильтр по лиге", "Lige göre filtrele"],
        ["Bütün liqalar", "All leagues", "Все лиги", "Tüm ligler"],
        ["Yenilə", "Refresh", "Обновить", "Yenile"],
        ["Oyunlar yüklənir…", "Loading games…", "Загрузка матчей…", "Maçlar yükleniyor…"],
        ["Pulsuz virtual proqnozlardır — real pul, ödəniş və uduş yoxdur.", "These are free virtual predictions — no real money, payments or winnings.", "Это бесплатные виртуальные прогнозы — без реальных денег, платежей и выигрышей.", "Bunlar ücretsiz sanal tahminlerdir — gerçek para, ödeme veya kazanç yoktur."],
        ["Anketlər bölməsi tezliklə yenilənəcək.", "The polls section will be updated soon.", "Раздел опросов скоро обновится.", "Anketler bölümü yakında güncellenecek."],
        ["ƏLAQƏDƏ QAL", "STAY IN TOUCH", "ОСТАВАЙСЯ НА СВЯЗИ", "İLETİŞİMDE KAL"],
        ["Qeydiyyatdan keçmiş istifadəçi axtar...", "Search registered users...", "Поиск зарегистрированных пользователей...", "Kayıtlı kullanıcı ara..."],
        ["Hələ başqa hesab yoxdur.", "No other accounts yet.", "Других аккаунтов пока нет.", "Henüz başka hesap yok."],
        ["Söhbət seçilməyib", "No chat selected", "Чат не выбран", "Sohbet seçilmedi"],
        ["NEXORA mesajları", "NEXORA messages", "Сообщения NEXORA", "NEXORA mesajları"],
        ["Mesaj göndərmək üçün başqa qeydiyyatdan keçmiş hesab seç.", "Choose another registered account to send a message.", "Выбери другой зарегистрированный аккаунт, чтобы отправить сообщение.", "Mesaj göndermek için başka bir kayıtlı hesap seç."],
        ["Foto və ya video əlavə et", "Add a photo or video", "Добавить фото или видео", "Fotoğraf veya video ekle"],
        ["Mesajını yaz...", "Write your message...", "Напиши сообщение...", "Mesajını yaz..."],
        ["Mesajını yaz", "Write your message", "Напиши сообщение", "Mesajını yaz"],
        ["Mesaj göndər", "Send message", "Отправить сообщение", "Mesaj gönder"],
        ["Yeni mesaj", "New message", "Новое сообщение", "Yeni mesaj"],
        ["Ad və ya istifadəçi adı yaz...", "Type a name or username...", "Введи имя или логин...", "Ad veya kullanıcı adı yaz..."],
        ["İstifadəçi axtar", "Search user", "Найти пользователя", "Kullanıcı ara"],
        ["Mesaj yazmaq üçün sol yuxarıdakı ＋ düyməsinə bas və istifadəçi seç.", "To write a message, press the ＋ button at the top left and choose a user.", "Чтобы написать, нажми кнопку ＋ слева вверху и выбери пользователя.", "Mesaj yazmak için sol üstteki ＋ düğmesine bas ve kullanıcı seç."],
        ["Söhbət boşdur. İlk mesajı sən göndər.", "The chat is empty. Send the first message.", "Чат пуст. Отправь первое сообщение.", "Sohbet boş. İlk mesajı sen gönder."],
        ["Yüklənir...", "Loading...", "Загрузка...", "Yükleniyor..."],
        ["İstifadəçi tapılmadı.", "No user found.", "Пользователь не найден.", "Kullanıcı bulunamadı."],
        ["Hələ izləyici yoxdur.", "No followers yet.", "Пока нет подписчиков.", "Henüz takipçi yok."],
        ["Hələ heç kimi izləmir.", "Not following anyone yet.", "Пока ни на кого не подписан.", "Henüz kimseyi takip etmiyor."],
        ["İzlədikləri", "Following", "Подписки", "Takip ettikleri"],
        ["Geri", "Back", "Назад", "Geri"],
        ["SƏNİN HESABIN", "YOUR ACCOUNT", "ТВОЙ АККАУНТ", "SENİN HESABIN"],
        ["Ayarlar", "Settings", "Настройки", "Ayarlar"],
        ["İdman həvəskarı ⚽", "Sports fan ⚽", "Любитель спорта ⚽", "Spor tutkunu ⚽"],
        ["İdman həvəskarı", "Sports fan", "Любитель спорта", "Spor tutkunu"],
        ["Paylaşım", "Posts", "Публикации", "Gönderi"],
        ["İzləyici", "Followers", "Подписчики", "Takipçi"],
        ["İzlədiklərim", "Following", "Подписки", "Takip ettiklerim"],
        ["İstifadəçilər", "Users", "Пользователи", "Kullanıcılar"],
        ["Paylaşımlarım", "My posts", "Мои публикации", "Gönderilerim"],
        ["Lentdə paylaşım etdikcə onlar burada görünəcək.", "Your posts will appear here as you share them.", "Твои публикации появятся здесь.", "Paylaştıkça gönderilerin burada görünecek."],
        ["Etdiyim mərclər", "My predictions", "Мои прогнозы", "Tahminlerim"],
        ["Proqnozları nəticəyə görə süz", "Filter predictions by result", "Фильтр прогнозов по результату", "Tahminleri sonuca göre filtrele"],
        ["Hamısı", "All", "Все", "Tümü"],
        ["Uğurlu", "Won", "Успешные", "Başarılı"],
        ["Uğursuz", "Lost", "Неудачные", "Başarısız"],
        ["Gözlənilən", "Pending", "Ожидаются", "Bekleyen"],
        ["Hələ proqnoz etməmisən.", "You haven't made any predictions yet.", "Ты ещё не делал прогнозов.", "Henüz tahmin yapmadın."],
        ["Geri", "Back", "Назад", "Geri"],
        ["HESAB", "ACCOUNT", "АККАУНТ", "HESAP"],
        ["Bağla", "Close", "Закрыть", "Kapat"],
        ["Ayarlar bölmələri", "Settings sections", "Разделы настроек", "Ayar bölümleri"],
        ["Profil məlumatları", "Profile info", "Данные профиля", "Profil bilgileri"],
        ["Ad, istifadəçi adı və statistika", "Name, username and stats", "Имя, имя пользователя и статистика", "Ad, kullanıcı adı ve istatistikler"],
        ["Profili redaktə et", "Edit profile", "Редактировать профиль", "Profili düzenle"],
        ["İstifadəçi adı, bio və profil şəkli", "Username, bio and profile photo", "Имя пользователя, био и фото профиля", "Kullanıcı adı, biyografi ve profil fotoğrafı"],
        ["Şifrəni dəyiş", "Change password", "Сменить пароль", "Şifreyi değiştir"],
        ["Hesabının təhlükəsizliyi", "Your account security", "Безопасность аккаунта", "Hesap güvenliğin"],
        ["Dil", "Language", "Язык", "Dil"],
        ["Bizimlə əlaqə", "Contact us", "Связаться с нами", "Bize ulaşın"],
        ["Sual, təklif və ya problem bildir", "Send a question, suggestion or issue", "Вопрос, предложение или проблема", "Soru, öneri veya sorun bildir"],
        ["Paylaşımlar", "Posts", "Публикации", "Gönderiler"],
        ["İzləyicilər", "Followers", "Подписчики", "Takipçiler"],
        ["Bio", "Bio", "Био", "Biyografi"],
        ["Özün haqqında qısa məlumat", "A short note about yourself", "Коротко о себе", "Kendin hakkında kısa bilgi"],
        ["Profil şəkli", "Profile photo", "Фото профиля", "Profil fotoğrafı"],
        ["Şəkil 1 MB-dan kiçik olmalıdır.", "Image must be smaller than 1 MB.", "Изображение должно быть меньше 1 МБ.", "Görsel 1 MB'tan küçük olmalıdır."],
        ["Profil şəkli önizləməsi", "Profile photo preview", "Предпросмотр фото профиля", "Profil fotoğrafı önizlemesi"],
        ["Ləğv et", "Cancel", "Отмена", "İptal"],
        ["Yadda saxla", "Save", "Сохранить", "Kaydet"],
        ["Hazırkı şifrə", "Current password", "Текущий пароль", "Mevcut şifre"],
        ["Yeni şifrə", "New password", "Новый пароль", "Yeni şifre"],
        ["Yeni şifrəni təkrarla", "Repeat new password", "Повтори новый пароль", "Yeni şifreyi tekrarla"],
        ["Şifrəni yenilə", "Update password", "Обновить пароль", "Şifreyi güncelle"],
        ["Sualın, təklifin və ya problemin var? Bizə yaz, ən qısa zamanda cavab verək.", "Have a question, suggestion or problem? Write to us and we'll reply as soon as possible.", "Есть вопрос, предложение или проблема? Напиши нам — мы ответим как можно скорее.", "Sorun, önerin veya bir problemin mi var? Bize yaz, en kısa sürede yanıt verelim."],
        ["E-poçt", "Email", "Эл. почта", "E-posta"],
        ["İş saatları", "Working hours", "Часы работы", "Çalışma saatleri"],
        ["Hər gün, 09:00 – 21:00", "Every day, 09:00 – 21:00", "Ежедневно, 09:00 – 21:00", "Her gün, 09:00 – 21:00"],
        ["Mövzu", "Subject", "Тема", "Konu"],
        ["Məsələn, hesab problemi", "e.g. account issue", "Например, проблема с аккаунтом", "Örneğin, hesap sorunu"],
        ["Mesaj", "Message", "Сообщение", "Mesaj"],
        ["Göndər", "Send", "Отправить", "Gönder"],
        ["NEXORA icması", "NEXORA community", "Сообщество NEXORA", "NEXORA topluluğu"],
        ["Burada yalnız istifadəçilərin yaratdığı paylaşımlar görünür. Saxta profil və statistika yoxdur.", "Only user-created posts appear here. No fake profiles or stats.", "Здесь только публикации пользователей. Никаких фейковых профилей и статистики.", "Burada yalnızca kullanıcıların oluşturduğu gönderiler görünür. Sahte profil ve istatistik yok."],
        ["NEXORA · Pulsuz sosial-idman platforması", "NEXORA · Free social sports platform", "NEXORA · Бесплатная социально-спортивная платформа", "NEXORA · Ücretsiz sosyal spor platformu"],
        ["Real pul mərci yoxdur.", "No real-money betting.", "Никаких ставок на реальные деньги.", "Gerçek para bahsi yok."],
        // dynamic strings
        ["Uyğun istifadəçi tapılmadı.", "No matching users found.", "Подходящих пользователей не найдено.", "Eşleşen kullanıcı bulunamadı."],
        ["İzləmək üçün başqa hesab yoxdur.", "No other accounts to follow.", "Нет других аккаунтов для подписки.", "Takip edilecek başka hesap yok."],
        ["İzləyirsən", "Following", "Вы подписаны", "Takip ediliyor"],
        ["İzlə", "Follow", "Подписаться", "Takip et"],
        ["Paylaşılan foto", "Shared photo", "Опубликованное фото", "Paylaşılan fotoğraf"],
        ["İstifadəçi adı 3–24 simvol olmalı, yalnız hərf, rəqəm, nöqtə və _ istifadə etməlidir.", "Username must be 3–24 characters and use only letters, numbers, dots and _.", "Имя пользователя: 3–24 символа, только буквы, цифры, точка и _.", "Kullanıcı adı 3–24 karakter olmalı, yalnızca harf, rakam, nokta ve _ içermelidir."],
        ["Zəhmət olmasa adını daxil et.", "Please enter your name.", "Пожалуйста, введи имя.", "Lütfen adını gir."],
        ["Şifrə ən azı 4 simvol olmalıdır.", "Password must be at least 4 characters.", "Пароль должен быть не менее 4 символов.", "Şifre en az 4 karakter olmalıdır."],
        ["Bu istifadəçi adı artıq qeydiyyatdan keçib.", "This username is already registered.", "Это имя пользователя уже занято.", "Bu kullanıcı adı zaten kayıtlı."],
        ["NEXORA hesabın yaradıldı!", "Your NEXORA account has been created!", "Твой аккаунт NEXORA создан!", "NEXORA hesabın oluşturuldu!"],
        ["İstifadəçi adı və ya şifrə yanlışdır.", "Incorrect username or password.", "Неверное имя пользователя или пароль.", "Kullanıcı adı veya şifre yanlış."],
        ["Şərh yaz", "Comment", "Комментировать", "Yorum yap"],
        ["Şərh yaz...", "Write a comment...", "Напиши комментарий...", "Yorum yaz..."],
        ["Mesajla paylaş", "Share via message", "Поделиться в сообщении", "Mesajla paylaş"],
        ["Başqa istifadəçilər paylaşım etdikcə onlar burada görünəcək.", "Posts from other users will appear here.", "Здесь появятся публикации других пользователей.", "Diğer kullanıcılar paylaştıkça burada görünecek."],
        ["Hələ paylaşım etməmisən.", "You haven't posted yet.", "Ты ещё ничего не публиковал.", "Henüz gönderi paylaşmadın."],
        ["Ev sahibi qələbəsi", "Home win", "Победа хозяев", "Ev sahibi galibiyeti"],
        ["Heç-heçə", "Draw", "Ничья", "Beraberlik"],
        ["Qonaq qələbəsi", "Away win", "Победа гостей", "Deplasman galibiyeti"],
        ["Proqnoz uğurlu oldu", "Prediction won", "Прогноз сыграл", "Tahmin tuttu"],
        ["Proqnoz uğursuz oldu", "Prediction lost", "Прогноз не сыграл", "Tahmin tutmadı"],
        ["Bu bölmədə proqnoz yoxdur.", "No predictions in this section.", "В этом разделе нет прогнозов.", "Bu bölümde tahmin yok."],
        ["Hələ proqnoz etməmisən. Oyun mərkəzindən pulsuz seçim et.", "No predictions yet. Make a free pick in the game center.", "Прогнозов пока нет. Сделай бесплатный выбор в игровом центре.", "Henüz tahmin yapmadın. Maç merkezinden ücretsiz seçim yap."],
        ["Nəticə seçimi", "Result pick", "Выбор исхода", "Sonuç seçimi"],
        ["Heyət və əmsal məlumatı açıq mənbədə təqdim edilmir.", "Lineup and odds data are not available from the open source.", "Составы и коэффициенты недоступны в открытом источнике.", "Kadro ve oran bilgisi açık kaynakta sunulmuyor."],
        ["Hazırda canlı oyun yoxdur.", "No live games right now.", "Сейчас нет live-матчей.", "Şu anda canlı maç yok."],
        ["Bu tarix üçün oyun tapılmadı.", "No games found for this date.", "На эту дату матчей не найдено.", "Bu tarih için maç bulunamadı."],
        ["BAŞA ÇATIB", "FINISHED", "ЗАВЕРШЁН", "BİTTİ"],
        ["CANLI", "LIVE", "LIVE", "CANLI"],
        ["Məlumat yoxdur", "No data", "Нет данных", "Bilgi yok"],
        ["Məkan", "Venue", "Стадион", "Stadyum"],
        ["Şəhər", "City", "Город", "Şehir"],
        ["Matç statusu", "Match status", "Статус матча", "Maç durumu"],
        ["Oyun detalları", "Match details", "Детали матча", "Maç detayları"],
        ["Detalları bağla", "Hide details", "Скрыть детали", "Detayları kapat"],
        ["Oyun başa çatıb — artıq proqnoz qəbul edilmir.", "Match finished — predictions are closed.", "Матч завершён — прогнозы больше не принимаются.", "Maç bitti — artık tahmin kabul edilmiyor."],
        ["Oyun başlayıb — artıq proqnoz qəbul edilmir.", "Match started — predictions are closed.", "Матч начался — прогнозы больше не принимаются.", "Maç başladı — artık tahmin kabul edilmiyor."],
        ["Pulsuz proqnoz et", "Make free prediction", "Сделать бесплатный прогноз", "Ücretsiz tahmin yap"],
        ["Pulsuz proqnoz etmək üçün hesabına daxil ol.", "Sign in to make a free prediction.", "Войди, чтобы сделать бесплатный прогноз.", "Ücretsiz tahmin için hesabına giriş yap."],
        ["Əvvəlcə bu bazarda seçim et.", "Make a pick in this market first.", "Сначала сделай выбор на этом рынке.", "Önce bu markette seçim yap."],
        ["Oyun məlumatı yenilənmədi. Tarixi yenilə.", "Match data not refreshed. Refresh the date.", "Данные матча не обновлены. Обнови дату.", "Maç bilgisi güncellenmedi. Tarihi yenile."],
        ["Oyun başlayıb və ya bitib — proqnoz bağlanıb.", "Match started or finished — predictions closed.", "Матч начался или завершён — прогнозы закрыты.", "Maç başladı veya bitti — tahmin kapandı."],
        ["Bu seçim artıq qeydə alınıb.", "This pick is already saved.", "Этот выбор уже сохранён.", "Bu seçim zaten kaydedildi."],
        ["Proqnozu yadda saxlamaq mümkün olmadı.", "Couldn't save the prediction.", "Не удалось сохранить прогноз.", "Tahmin kaydedilemedi."],
        ["Pulsuz proqnoz qeydə alındı.", "Free prediction saved.", "Бесплатный прогноз сохранён.", "Ücretsiz tahmin kaydedildi."],
        ["Əvvəlcə nəticə seç.", "Choose a result first.", "Сначала выбери исход.", "Önce sonuç seç."],
        ["Oyun məlumatı yenilənmədi. Yenidən cəhd et.", "Match data not refreshed. Try again.", "Данные матча не обновлены. Попробуй снова.", "Maç bilgisi güncellenmedi. Tekrar dene."],
        ["Oyun başlayıb və ya başa çatıb — proqnoz qəbul edilmir.", "Match started or finished — predictions not accepted.", "Матч начался или завершён — прогнозы не принимаются.", "Maç başladı veya bitti — tahmin kabul edilmiyor."],
        ["Bu oyun üçün nəticə proqnozunu artıq etmisən.", "You've already predicted this match result.", "Ты уже сделал прогноз на исход этого матча.", "Bu maç için sonuç tahminini zaten yaptın."],
        ["İngiltərə Premyer Liqası", "England Premier League", "Английская Премьер-лига", "İngiltere Premier Ligi"],
        ["İspaniya La Liqası", "Spain La Liga", "Испанская Ла Лига", "İspanya La Liga"],
        ["Almaniya Bundesliqası", "Germany Bundesliga", "Немецкая Бундеслига", "Almanya Bundesliga"],
        ["İtaliya Serie A", "Italy Serie A", "Итальянская Серия A", "İtalya Serie A"],
        ["Türkiyə Super Liqası", "Turkey Super Lig", "Турецкая Суперлига", "Türkiye Süper Lig"],
        ["Portuqaliya Primeira Liqası", "Portugal Primeira Liga", "Португальская Примейра-лига", "Portekiz Primeira Liga"],
        ["UEFA Çempionlar Liqası", "UEFA Champions League", "Лига чемпионов УЕФА", "UEFA Şampiyonlar Ligi"],
        ["UEFA Avropa Liqası", "UEFA Europa League", "Лига Европы УЕФА", "UEFA Avrupa Ligi"],
        ["Başlamayı gözləyir", "Not started", "Ожидает начала", "Başlaması bekleniyor"],
        ["Oyun məlumatını yükləmək alınmadı. İnternet bağlantısını yoxlayıb yenilə.", "Couldn't load match data. Check your connection and refresh.", "Не удалось загрузить данные матча. Проверь соединение и обнови.", "Maç bilgisi yüklenemedi. Bağlantını kontrol edip yenile."],
        ["Oyun məlumatına qoşulmaq mümkün olmadı. İnternet bağlantısını yoxlayın.", "Couldn't connect to match data. Check your connection.", "Не удалось подключиться к данным матчей. Проверь соединение.", "Maç verisine bağlanılamadı. Bağlantınızı kontrol edin."],
        ["Yalnız foto və video əlavə etmək olar.", "Only photos and videos can be added.", "Можно добавлять только фото и видео.", "Yalnızca fotoğraf ve video eklenebilir."],
        ["Demo üçün fayl 2 MB-dan kiçik olmalıdır.", "For the demo, files must be under 2 MB.", "Для демо файл должен быть меньше 2 МБ.", "Demo için dosya 2 MB'tan küçük olmalıdır."],
        ["Faylı oxumaq mümkün olmadı.", "Couldn't read the file.", "Не удалось прочитать файл.", "Dosya okunamadı."],
        ["Mətn və ya foto/video əlavə et.", "Add text or a photo/video.", "Добавь текст или фото/видео.", "Metin veya fotoğraf/video ekle."],
        ["Brauzer yaddaşı doludur. Daha kiçik fayl seç.", "Browser storage is full. Choose a smaller file.", "Память браузера заполнена. Выбери файл поменьше.", "Tarayıcı belleği dolu. Daha küçük bir dosya seç."],
        ["Paylaşım dərc olundu.", "Post published.", "Публикация опубликована.", "Gönderi yayınlandı."],
        ["Hələ başqa hesab yoxdur. Eyni brauzerdə başqa hesab qeydiyyatdan keçdikdən sonra burada görünəcək.", "No other accounts yet. They will appear here once another account registers in this browser.", "Других аккаунтов пока нет. Они появятся здесь после регистрации в этом браузере.", "Henüz başka hesap yok. Bu tarayıcıda başka hesap kaydolunca burada görünecek."],
        ["Söhbət boşdur. İlk mesajı sən göndər.", "The chat is empty. Send the first message.", "Чат пуст. Отправь первое сообщение.", "Sohbet boş. İlk mesajı sen gönder."],
        ["Əvvəlcə mesaj göndərmək üçün hesab seç.", "Choose an account to message first.", "Сначала выбери аккаунт для сообщения.", "Önce mesaj göndermek için hesap seç."],
        ["Mesajla paylaşmaq üçün əvvəl Mesajlar bölməsində hesab seç.", "To share via message, first choose an account in Messages.", "Чтобы поделиться, сначала выбери аккаунт в разделе Сообщения.", "Mesajla paylaşmak için önce Mesajlar bölümünde hesap seç."],
        ["Bu media brauzer yaddaşına sığmadı.", "This media didn't fit in browser storage.", "Этот файл не поместился в память браузера.", "Bu medya tarayıcı belleğine sığmadı."],
        ["Paylaşım söhbətə göndərildi.", "Post sent to the chat.", "Публикация отправлена в чат.", "Gönderi sohbete gönderildi."],
        ["Şəkli oxumaq mümkün olmadı.", "Couldn't read the image.", "Не удалось прочитать изображение.", "Görsel okunamadı."],
        ["Bu istifadəçi adı artıq istifadə olunur.", "This username is already in use.", "Это имя пользователя уже используется.", "Bu kullanıcı adı zaten kullanılıyor."],
        ["Dəyişiklikləri yadda saxlamaq mümkün olmadı.", "Couldn't save changes.", "Не удалось сохранить изменения.", "Değişiklikler kaydedilemedi."],
        ["Profil məlumatların yeniləndi.", "Your profile has been updated.", "Профиль обновлён.", "Profil bilgilerin güncellendi."],
        ["Hekayə/video paylaşmaq üçün paylaşım sahəsinə foto və ya video əlavə et.", "To share a story/video, add a photo or video to the post box.", "Чтобы поделиться историей/видео, добавь фото или видео в поле публикации.", "Hikaye/video paylaşmak için gönderi alanına fotoğraf veya video ekle."],
        ["Hazırkı şifrə yanlışdır.", "Current password is incorrect.", "Текущий пароль неверен.", "Mevcut şifre yanlış."],
        ["Yeni şifrə ən azı 4 simvol olmalıdır.", "New password must be at least 4 characters.", "Новый пароль должен быть не менее 4 символов.", "Yeni şifre en az 4 karakter olmalıdır."],
        ["Yeni şifrələr eyni deyil.", "New passwords don't match.", "Новые пароли не совпадают.", "Yeni şifreler aynı değil."],
        ["Yeni şifrə köhnə şifrədən fərqli olmalıdır.", "New password must differ from the old one.", "Новый пароль должен отличаться от старого.", "Yeni şifre eskisinden farklı olmalıdır."],
        ["Şifrən uğurla dəyişdirildi.", "Your password was changed successfully.", "Пароль успешно изменён.", "Şifren başarıyla değiştirildi."],
        ["E-poçt tətbiqi açılır...", "Opening email app...", "Открывается почтовое приложение...", "E-posta uygulaması açılıyor..."],
        ["Profil şəkli üçün foto faylı seç.", "Choose an image file for your profile photo.", "Выбери изображение для фото профиля.", "Profil fotoğrafı için bir görsel seç."],
        ["Profil şəkli 1 MB-dan kiçik olmalıdır.", "Profile photo must be smaller than 1 MB.", "Фото профиля должно быть меньше 1 МБ.", "Profil fotoğrafı 1 MB'tan küçük olmalıdır."]
    ];
    const PREFIXES = [
        ["Dil seçildi: ", "Language selected: ", "Выбран язык: ", "Dil seçildi: "],
        ["Sənin pulsuz seçimin: ", "Your free pick: ", "Твой бесплатный выбор: ", "Ücretsiz seçimin: "],
        ["Paylaşım: ", "Post: ", "Публикация: ", "Gönderi: "],
        ["Seçimin: ", "Your pick: ", "Твой выбор: ", "Seçimin: "],
        ["Nəticə ", "Result ", "Счёт ", "Sonuç "],
        ["Əmsal ", "Odds ", "Коэф. ", "Oran "]
    ];
    ROWS.push(
        ["Şərhlər", "Comments", "Комментарии", "Yorumlar"],
        ["Şərh əlavə et...", "Add a comment...", "Добавить комментарий...", "Yorum ekle..."],
        ["Cavabla", "Reply", "Ответить", "Yanıtla"],
        ["İstək göndərildi", "Request sent", "Запрос отправлен", "İstek gönderildi"],
        ["Qəbul et", "Accept", "Принять", "Kabul et"],
        ["Ləğv et", "Cancel", "Отменить", "İptal et"],
        ["Yeni izləyici", "New follower", "Новый подписчик", "Yeni takipçi"],
        ["İzləmə istəyi", "Follow request", "Запрос на подписку", "Takip isteği"],
        ["Yeni bəyənmə", "New like", "Новая отметка «Нравится»", "Yeni beğeni"],
        ["Hekayə bəyənildi", "Story liked", "История понравилась", "Hikaye beğenildi"],
        ["Yeni şərh", "New comment", "Новый комментарий", "Yeni yorum"],
        ["Hekayəyə şərh", "Story comment", "Комментарий к истории", "Hikaye yorumu"],
        ["Şərhə cavab", "Reply to comment", "Ответ на комментарий", "Yoruma yanıt"],
        ["Profil şəkli", "Profile photo", "Фото профиля", "Profil fotoğrafı"],
        ["Paylaşımlar yüklənir...", "Loading posts...", "Загрузка публикаций...", "Gönderiler yükleniyor..."],
        ["Profil məlumatı yüklənmədi.", "Profile information could not be loaded.", "Не удалось загрузить данные профиля.", "Profil bilgileri yüklenemedi."],
        ["İzləmə istəyi yoxdur.", "No follow requests.", "Запросов на подписку нет.", "Takip isteği yok."],
        ["Gizli hesaba izləmə istəyi göndərildi.", "Follow request sent to the private account.", "Запрос на подписку отправлен в закрытый аккаунт.", "Gizli hesaba takip isteği gönderildi."],
        ["İzləmə istəyi qəbul edildi.", "Follow request accepted.", "Запрос на подписку принят.", "Takip isteği kabul edildi."],
        ["İzləmə istəyi ləğv edildi.", "Follow request cancelled.", "Запрос на подписку отменён.", "Takip isteği iptal edildi."],
        ["İstək qəbul edilmədi.", "The request could not be accepted.", "Не удалось принять запрос.", "İstek kabul edilemedi."],
        ["Əməliyyat alınmadı.", "The action failed.", "Не удалось выполнить действие.", "İşlem başarısız oldu."],
        ["Bu izləmə istəyi artıq mövcud deyil.", "This follow request no longer exists.", "Этот запрос на подписку больше не существует.", "Bu takip isteği artık mevcut değil."],
        ["Paylaşım söhbətə göndərildi.", "Post sent to chat.", "Публикация отправлена в чат.", "Gönderi sohbete gönderildi."],
        ["SƏNİN İCMAN", "YOUR COMMUNITY", "ТВОЁ СООБЩЕСТВО", "SENİN TOPLULUĞUN"],
        ["və ya", "or", "или", "veya"],
        ["Continue with Google", "Continue with Google", "Продолжить с Google", "Google ile devam et"],
        ["Hesab məlumatları yalnız NEXORA-da saxlanılır.", "Account information is stored only by NEXORA.", "Данные аккаунта хранятся только в NEXORA.", "Hesap bilgileri yalnızca NEXORA'da saklanır."],
        ["İzləyicilərim", "My followers", "Мои подписчики", "Takipçilerim"],
        ["← Geri", "← Back", "← Назад", "← Geri"],
        ["İstifadəçilər yüklənir...", "Loading users...", "Загрузка пользователей...", "Kullanıcılar yükleniyor..."],
        ["Gizlilik", "Privacy", "Конфиденциальность", "Gizlilik"],
        ["Hesabının görünmə qaydaları", "Who can see your account", "Настройки видимости аккаунта", "Hesabının görünürlük ayarları"],
        ["Gizli hesab", "Private account", "Закрытый аккаунт", "Gizli hesap"],
        ["Aktiv olduqda yalnız təsdiqlədiyin izləyicilər paylaşımlarını və izləmə siyahılarını görə bilər.", "When enabled, only approved followers can see your posts and following lists.", "Если включено, только одобренные подписчики смогут видеть ваши публикации и подписки.", "Etkin olduğunda yalnızca onayladığın takipçiler gönderilerini ve takip listelerini görebilir."],
        ["İzləmə istəkləri", "Follow requests", "Запросы на подписку", "Takip istekleri"],
        ["Hesabdan çıxmaq istədiyinizə əminsiniz?", "Are you sure you want to log out?", "Вы уверены, что хотите выйти?", "Çıkış yapmak istediğinden emin misin?"],
        ["Yenidən daxil olmaq üçün bir daha giriş etməlisiniz.", "You'll need to sign in again to continue.", "Чтобы продолжить, вам нужно будет войти снова.", "Devam etmek için yeniden giriş yapman gerekecek."],
        ["İmtina et", "Cancel", "Отмена", "Vazgeç"],
        ["Bəli, çıxış et", "Yes, log out", "Да, выйти", "Evet, çıkış yap"],
        ["Paylaşımları yükləmək mümkün olmadı.", "Couldn't load posts.", "Не удалось загрузить публикации.", "Gönderiler yüklenemedi."],
        ["Hesaba yenidən daxil ol.", "Please sign in again.", "Пожалуйста, войдите снова.", "Lütfen yeniden giriş yap."],
        ["Mesajlar yüklənmədi.", "Messages couldn't be loaded.", "Не удалось загрузить сообщения.", "Mesajlar yüklenemedi."],
        ["Fayl 20 MB-dan kiçik olmalıdır.", "File must be smaller than 20 MB.", "Файл должен быть меньше 20 МБ.", "Dosya 20 MB'tan küçük olmalıdır."],
        ["Əvvəlcə ＋ düyməsi ilə istifadəçi seç.", "First choose a user with the ＋ button.", "Сначала выберите пользователя кнопкой ＋.", "Önce ＋ düğmesiyle kullanıcı seç."],
        ["Bəyənmək mümkün olmadı.", "Couldn't like this.", "Не удалось поставить отметку «Нравится».", "Beğenilemedi."],
        ["Paylaşmaq üçün əvvəl ＋ düyməsi ilə istifadəçi seç.", "Choose a user with ＋ before sharing.", "Перед отправкой выберите пользователя кнопкой ＋.", "Paylaşmak için önce ＋ düğmesiyle kullanıcı seç."],
        ["Gizlilik ayarı serverdə yadda saxlanmadı. SQL yenilənməsini tətbiq et.", "Privacy setting wasn't saved on the server. Apply the SQL update.", "Настройка приватности не сохранена на сервере. Примените обновление SQL.", "Gizlilik ayarı sunucuya kaydedilmedi. SQL güncellemesini uygulayın."],
        ["Video açıla bilmədi.", "Couldn't open the video.", "Не удалось открыть видео.", "Video açılamadı."],
        ["Hekayə açıla bilmədi.", "Couldn't open the story.", "Не удалось открыть историю.", "Hikaye açılamadı."],
        ["Hekayəni bəyənmək mümkün olmadı.", "Couldn't like the story.", "Не удалось оценить историю.", "Hikaye beğenilemedi."],
        ["Hekayə linki kopyalandı.", "Story link copied.", "Ссылка на историю скопирована.", "Hikaye bağlantısı kopyalandı."],
        ["Bu brauzerdə paylaşma dəstəklənmir.", "Sharing isn't supported in this browser.", "Этот браузер не поддерживает отправку.", "Bu tarayıcıda paylaşım desteklenmiyor."],
        ["Hekayəni paylaşmaq mümkün olmadı.", "Couldn't share the story.", "Не удалось поделиться историей.", "Hikaye paylaşılamadı."],
        ["Hekayə paylaşılmadı. Yenidən yoxla.", "Story wasn't shared. Try again.", "История не опубликована. Попробуйте ещё раз.", "Hikaye paylaşılmadı. Tekrar dene."],
        ["Yalnız şəkil və video seçə bilərsən.", "You can only choose an image or video.", "Можно выбрать только фото или видео.", "Yalnızca fotoğraf veya video seçebilirsin."],
        ["Supabase bağlantısı tapılmadı.", "Supabase connection wasn't found.", "Подключение к Supabase не найдено.", "Supabase bağlantısı bulunamadı."],
        ["Hekayə uğurla paylaşıldı!", "Story shared successfully!", "История успешно опубликована!", "Hikaye başarıyla paylaşıldı!"],
        ["Profil açıla bilmədi.", "Couldn't open the profile.", "Не удалось открыть профиль.", "Profil açılamadı."],
        ["Hesaba daxil olmalısan.", "You need to sign in.", "Необходимо войти в аккаунт.", "Giriş yapmalısın."],
        ["Paylaşım seçimləri", "Post options", "Параметры публикации", "Gönderi seçenekleri"],
        ["Sil", "Delete", "Удалить", "Sil"],
        ["Paylaşımı silmək istədiyinizə əminsiniz?", "Are you sure you want to delete this post?", "Вы уверены, что хотите удалить эту публикацию?", "Bu gönderiyi silmek istediğinizden emin misiniz?"],
        ["Bu paylaşım silinəcək və geri qaytarmaq mümkün olmayacaq.", "This post will be deleted and can't be restored.", "Эта публикация будет удалена без возможности восстановления.", "Bu gönderi silinecek ve geri alınamayacak."],
        ["Geri", "Back", "Назад", "Geri"],
        ["Bəli, sil", "Yes, delete", "Да, удалить", "Evet, sil"],
        ["Silinir...", "Deleting...", "Удаление...", "Siliniyor..."],
        ["Paylaşım silindi.", "Post deleted.", "Публикация удалена.", "Gönderi silindi."],
        ["Bu paylaşımı silmək icazən yoxdur.", "You aren't allowed to delete this post.", "У вас нет разрешения удалить эту публикацию.", "Bu gönderiyi silme iznin yok."],
        ["Yalnız öz paylaşımını silə bilərsən.", "You can only delete your own posts.", "Вы можете удалять только свои публикации.", "Yalnızca kendi gönderilerini silebilirsin."],
        ["Paylaşımı silmək mümkün olmadı.", "Couldn't delete the post.", "Не удалось удалить публикацию.", "Gönderi silinemedi."]
    );
    const INDEX = { en: 1, ru: 2, tr: 3 };
    const dictionary = new Map(ROWS.map(row => [row[0], row]));
    const SKIP = ".post-copy, .nx-profile-bio, .chat-person-details, #profileName, #sidebarName, #sidebarHandle, #profileBio, #infoName, #infoUsername, #infoBio, .follow-user-details, script, style, textarea";
    const ATTRS = ["placeholder", "aria-label", "title", "alt", "data-title"];
    let language = localStorage.getItem("nexoraLanguage") || "az";

    function translateCore(text) {
        if (language === "az" || !text) return text;
        const column = INDEX[language];
        const row = dictionary.get(text);
        if (row) return row[column];
        for (const prefix of PREFIXES) {
            if (text.startsWith(prefix[0])) return prefix[column] + translateCore(text.slice(prefix[0].length));
        }
        if (text.includes(" · ")) {
            const parts = text.split(" · ");
            const translated = parts.map(translateCore);
            if (translated.some((part, i) => part !== parts[i])) return translated.join(" · ");
        }
        const notices = [
            [/^(@\S+) səni izləməyə başladı\.?$/, ["$1 started following you.", "$1 подписался(-ась) на вас.", "$1 seni takip etmeye başladı."]],
            [/^(@\S+) səni izləmək istəyir\.?$/, ["$1 wants to follow you.", "$1 хочет подписаться на вас.", "$1 seni takip etmek istiyor."]],
            [/^(@\S+) izləmə istəyini qəbul etdi\.?$/, ["$1 accepted your follow request.", "$1 принял(-а) ваш запрос на подписку.", "$1 takip isteğini kabul etti."]],
            [/^(@\S+) paylaşımını bəyəndi\.?$/, ["$1 liked your post.", "$1 оценил(-а) вашу публикацию.", "$1 gönderini beğendi."]],
            [/^(@\S+) videonu bəyəndi\.?$/, ["$1 liked your video.", "$1 оценил(-а) ваше видео.", "$1 videonu beğendi."]],
            [/^(@\S+) hekayəni bəyəndi\.?$/, ["$1 liked your story.", "$1 оценил(-а) вашу историю.", "$1 hikayeni beğendi."]],
            [/^(@\S+) hekayənə şərh yazdı(?::.*)?$/, ["$1 commented on your story.", "$1 прокомментировал(-а) вашу историю.", "$1 hikayene yorum yaptı."]]
        ];
        for (const [pattern, variants] of notices) {
            const match = text.match(pattern);
            if (match) return variants[column - 1].replace("$1", match[1]);
        }
        return text;
    }
    function translate(text) {
        if (language === "az" || !text) return text;
        const match = text.match(/^([^\p{L}\p{N}]*)([\s\S]*?)([\s.…!?:]*)$/u);
        if (!match || !match[2]) return text;
        const [, lead, core, tail] = match;
        const direct = dictionary.get(core + tail.trim());
        if (direct) return lead + direct[INDEX[language]] + tail.replace(tail.trim(), "");
        const translated = translateCore(core);
        return translated === core ? text : lead + translated + tail;
    }

    const textSource = new WeakMap();
    const textApplied = new WeakMap();
    const attrSource = new WeakMap();
    function processText(node) {
        if (!node.parentElement || node.parentElement.closest(SKIP)) return;
        if (textApplied.get(node) !== node.nodeValue) textSource.set(node, node.nodeValue);
        const source = textSource.get(node);
        if (!source || !source.trim()) return;
        const next = translate(source);
        textApplied.set(node, next);
        if (node.nodeValue !== next) node.nodeValue = next;
    }
    function processAttributes(element) {
        if (element.tagName !== "TEXTAREA" && element.closest?.(SKIP)) return;
        let store = attrSource.get(element);
        ATTRS.forEach(attr => {
            if (!element.hasAttribute(attr)) return;
            const current = element.getAttribute(attr);
            if (!store) { store = {}; attrSource.set(element, store); }
            const saved = store[attr];
            if (!saved || saved.applied !== current) store[attr] = { source: current };
            const next = translate(store[attr].source);
            store[attr].applied = next;
            if (current !== next) element.setAttribute(attr, next);
        });
    }
    function processTree(root) {
        if (root.nodeType === Node.TEXT_NODE) return processText(root);
        if (root.nodeType !== Node.ELEMENT_NODE) return;
        processAttributes(root);
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
            if (node.nodeType === Node.TEXT_NODE) processText(node);
            else processAttributes(node);
        }
    }

    let titleSource = document.title;
    function applyAll() {
        document.documentElement.lang = language;
        processTree(document.body);
        document.title = translate(titleSource);
    }
    function setLanguage(code) {
        language = INDEX[code] ? code : "az";
        applyAll();
    }

    document.addEventListener("DOMContentLoaded", () => {
        titleSource = document.title;
        applyAll();
        new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === "characterData") processText(mutation.target);
                else if (mutation.type === "attributes") processAttributes(mutation.target);
                else mutation.addedNodes.forEach(processTree);
            });
        }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    });

    window.nexoraI18n = {
        setLanguage,
        t: translate,
        get language() { return language; },
        get locale() { return LOCALES[language] || LOCALES.az; }
    };
})();

