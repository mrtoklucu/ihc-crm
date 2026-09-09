# ZBT CRM — Devam Eden İşler

_Son güncelleme: 2026-09-08_

---

## 1. Eski leadlerin aktarımı — ✅ TAMAMLANDI (08.09.2026)

**6.879 lead Firestore'a aktarıldı.** Doğrulandı: `leadCount=6879`, durumu boş
kayıt yok, havuzda sadece 2 kayıt (PDF'te temsilcisi boş olan 2 satır).

- Kaynak: `Danisan_Listesi.pdf` (161 sayfa, 6.892 kayıt). Excel'e gerek kalmadı.
- `pdf_to_xlsx.mjs` PDF'i x-koordinatına göre sütunlara ayırıp
  `Danisan_Listesi.xlsx` üretir. `import_leads.mjs` onu CRM'e yazar.
- Kırpık değerler (`Organik/Kendisi …`) **ön ek eşlemesiyle** çözüldü; kapalı
  listede tek adaya düştüğü için güvenli. Eşleşmeyen değer sayısı: **0**.
- 6.892 → 6.879: 13 mükerrer telefon atlandı.
- Yeni kullanıcılar: Anar, Birnur Yaray, İlia, Lis Bayram, Olga Kocabaş, Şeyma
  (`legacy_*` id ile, aktif). `maxUsers` 10 → 15 yapıldı.

**Tekrar çalıştırılabilir** — telefon bazında mükerrer engeli var, ikinci kez
çalıştırmak kopya oluşturmaz.

### Aktarım sonrası kalan işler
- [ ] **6 yeni kullanıcının şifresi rastgele üretildi ve hiçbir yerde gösterilmedi.**
      Bu kişiler giriş yapacaksa Kullanıcılar sayfasından şifre belirlenmeli.
- [ ] Bu 6 kişinin **dili boş** → otomatik atamadan yeni lead almazlar.
      Almaları isteniyorsa dilleri işaretlenmeli.
- [ ] Geri alma gerekirse: aktarılan kayıtların hepsinde `importedFrom: 'legacy'`
      alanı var, tek sorguyla ayıklanabilir. (Şablona eklenen tek alan budur;
      6.879 kaydı geri alabilmek için bilerek bırakıldı.)

---

## 2. Mobil uygulama (kullanıcı erteledi: "sonra yapıcaz")

Hazır olan: Capacitor 8 kurulumu, `android/` klasörü, `capacitor.config.json`,
`AppCodeGate.jsx` (firma kodu ile giriş), `getTenantByAppCode`.

Eksik olanlar:
- [ ] **İstanbul Hair Center'ın `appCode` alanı BOŞ** → mobil giriş çalışmaz.
      Süper admin panelinden doldurulmalı. (Küçük iş, aktarımdan bağımsız.)
- [ ] Android Studio kurulumu (kullanıcının bilgisayarına)
- [ ] İmza keystore'u oluşturma (`.jks` **asla commit edilmeyecek**, gitignore'da)
- [ ] APK/AAB derleme
- [ ] Firebase App Distribution kurulumu (APK güncelleme dağıtımı)

---

## 3. Küçük eksikler

- [ ] `www.zbtcrmsys.com` için DNS kaydı yok (kök alan adı çalışıyor).
- ~~Test leadleri~~ — aktarım öncesi koleksiyon zaten boştu, sorun yok.
- ~~Commit edilmemiş değişiklikler~~ — hepsi `3754587` ile commit edildi,
      çalışma ağacı temiz. **Henüz push edilmedi.**
- [ ] Lead listesi 6.879 kaydın **tamamını tek seferde** çekiyor
      (`AppContext.jsx:95`, limitsiz `getDocs`). Şu an çalışıyor ama ilk açılış
      yavaş; kayıt sayısı artarsa sayfalama/sorgu tarafına taşınmalı.

---

## 4. Kullanıcının "gerek yok" dediği işler — istenmedikçe yapılmayacak

Webform mükerrer koruması · "Havuzu şimdi dağıt" butonu ·
`onSnapshot` ile anlık bildirim · entegrasyonların geri kalanı (8'in 6'sı sahte).

---

## 5. Veri dosyaları hakkında

`Danisan_Listesi.pdf` ve `Danisan_Listesi.xlsx` **gerçek hasta kayıtları**
içerdiği için `.gitignore`'a alındı; `seed.mjs` de aynı sebeple depodan çıkarıldı.
Dosyalar diskte duruyor, depoya girmiyor. Bu ayarı geri alma.

---

## Bu oturumda tamamlananlar (referans)

6.879 eski lead aktarıldı · domain taşıması doğrulandı ·
Global Web API endpoint'i (`/v1/leads/webform/:slug`) çalışır durumda ·
`firebase.json` rewrite `/v1/**` olarak düzeltildi ·
dile göre otomatik lead atama (4 dilde test edildi) · gerçek lead bildirimleri ·
admin paneli mobil uyumu · dokunma hedefleri büyütüldü · tüm şifre alanlarına göz ikonu.
