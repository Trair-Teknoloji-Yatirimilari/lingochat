#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

// PNG dosyasını oku ve mavi tonları turuncuya çevir
async function changeBlueToOrange(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(inputPath);
    const png = new PNG();
    
    stream.pipe(png)
      .on('parsed', function() {
        // Turuncu renk: #FF5722 -> RGB(255, 87, 34)
        const targetR = 255;
        const targetG = 87;
        const targetB = 34;
        
        let modifiedPixels = 0;
        
        // Her pikseli kontrol et
        for (let y = 0; y < this.height; y++) {
          for (let x = 0; x < this.width; x++) {
            const idx = (this.width * y + x) << 2;
            
            const r = this.data[idx];
            const g = this.data[idx + 1];
            const b = this.data[idx + 2];
            const a = this.data[idx + 3];
            
            // Şeffaf pikselleri atla
            if (a < 10) continue;
            
            // Mavi ton kontrolü
            // 1. Mavi değeri, kırmızı ve yeşilden belirgin şekilde yüksek
            // 2. Veya koyu mavi tonlar (b > 150 ve r,g < 100)
            // 3. Veya açık mavi tonlar (b > r+30 ve b > g+30)
            const isBlue = (
              (b > r + 30 && b > g + 30 && b > 80) ||  // Açık/orta mavi
              (b > 150 && r < 100 && g < 100) ||        // Koyu mavi
              (b > r * 1.3 && b > g * 1.3 && b > 100)   // Mavi dominant
            );
            
            if (isBlue) {
              // Parlaklığı koru (orijinal parlaklık oranını turuncu renge uygula)
              const brightness = (r + g + b) / 3;
              const targetBrightness = (targetR + targetG + targetB) / 3;
              const ratio = brightness / targetBrightness;
              
              this.data[idx] = Math.min(255, Math.round(targetR * ratio));
              this.data[idx + 1] = Math.min(255, Math.round(targetG * ratio));
              this.data[idx + 2] = Math.min(255, Math.round(targetB * ratio));
              // Alpha değerini koru
              
              modifiedPixels++;
            }
          }
        }
        
        // Değiştirilmiş PNG'yi kaydet
        this.pack().pipe(fs.createWriteStream(outputPath))
          .on('finish', () => {
            console.log(`✓ ${path.basename(inputPath)} -> ${modifiedPixels} piksel değiştirildi`);
            resolve(true);
          })
          .on('error', reject);
      })
      .on('error', reject);
  });
}

// İşlenecek dosyalar
const iconFiles = [
  'assets/images/icon.png',
  'assets/images/splash-icon.png',
  'assets/images/android-icon-foreground.png',
  'assets/images/android-icon-monochrome.png',
  'assets/images/favicon.png',
];

async function main() {
  console.log('🎨 İkon renklerini değiştiriyorum (Mavi -> Turuncu #FF5722)...\n');
  
  // Önce yedek al
  const backupDir = 'assets/images/backup-' + Date.now();
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  for (const file of iconFiles) {
    if (fs.existsSync(file)) {
      // Yedek al
      const backupPath = path.join(backupDir, path.basename(file));
      fs.copyFileSync(file, backupPath);
      
      // Renk değiştir
      try {
        await changeBlueToOrange(file, file);
      } catch (error) {
        console.error(`✗ ${file} işlenirken hata:`, error.message);
      }
    } else {
      console.log(`⚠ ${file} bulunamadı, atlanıyor...`);
    }
  }
  
  console.log(`\n✓ Tamamlandı! Orijinal dosyalar ${backupDir} klasörüne yedeklendi.`);
  console.log('\nDeğişiklikleri görmek için:');
  console.log('  npx expo prebuild --clean');
  console.log('  npm run ios');
}

main().catch(console.error);
