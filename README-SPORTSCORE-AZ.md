# NEXORA — SportScore futbol məlumatları

Bu versiya əvvəlki ESPN / SofaScore / Maçkolik / API-Football inteqrasiyalarını SportScore-un sənədləşdirilmiş ictimai REST API-si ilə əvəz edir. API açarı tələb olunmur.

## İstifadə
- `api/football.js` Vercel serverless endpoint-dir: `/api/football`.
- `action=leagues` kataloqu SportScore axtarış API-sindən formalaşdırır və Azərbaycan turnirlərini siyahının əvvəlində göstərir.
- `action=fixtures` yalnız seçilmiş liqanın seçilmiş tarixdəki oyunlarını alır.
- `action=standings` seçilmiş turnirin cədvəlini alır.
- Səhifədə SportScore-a tələb olunan görünən dofollow atribusiya linki var.

## Quraşdırma
1. Bu arxivi Vercel-də mövcud NEXORA layihəsinin mənbə kodu kimi yerləşdirin.
2. Root Directory `NEXORA-main` (və ya həmin qovluğun məzmununu kökə yükləyirsinizsə `./`) olmalıdır.
3. Vercel Node.js serverless funksiyalarını `api/football.js` faylından avtomatik qurur.
4. Heç bir API key və Environment Variable lazım deyil.

## Məlumat əhatəsi
SportScore sənədləri yüzlərlə liqa və turnir üzrə məlumat təqdim etdiyini bildirir. Kataloq bir neçə ölkə və region üzrə axtarışla doldurulur, həmçinin Azərbaycan Premyer Liqası, Birinci Liqa və Kubok üçün tanınmış slug-lar ilkin siyahıda var. Provayderdə konkret Azərbaycan turniri üçün faktiki oyun və ya turnir cədvəli məlumatı yoxdursa, həmin bölmə boş görünə bilər; bu, uydurma nəticə göstərməmək üçündür. Bütün dünyadakı hər bir turnirin əhatəsi zəmanətli deyil.

## Texniki qeyd
SportScore rəsmi API sənədləri: https://sportscore.com/developers/api/
API açarsız giriş, CORS və təxminən 10.000 sorğu/gün/IP limiti sənədlərdə göstərilib. İstifadə şərtlərinə uyğun olaraq səhifədə `Powered by SportScore` dofollow linki saxlanmalıdır.
