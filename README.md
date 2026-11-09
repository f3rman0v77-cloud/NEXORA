NEXORA — yenilənmiş profil və istifadəçi bölmələri

Dəyişikliklər
- Profilim səhifəsində yalnız şəxsi profil məlumatları və paylaşımlar saxlanılır.
- İzləyicilərim və İzlədiklərim sayları ayrıca iki seçimli siyahı səhifəsi açır.
- Sol menyuya ayrıca İstifadəçilər səhifəsi əlavə edilib; siyahı Supabase-dəki qeydiyyat profillərindən yüklənir və axtarış var.
- İstifadəçi adı və avatar digər profilə aparır; İzlə / İzləyirsən düyməsi Supabase follow cədvəlindən işləyir.
- Hekayə zolağı yalnız öz hekayəni və izlədiyin profillərin aktiv hekayələrini göstərir.
- Şəkil hekayəsi 10 saniyə, video hekayəsi videonun müddəti qədər göstərilir; 24 saatı keçən hekayələr sorğudan çıxarılır.
- Hekayə bəyənmə və şərh funksiyaları üçün Supabase cədvəlləri əlavə edilib.
- Paylaşım şərhləri həmin brauzerdə localStorage-da saxlanılır.
- Çıxış düyməsi Ayarlar bölməsinin aşağısına keçirilib; təsdiq dialoqu açılır. İmtina edəndə sessiya saxlanılır.
- Mesajlar yenidən hazırlandı: söhbətlər siyahısının yuxarısında uzun ＋ düyməsi var. Basanda saytdakı bütün istifadəçilər açılır; ad və ya istifadəçi adı yazıb axtarmaq olur. İstifadəçi seçilib mesaj göndərildikdən sonra söhbət ＋ düyməsinin altında (son mesaj, vaxt və oxunmamış sayı ilə) görünür.
- Mesajlar artıq Supabase-də saxlanılır (nexora_messages) — fərqli cihaz və brauzerlərdə işləyir, yeni mesaj real vaxtda gəlir, oxunmamış say sol menyuda göstərilir. Mesaja foto/video əlavə etmək (＋ düyməsi, yazı sahəsinin solunda) chat-media bucket-ə yüklənir.
- İzlə / İzləyirsən düyməsi səhifəni və siyahını yeniləmədən dərhal dəyişir (arxa planda Supabase-ə yazılır, xəta olsa geri qayıdır). İzləyici/İzlədiklər sayları də dərhal yenilənir.
- İzləyicilər və İzlədikləri siyahısı yenidən düzəldildi: solda profil şəkli, ortada ad və @istifadəçi adı, sağda İzlə / İzləyirsən düyməsi. Hər iki bölmənin sayı tabda görünür, tablar arasında keçid anidir.

Quraşdırma
1. ZIP-i açın və layihə fayllarını GitHub repozitoriyasındakı eyni adlı fayllarla əvəz edin.
2. Supabase Dashboard → SQL Editor bölməsində supabase-social-migration.sql, sonra isə YENİ supabase-messages-migration.sql faylının məzmununu icra edin (mesajlaşma bunsuz işləməyəcək).
3. SQL faylı nexora_stories.id sütununun UUID olduğunu fərz edir. Əgər sütunun tipi UUID deyilsə, həmin cədvəlləri yaratmazdan əvvəl story_id tipini uyğunlaşdırın.
4. Supabase Storage-də stories bucket mövcud olmalıdır.
5. GitHub-a commit/push edin; Vercel deploy-u tamamlandıqdan sonra iki ayrı hesabla test edin.

Vacib texniki məhdudiyyətlər
- Mövcud layihənin postları hələ localStorage-da saxlanılır (mesajlar artıq Supabase-dədir). Buna görə başqa cihazda və ya başqa brauzerdə avtomatik sinxronlaşmır; tam sosial şəbəkə səviyyəsində ortaq lent üçün postlar da ayrıca Supabase cədvəlinə köçürülməlidir. Köhnə localStorage mesajları yeni sistemə köçürülmür.
- Hekayələrin 24 saatdan sonra lentdə görünməməsi təmin olunur. Supabase Storage-dən köhnə faylların fiziki silinməsi üçün ayrıca planlaşdırılmış təmizləmə işi (scheduled Edge Function/cron) qurulmalıdır.
- Hekayə bəyənmə/şərh düymələri üçün SQL migration mütləq icra olunmalıdır.


## Yeni sosial funksiyalar (NEXORA yeniləməsi)
- Ayarlardakı qırmızı düymə artıq **Çıxış et** adlanır. Basıldıqda təsdiq pəncərəsi açılır; **Geri** seçimi sessiyanı saxlayır, təsdiq isə hesabdan çıxarıb giriş ekranına qaytarır.
- Bildiriş zəngi ayrıca **Bildirişlər** səhifəsini açır. İzləyici, izləmə istəyi, paylaşım/hekayə bəyənməsi, şərh və cavab hadisələri Supabase bildiriş cədvəlinə yazılır.
- Paylaşım şərhlərinə cavab yazmaq və şərhi bəyənmək əlavə olunub; bəyənmə ürəyi aktiv olduqda qırmızı rəng alır.
- Hekayə və paylaşım videolarında native idarəetmə paneli gizlədilib; paylaşım videosuna toxunmaqla oynat/pauza etmək mümkündür.
- Ayarlara Gizlilik bölməsi və Gizli hesab seçimi əlavə olunub. Gizli profilə izləmə istəyi göndərilir; profil sahibi istəyi qəbul və ya silə bilər. Gizli profilin paylaşımları, izləyici/izlədiyi siyahıları və hekayələri yalnız təsdiqlənmiş izləyicilərə açılır.

### Vacib: Supabase yenilənməsi
Supabase Dashboard → SQL Editor-də əvvəl mövcud `supabase-social-migration.sql` və `supabase-messages-migration.sql` miqrasiyalarını tətbiq etmisənsə, bundan sonra `supabase-social-enhancements.sql` faylını bütöv şəkildə icra et. Bu miqrasiya `is_private`, izləmə istəkləri, bildirişlər, şərh cavabları və şərh bəyənmələri cədvəl/sütunlarını, eləcə də gizli profil üçün RLS qaydalarını yaradır.

**Qeyd:** Bu mühitdə Supabase layihənə qoşulub SQL miqrasiyasını icra etmək mümkün deyil. Buna görə ZIP-də frontend dəyişiklikləri və SQL miqrasiya faylı hazırdır; real iki hesabla bildiriş, gizli profil və izləmə sorğusu axınını canlı Supabase layihəndə SQL-i tətbiq etdikdən sonra yoxlamaq lazımdır.
