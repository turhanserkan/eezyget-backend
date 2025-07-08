# SpotIndir v2 - Wireframe Tasarımı

## Ana Sayfa Yapısı

```
┌─────────────────────────────────────────────────────────────┐
│                     HEADER                                  │
│  🎵 SpotIndir    [🇹🇷 TR] [🇺🇸 EN]                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   HERO SECTION                             │
│                                                             │
│           [H1] Spotify & YouTube İndirici                  │
│    [Subtitle] Müzik ve videoları ücretsiz indirin          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [INPUT] Link buraya yapıştırın...          [İNDİR] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│         [🎵 Kalite] [📱 Cihazlar] [⚡ Hızlı] [🔒 Güvenli]   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                DOWNLOAD OPTIONS PANEL                      │
│ (Link girildikten sonra görünür)                           │
│                                                             │
│  ┌─ FORMAT SEÇIMI ──────────────────────────────────────┐  │
│  │  ○ Audio (MP3)    ○ Video (MP4)                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ KALİTE SEÇİMİ ──────────────────────────────────────┐  │
│  │  Audio: [64] [128] [192] [256] [320] kbps           │  │
│  │  Video: [144p] [240p] [360p] [480p] [720p] [1080p]  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ ÖNIZLEME ───────────────────────────────────────────┐  │
│  │  🎵 [Şarkı Adı - Sanatçı]                           │  │
│  │  ⏱️ 3:45 | 📊 ~8.2 MB | 🗓️ 2024                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│               [🔄 HAZIRLA] [📥 İNDİR]                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  SUPPORTED PLATFORMS                       │
│                                                             │
│  [Spotify] [YouTube] [Instagram] [TikTok] [SoundCloud]     │
│                    + Daha fazlası                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    HOW TO USE                              │
│                                                             │
│  [1] Link Kopyala  [2] Kalite Seç  [3] İndir              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      FOOTER                                │
│              © 2024 SpotIndir - Eğitim Amaçlı             │
└─────────────────────────────────────────────────────────────┘
```

## Mobil Versiyon

```
┌─────────────────┐
│  🎵 SpotIndir   │
│     [TR] [EN]   │
├─────────────────┤
│                 │
│   [H1] Müzik &  │
│   Video İndirici│
│                 │
│ ┌─────────────┐ │
│ │ Link...     │ │
│ └─────────────┘ │
│                 │
│ ┌─ FORMAT ────┐ │
│ │ ○Audio ○Vid │ │
│ └─────────────┘ │
│                 │
│ ┌─ KALİTE ────┐ │
│ │ [128][320]  │ │
│ └─────────────┘ │
│                 │
│   [📥 İNDİR]    │
│                 │
│ Platform Icons  │
│ 🎵📹🎶🎬🎭     │
│                 │
│   Nasıl Kullan  │
│     Footer      │
└─────────────────┘
```

## İnteraksiyon Akışı

1. **Sayfa Yüklenme**: Basit input + indir butonu
2. **Link Girme**: URL algılandığında options panel açılır
3. **Platform Tespiti**: Spotify/YouTube/diğer otomatik tespit
4. **Seçenek Gösterimi**: İlgili format/kalite seçenekleri
5. **Önizleme**: Şarkı/video bilgileri gösterilir
6. **İndirme**: Progress bar ile indirme durumu

## Renkler & Stil

- **Primary**: Spotify Green (#1DB954)
- **Secondary**: YouTube Red (#FF0000)
- **Background**: Gradient (Purple to Blue)
- **Cards**: White with shadow
- **Text**: Dark Gray (#333)

## Animasyonlar

- **Options Panel**: Slide down
- **Quality Buttons**: Hover effects
- **Download Button**: Pulse effect
- **Progress**: Smooth fill animation

Bu tasarım size uygun mu? Değişiklik istediğiniz yerler var mı?