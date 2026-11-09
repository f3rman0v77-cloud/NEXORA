# NEXORA – SportScore düzəlişi

## Əsas düzəliş
Əvvəlki arxivdə `football.js` layihənin kök qovluğunda idi. Vercel bu faylı `/api/football` serverless endpoint-i kimi tanımır. Fayl indi `api/football.js` yolundadır; frontend-in `/api/football` sorğusu ilə uyğunlaşdırılıb.

## Yerləşdirmə
GitHub repozitoriyasının kökündə bu struktur olmalıdır:
- `api/football.js`
- `index.html`
- `script.js`
- `styles.css`
- digər mövcud layihə faylları

Əgər arxivi açanda `NEXORA-main` qovluğu görünürsə, həmin qovluğun İÇİNDƏKİ bütün fayl və qovluqları repozitoriyanın kökünə yükləyin. `api` qovluğunu mütləq saxlayın. Sonra Vercel yeni deployment etməlidir.

## API davranışı və məhdudiyyət
- API açarı tələb olunmur.
- Liqalar SportScore-un rəsmi turnirlər kataloqundan oxunur; kataloq əlçatmaz olarsa Azərbaycan və əsas dünya turnirlərindən ibarət ehtiyat siyahı göstərilir.
- Oyunlar üçün SportScore-un sənədləşdirilmiş `/api/widget/matches/` endpoint-i istifadə olunur.
- Turnir cədvəli `/api/widget/standings/` endpoint-i ilə alınır.
- Provider-in sənədləşdirilmiş matches endpoint-i canlı və son oyunları qaytarır; hər liqa üçün gələcək bütün tarixlərin tam təqviminə zəmanət vermir.
- Provider konkret yarış üçün cədvəl və ya oyun qaytarmırsa, NEXORA saxta nəticə göstərmir.

SportScore atribusiya linki səhifədə saxlanılıb.
