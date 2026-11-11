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
Supabase Dashboard → SQL Editor-də əvvəl `supabase-social-migration.sql`, sonra `supabase-messages-migration.sql`, ən sonda `supabase-social-enhancements.sql` fayllarını bu ardıcıllıqla icra et. Yenilənmiş enhancement faylı `nexora_story_likes` və `nexora_story_comments` cədvəllərini də `IF NOT EXISTS` ilə yoxlayıb yaradır; bu, əvvəlki miqrasiya qismən tətbiq olunubsa belə həmin “relation does not exist” xətasını aradan qaldırır. Bu miqrasiya hekayə bəyənmə/şərh cədvəllərini, `is_private`, izləmə istəkləri, bildirişlər, şərh cavabları və şərh bəyənmələri cədvəl/sütunlarını, eləcə də gizli profil üçün RLS qaydalarını yaradır.

**Qeyd:** Bu mühitdə Supabase layihənə qoşulub SQL miqrasiyasını icra etmək mümkün deyil. Buna görə ZIP-də frontend dəyişiklikləri və SQL miqrasiya faylı hazırdır; real iki hesabla bildiriş, gizli profil və izləmə sorğusu axınını canlı Supabase layihəndə SQL-i tətbiq etdikdən sonra yoxlamaq lazımdır.


## Post deletion policy

For the three-dot menu on your own posts, run `supabase-post-delete-policy.sql` once in Supabase SQL Editor. It permits deleting only rows owned by the signed-in user and optionally removes media only from that user's `post-media` folder.

## Hekayə şərhləri və silmə
- Hekayə baxışında **Şərhlər** düyməsi ekranın aşağı yarısında ayrıca panel açır və hekayənin vaxtını/video oynadılmasını dayandırır. Panel bağlananda hekayə qaldığı yerdən davam edir.
- Şərhlərdə müəllifin istifadəçi adı/adı görünür; şərhləri bəyənmək və onlara cavab yazmaq mümkündür.
- Öz hekayən üçün üç nöqtə menyusundan silmə təsdiqi açılır. Silmə yalnız hekayə sahibinə icazəlidir.
- Bu funksiyalar üçün Supabase SQL Editor-də `supabase-story-comments-delete.sql` faylını bir dəfə icra et.

## Ana səhifə və yeni paylaşım axını
- Ana səhifədə istifadəçi axtarışı çıxarılıb; axtarış yalnız ayrıca **İstifadəçilər** bölməsində qalır.
- Ana səhifə başlığının sağındakı **＋** düyməsi ayrıca **Yeni paylaşım** səhifəsini açır.
- Mətn, şəkil və video paylaşımı həmin səhifədəki formadan edilir; uğurlu paylaşım bitdikdən sonra istifadəçi ana səhifəyə qaytarılır.


## Dünya futbolu – genişləndirilmiş canlı oyunlar

- Canlı oyunlar bölməsi SofaScore futbol liqaları kataloqunu dinamik oxuyur.
- Kataloqda olan yerli liqalar, kuboklar, beynəlxalq klub turnirləri və milli komandaların yarışları üçün seçilmiş tarixə scoreboard sorğuları göndərilir.
- Sorğular məhdud paralelliklə aparılır; nəticələr 90 saniyədən bir yenilənir (yalnız Canlı oyunlar səhifəsi açıq olduqda).
- Liqa kataloqu əlçatan olmadıqda əsas liqalar və milli turnirlərdən ibarət ehtiyat siyahı istifadə olunur.
- Əhatə SofaScore kataloqu və həmin yarış üzrə scoreboard məlumatının mövcudluğu ilə məhdudlaşır; dünyadakı hər yerli/amator yarış üçün zəmanət verilmir.
- Oyun kartları hesab, komanda, status və matç məlumatlarını göstərir.

- Canlı oyunlar siyahısına Azərbaycan Premyer Liqası (Misli Premyer Liqası) üçün `aze.1` liqa identifikatoru əlavə edilib.

## Paylaşım bəyənmələrinin yadda saxlanması

Paylaşım bəyənmələrinin yenilənəndə itməməsi üçün `supabase-post-like-persistence.sql` faylını Supabase Dashboard → SQL Editor bölməsində bir dəfə icra edin. Bu miqrasiya istifadəçinin yalnız öz bəyənməsini əlavə etməsinə/silməsinə icazə verir və eyni paylaşım üçün təkrar bəyənmə yazılmasının qarşısını alır.


## Son yeniləmə: bəyənmələrin saxlanması və liqa səhifələri
- Paylaşım bəyənmələri Supabase `nexora_post_likes` cədvəlinə yazılır; yeniləmədən sonra bəyənmə həmin cədvəldən oxunur.
- Bu ZIP-dəki `supabase-post-like-persistence.sql` faylını Supabase Dashboard → SQL Editor-də bir dəfə icra edin. Bu addım unikal bəyənmə indeksini və SELECT/INSERT/DELETE RLS siyasətlərini qurur.
- Canlı oyunlar bölməsi artıq əvvəlcə liqa kataloqunu göstərir. Liqa seçildikdə yalnız seçilmiş liqanın oyunları və mövcuddursa turnir cədvəli yüklənir.
- Turnir cədvəli SofaScore turnir cədvəli endpoint-i ilə alınır; bəzi kuboklar və yarışlar üçün mənbədə cədvəl olmaya bilər.


## SofaScore məlumat mənbəyi

- Canlı oyunlar, liqalar və turnir cədvəlləri SofaScore məlumatlarından alınır.
- Liqa kataloqu `sport/football/unique-tournaments` endpoint-indən yüklənir.
- Liqa seçildikdə yalnız həmin liqanın cari mövsüm oyunları (`events/last` və `events/next`) və turnir cədvəli sorğulanır.
- SofaScore-un rəsmi açıq developer API-si yoxdur; bu inteqrasiya SofaScore veb tətbiqinin daxili, sənədləşdirilməmiş endpoint-lərindən istifadə edir. Endpoint-lər dəyişə, CORS və ya giriş məhdudiyyətləri yarana bilər. İctimai/kommersiya istifadəsi üçün SofaScore-dan icazə və ya lisenziyalı idman məlumatı provayderi tələb oluna bilər.

### SofaScore bağlantısı üçün Vercel qeydi
- Layihədə `api/sofascore.js` serverless proxy-si var. Frontend SofaScore sorğularını `/api/sofascore?path=...` ünvanına göndərir; beləliklə brauzerin CORS məhdudiyyəti aradan qaldırılır.
- Bu proxy Vercel-də işləyir. Layihəni yalnız GitHub Pages və ya sadə statik hostinqdə yerləşdirsəniz, `/api/sofascore` işləməyəcək; Vercel-ə deploy edin və ya eyni endpoint-i öz backend-inizdə yerləşdirin.
- SofaScore daxili endpoint-ləri rəsmi, zəmanətli API deyil. Provayderin anti-bot/rate-limit qaydaları dəyişərsə, server proxy-si də müvəqqəti cavab xətası verə bilər.


## Canlı oyun məlumatları

Canlı oyunlar Maçkolik-in açıq veb feed-indən `api/mackolik.js` Vercel serverless proxy-si vasitəsilə oxunur. Bu, rəsmi developer API deyil və Maçkolik giriş/rate-limit qaydalarını dəyişərsə işləməyə bilər. Liqa kataloqu cari günün oyun feed-ində görünən futbol liqalarından qurulur. Turnir cədvəli Maçkolik-in təqdim etdiyi beş liqa (Türkiyə, İngiltərə, İspaniya, İtaliya, Almaniya) üçün qoşulub; digər liqalarda cədvəl mənbədə mövcud olmaya bilər.


Vercel API funksiyası `api/mackolik.py` Python runtime-da işləyir və `requirements.txt` vasitəsilə `curl-cffi` quraşdırır (Chrome TLS impersonation). Layihəni Vercel-ə deploy edərkən Python function build-inin uğurlu olduğunu yoxlayın.


## 2026-11: API-Football futbol inteqrasiyası
Canlı oyunlar bölməsi artıq API-Football v3 proxy-si (`api/football.js`) ilə işləyir. Quraşdırma və APISPORTS_KEY mühit dəyişəni üçün `README-API-FOOTBALL-AZ.md` faylına baxın.


## Son futbol mənbəyi dəyişikliyi (API-Football)
Bu ZIP-dəki `api/football.js` və `script.js` yeni futbol inteqrasiyasını idarə edir və əvvəlki SofaScore/Maçkolik qeydlərini əvəz edir. Köhnə `api/sofascore.js` və `api/mackolik.py` faylları artıq istifadə edilmir. Vercel-də `APISPORTS_KEY` Environment Variable əlavə olunmalıdır; addımlar `README-API-FOOTBALL-AZ.md` faylındadır.


## Bildirişə klik → uyğun səhifə, şərh bəyənməsi
- **Bildirişin üstünə basanda** həmin hadisənin səhifəsi açılır:
  - paylaşıma şərh / cavab / şərh bəyənməsi → ayrıca **Paylaşım** səhifəsi açılır, şərhlər paneli açıq olur, həmin şərh tapılıb ekrana gətirilir və yaşıl rənglə vurğulanır;
  - paylaşım bəyənməsi → həmin paylaşım açılır;
  - hekayə bəyənməsi / hekayə şərhi / cavab → hekayə açılır, şərh bildirişində şərh paneli açılıb həmin şərh vurğulanır (hekayənin 24 saatı bitibsə bildirilir);
  - yeni izləyici / izləmə istəyi → həmin istifadəçinin profili;
  - proqnoz nəticəsi → Proqnozlarım səhifəsi.
  Geri düyməsi (və brauzerin geri düyməsi) bildirişlər siyahısına qaytarır. Köhnə formatda yazılmış bildirişlər də mümkün qədər düzgün yerə yönləndirilir.
- Bildirişlər artıq hədəfi `nexora_notifications.entity_id` sütununda saxlayır (`post:<id>`, `post:<id>|comment:<id>`, `story:<id>|comment:<id>`). **Yeni SQL tələb olunmur.**
- **Şərh bəyənməsi** artıq səhifə yenilənəndən sonra da qalır: bəyənmələr `nexora_comment_likes` cədvəlindən yüklənir, ürək qırmızı qalır və yanında bəyənmə sayı göstərilir. Yeni yazılan şərhi də dərhal bəyənmək/cavablamaq olur.
- Hekayə şərhinə cavab yazılanda şərhin sahibinə də bildiriş gedir.
