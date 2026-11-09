# NEXORA — canlı futbol liqaları

## Vacib Vercel quruluşu
Vercel serverless funksiyasının düzgün tanınması üçün handler bu yerdə olmalıdır:

`api/football.js`

Frontend `/api/football?action=leagues` ünvanına sorğu göndərir.

## Deploy
- Bu qovluğun (`NEXORA-main`) içindəki BÜTÜN fayl və qovluqları GitHub repozitoriyasının kökünə yükləyin.
- GitHub-da `api/football.js` yolunun mövcudluğunu yoxlayın.
- Vercel → Project → Settings → General → Root Directory `./` olmalıdır (əgər repozitoriyanın kökünə NEXORA-main qovluğunun MƏZMUNUNU yükləmisinizsə).
- Əgər GitHub-da bütün fayllar `NEXORA-main/` alt qovluğundadırsa, Root Directory `NEXORA-main` seçin.
- Redeploy edin.

## Futbol məlumatları
SportScore-un açıq REST API-sindən istifadə edilir. API açarı tələb olunmur, lakin provayderin mövcudluğu və konkret liqa üzrə məlumat əhatəsi təmin edilmir. Azərbaycan turnirləri kataloqda əvvəl göstərilir; oyun və turnir cədvəli yalnız provayder məlumat təqdim etdikdə görünür.

Frontend faylları və mövcud Supabase sosial funksiyaları saxlanılıb.
