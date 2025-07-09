#!/bin/bash

# EezyGet Monitoring Script
# Bu script sistem durumunu kontrol eder ve logları analiz eder

VPS_IP="31.97.181.105"
VPS_USER="root"

echo "🔍 EezyGet Sistem Durumu Kontrolü"
echo "================================="

# VPS'e bağlan ve sistem durumunu kontrol et
ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} << 'EOF'
    echo "⏰ Tarih: $(date)"
    echo ""
    
    echo "🖥️  Sistem Kaynakları:"
    echo "- CPU Kullanımı: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')%"
    echo "- RAM Kullanımı: $(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2 }')"
    echo "- Disk Kullanımı: $(df -h | awk '$NF=="/"{printf "%s", $5}')"
    echo ""
    
    echo "🔄 PM2 Durumu:"
    pm2 status
    echo ""
    
    echo "🌐 API Sağlığı:"
    curl -s -w "Response Time: %{time_total}s\n" "https://api.eezyget.com/health" | jq -r '.status // "ERROR"'
    echo ""
    
    echo "📊 Son 10 Request:"
    tail -10 /root/eezyget-backend/backend/logs/combined.log | grep "GET\|POST" | tail -5
    echo ""
    
    echo "❌ Son Hatalar:"
    tail -20 /root/eezyget-backend/backend/logs/error.log | tail -5
    echo ""
    
    echo "💾 Download Klasörü:"
    ls -la /root/eezyget-backend/backend/downloads/ | wc -l
    echo "Toplam dosya sayısı: $(($(ls -la /root/eezyget-backend/backend/downloads/ | wc -l) - 1))"
    
    echo ""
    echo "🔧 PM2 Memory Usage:"
    pm2 show eezyget-backend | grep -E "memory usage|uptime|restart time"
EOF

echo ""
echo "✅ Monitoring tamamlandı!"
echo "📋 Detaylı loglar için: ssh root@${VPS_IP} 'pm2 logs eezyget-backend'"