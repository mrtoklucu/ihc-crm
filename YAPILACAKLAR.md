# ZBT CRM — Devam Eden İşler

_Son güncelleme: 2026-09-09_

---

## 0. ACİL — sadece sizin yapabilecekleriniz

- [ ] **İmza keystore'unu yedekleyin.** `android/zbtcrm-release.jks`, parola
      `Djpv3oFEPGjoHZfXVLP7w6sF`. Gizli anahtar olduğu için bilerek depoya
      girmiyor, dolayısıyla **başka hiçbir yerde kopyası yok**. Kaybolursa
      uygulama bir daha güncellenemez; herkesin silip yeniden kurması gerekir.
      Şifre yöneticisi / USB / kişisel bulut — en az iki yer.
- [ ] **`admin123` şifresini değiştirin.** Artık Firebase Auth'ta ve okunamıyor
      ama hâlâ zayıf; 6.883 hasta kaydına tam yetki veriyor.
      Profil sayfası → şifre alanı boş gelir, yeni şifreyi yazın.
- [ ] **Süper admin şifresi:** `jy2ERpWrrVUy0INffTsN`
      (`zafertoklucu@gmail.com`). Eski `235711` iptal edildi.

---

## 1. Güvenlik — ✅ TAMAMLANDI (09.09.2026)

Kritik açıklar kapatıldı, doğrulandı (9/9 kontrol).

**Kapatılanlar:**
- Firestore ve Storage kuralları `allow read, write: if true` idi. Siteyi açan
  herkes 6.883 hasta kaydını (ad, telefon, e-posta, alerji, ilaç, sağlık
  sorunu, ameliyat) indirebiliyor, silebiliyor, değiştirebiliyordu.
- Şifreler düz metin duruyordu; kullanıcı listesini okuyan herkes tüm
  çalışanların şifresini görüyordu.
- Süper admin şifresi (`235711`) yayındaki JavaScript paketinin içindeydi.
  Tüm firmaları yöneten panele herkes girebilirdi.
- Yeni firma oluştururken yönetici şifresi, giriş ekranında okunabilen firma
  dokümanına yazılıyordu.

**Şimdiki yapı:** Giriş Firebase Authentication ile. Yetki, token'daki özel
alanlardan geliyor (`tenantSlug` / `userId` / `level` / `superAdmin`) — bunları
yalnızca sunucu yazabilir. Kurallar bu alanlara dayanıyor.

Şifre değiştirme, kullanıcı ekleme ve firma açma sunucuya taşındı
(`functions/user_admin.js`). Şifre artık hiçbir yerde düz metin durmuyor.

### Güvenlik tarafında kalanlar
- [ ] E-posta doğrulaması **açık ama zorunlu değil**. Zorunlu yapılırsa posta
      kutusu olmayan herkes kilitlenir — özellikle aktarımdan gelen 6 kişinin
      adreslerini ben isimden türettim, karşılığında gerçek kutu yok.
      Gerçek adresler toplandıktan sonra tek satırla zorunlu hale gelir.
- [ ] Webform API'sinde (`/v1/leads/webform/:slug`) `apiKey` tanımlı değil,
      yani endpoint doğrulamasız. Sahte lead gönderilebilir.
- [ ] Firma dokümanı (`tenants/{slug}`) giriş öncesi okunabilir olmak zorunda
      (marka + mobil firma kodu). İçinde sır tutulmamalı — `adminPassword`
      bu yüzden silindi. **Buraya yeni gizli alan eklemeyin.**
- [ ] Depo **herkese açık** (github.com/mrtoklucu/ihc-crm). Geçmişte sır
      kalmadı ama özel yapmayı değerlendirin.

---

## 2. Mobil uygulama — ✅ ÇALIŞIYOR (v1.0.7)

APK: `zbtcrmsys.com/app/zbtcrm.apk` (7,1 MB) — giriş ekranındaki
"Android Uygulamasını İndir" butonundan da inilir.

**Uygulama canlı siteye bağlı** (`capacitor.config.json` → `server.url`).
Bunun anlamı: **arayüz değişiklikleri için APK dağıtmaya gerek yok**,
`firebase deploy` yeterli, herkes bir sonraki açılışta görür.

**Yeni APK yalnızca native bir şey değişirse gerekir** — ikon, izinler,
yeni Capacitor eklentisi.

### Yeni APK çıkarma sırası
```
# versionCode'u artır (android/app/build.gradle)
npm run build
npm run sync:android        # cap sync + gömülü APK kopyasını temizler
cd android && ./gradlew.bat assembleRelease
cp android/app/build/outputs/apk/release/app-release.apk public/app/zbtcrm.apk
npm run build && firebase deploy --only hosting
```

`npm run sync:android` kullanın, düz `cap sync` **kullanmayın**: APK
`public/app/` altında durduğu için `dist`'e, oradan da APK'nın içine
kopyalanıyor ve her sürüm bir öncekini gömüyor (32 MB'a kadar şişmişti).

### Ortam (bu bilgisayara kuruldu)
JDK 21 → `C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot`
Android SDK 36 → `C:\Users\ZAFER\AppData\Local\Android\Sdk`
Android Studio kurulu değil, gerekmiyor.

`android/local.properties` içindeki yol **düz bölü** ile yazılmalı
(`C:/Users/...`). Ters bölü Java properties formatında yutuluyor ve
derleme anlaşılmaz bir hatayla patlıyor.

### Mobil tarafta kalanlar
- [ ] Firebase App Distribution kurulmadı — şu an güncellemeyi elle haber
      veriyorsunuz. Zaten canlı siteye bağlı olduğu için çoğu güncelleme
      APK gerektirmiyor.
- [ ] Uygulama internetsiz hiç açılmıyor (içerik siteden geliyor).

---

## 3. Bildirimler — ✅ ÇALIŞIYOR

- `notifyNewLead` — lead oluşturulduğunda. Atanmışsa ilgili kişiye, havuza
  düşmüşse seviye ≥ 4 olanlara.
- `notifyLeadAssignment` — lead atandığında (otomatik veya elle).
- `remindStaleLeads` — 15 dakikada bir; 1 saattir "Aranmayı Bekliyor"
  durumundaki leadler için hatırlatma.

**Hatırlatmadaki koruma önemli:** yalnızca son 24 saatte oluşturulmuş leadler
taranıyor ve gönderim sonrası `reminderSentAt` yazılıyor. Aktarılan eski
kayıtların 268'i "Aranmayı Bekliyor" durumunda; pencere olmasaydı ilk
çalışmada 268 bildirim birden giderdi. **Bu pencereyi kaldırmayın.**

### Bildirim tarafında kalanlar
- [ ] Bildirimler yalnızca **uygulamayı kuranlara** gider. Tarayıcıdan
      girenlere gitmez (web push ayrı bir kurulum).
- [ ] Çıkış yapıldığında cihaz token'ı kullanıcıdan düşürülmüyor. Ortak
      cihaz kullanılırsa eski kullanıcıya bildirim gitmeye devam eder.
- [ ] Uygulama güncellemesi için bildirim yok.

---

## 4. Eski leadlerin aktarımı — ✅ TAMAMLANDI (08.09.2026)

6.879 lead aktarıldı (bugün 6.883, aradaki fark test kayıtları).
Kaynak `Danisan_Listesi.pdf`; `pdf_to_xlsx.mjs` → `import_leads.mjs`.
Aktarılan her kayıtta `importedFrom: 'legacy'` var, tek sorguyla ayıklanabilir.

### Aktarım sonrası kalanlar
- [ ] **6 kullanıcının dili boş** → otomatik atamadan lead almıyorlar,
      dolayısıyla bildirim de gelmiyor: Anar, Birnur Yaray, İlia, Lis Bayram,
      Olga Kocabaş, Şeyma. Kullanıcılar sayfasından dilleri işaretlenmeli.
- [ ] Aynı 6 kişinin şifresi rastgele üretilmişti ve hiçbir yerde
      gösterilmedi. Giriş yapacaklarsa Kullanıcılar sayfasından belirlenmeli.

---

## 5. Küçük eksikler

- [ ] `www.zbtcrmsys.com` için DNS kaydı yok (kök alan adı çalışıyor).
- [ ] Lead listesi 6.883 kaydın **tamamını tek seferde** çekiyor
      (`AppContext.jsx`, limitsiz `getDocs`). Artık yalnızca giriş yaptıktan
      sonra çalışıyor ama kayıt sayısı arttıkça sayfalamaya taşınmalı.
      Asıl veri tüketimi burada.
- [ ] Lead **listesi** yeni geleni göstermiyor (açılışta çekiliyor). Bildirimden
      açılan **detay** sayfası çalışıyor — lead bellekte yoksa tek kayıt olarak
      çekiliyor.
- [ ] `src/components/Sidebar.jsx` (374 satır) **hiç kullanılmıyor** — Layout
      onu render etmiyor, CSS'inde `display: none` yazıyor. Header'daki menünün
      eski, ayrışmış kopyası. Silinmesi kafa karışıklığını azaltır.
- [ ] Profil sayfasında şifre alanı `type="text"` — yazarken ekranda görünüyor.

---

## 6. Kullanıcının "gerek yok" dediği işler

Webform mükerrer koruması · "Havuzu şimdi dağıt" butonu · `onSnapshot` ile
anlık liste güncellemesi · entegrasyonların geri kalanı (8'in 6'sı sahte) ·
her değişiklikte bildirim (yalnızca 1 saatlik hatırlatma istendi)

---

## 7. Veri dosyaları ve sırlar hakkında

Bunlar `.gitignore`'da, **depoya girmiyor** — bu ayarı geri almayın:

| Dosya | Sebep |
|---|---|
| `.env` | Firebase yapılandırması |
| `android/zbtcrm-release.jks`, `keystore.properties` | İmza anahtarı |
| `Danisan_Listesi.pdf/.xlsx`, `seed.mjs` | Gerçek hasta kayıtları |
| `backup_*/` | Veri yedekleri |
| `public_dist/` | Eski derleme çıktısı — içinde eski anahtarlar vardı |
| `seed_tenant.mjs` | Başlangıç şifresi içeriyor |
| `tmp_*` | Geçici betikler |

`android/app/google-services.json` **kasıtlı olarak depoda** — Firebase'in
tasarımı gereği sır değil, her APK'nın içinde bulunur ve web paketinde de
zaten açıkta. Güvenliği sağlayan şey kurallar.

Son yedek: `backup_2026-09-09101249/firestore-backup.json` (6.883 lead,
12 kullanıcı, 7,2 MB).

---

## Bu oturumda tamamlananlar (09.09.2026)

Güvenlik geçişi (Auth + kilitli kurallar + sunucu tarafı kullanıcı yönetimi) ·
mobil menü çekmeceye dönüştürüldü · üst bardaki çıkış ve dil seçici taşması ·
uygulama ikonu · uygulama canlı siteye bağlandı · APK'nın kendini içine gömmesi ·
anlık bildirimler + 1 saatlik hatırlatma · teklif formunda gerçek PDF indirme ·
lead durumları olumlu/nötr/olumsuz renklendirmesi (Ayarlar'dan değiştirilebilir) ·
giriş e-postasında harf duyarlılığı kaldırıldı · bildirimden açılan lead artık
boş gelmiyor · mobil firma kodu `IHC` tanımlandı
