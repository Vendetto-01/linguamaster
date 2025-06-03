// frontend/src/components/words/FileUpload.tsx - GÜNCELLENMİŞ VERSİYON
import React, { useState, useRef, useCallback } from 'react';
import { wordApi } from '../../services/api';
import type { FileUploadProps, FileUploadResponse, UploadProgress } from '../../types';
import ProgressDisplay from '../shared/ProgressDisplay';
import DropZone from '../shared/DropZone'; // DropZone component'i import edildi

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const [isUploading, setIsUploading] = useState(false);
  // isDragOver state'i DropZone component'i içine taşındı.
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<FileUploadResponse | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readFileContent = (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          setProgress({
            current: 50,
            total: 100,
            percentage: 50,
            stage: 'reading',
            message: 'Dosya içeriği okunuyor...'
          });
          const content = e.target?.result as string;
          const words = content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .filter(line => /^[a-zA-Z\s-']+$/.test(line)); 
          resolve(words);
        } catch (err) {
          reject(new Error('Dosya okunamadı'));
        }
      };
      reader.onerror = () => reject(new Error('Dosya okuma hatası'));
      setProgress({
        current: 25,
        total: 100,
        percentage: 25,
        stage: 'reading',
        message: 'Dosya okunuyor...'
      });
      reader.readAsText(file, 'utf-8');
    });
  };

  const mainUploadFileLogic = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(''); // Hata mesajını her yükleme öncesi temizle
    setResult(null);
    setProgress(null);

    try {
      console.log('📖 Dosya okunuyor:', file.name);
      if (file.size > 10 * 1024 * 1024) { // 10MB
        throw new Error('Dosya boyutu 10MB\'dan büyük olamaz');
      }
      const words = await readFileContent(file);
      if (words.length === 0) {
        throw new Error('Dosyada geçerli kelime bulunamadı');
      }
      if (words.length > 50000) {
        throw new Error('Maksimum 50.000 kelime yükleyebilirsiniz');
      }
      setProgress({
        current: 75,
        total: 100,
        percentage: 75,
        stage: 'uploading',
        message: `${words.length} kelime sunucuya gönderiliyor...`
      });
      console.log(`📊 ${words.length} kelime bulundu, sunucuya gönderiliyor...`);
      const uploadResult = await wordApi.uploadFile(words, file.name);
      setProgress({
        current: 100,
        total: 100,
        percentage: 100,
        stage: 'complete',
        message: 'Yükleme tamamlandı!'
      });
      console.log('✅ Upload başarılı:', uploadResult);
      setResult(uploadResult);
      onFileUploaded(uploadResult);
    } catch (err) {
      console.error('❌ Upload hatası:', err);
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen bir yükleme hatası oluştu';
      setError(errorMessage); // Hata state'ini güncelle
      setProgress({
        current: 0,
        total: 100,
        percentage: 0,
        stage: 'error',
        message: 'Yükleme başarısız!'
      });
    } finally {
      setIsUploading(false);
    }
  }, [onFileUploaded]);


  // Dosya input'undan seçildiğinde
  const handleFileSelectFromInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Dosya tipi kontrolü (DropZone içindeki validator ile benzer olmalı)
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        setError(''); // Hata yoksa temizle
        mainUploadFileLogic(file);
      } else {
        setError('Sadece .txt dosyaları desteklenir. Lütfen geçerli bir dosya seçin.');
        // Input değerini sıfırla ki aynı "hatalı" dosya tekrar seçilebilsin (ve onChange tetiklensin)
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
      }
    }
  };
  
  // DropZone'dan dosya geldiğinde
  const handleFileAcceptedFromDropZone = useCallback((file: File) => {
      // DropZone zaten temel .txt kontrolünü yapmış olmalı (varsayılan validator ile)
      // Burada ek kontroller yapılabilir veya direkt yükleme başlatılabilir.
      setError(''); // DropZone'dan geçerli dosya geldiyse hatayı temizle
      mainUploadFileLogic(file);
  }, [mainUploadFileLogic]);


  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // DropZone için özel validator (isteğe bağlı, DropZone kendi default'una sahip)
  const customFileValidator = (file: File): boolean => {
    const isValid = file.type === 'text/plain' || file.name.endsWith('.txt');
    if (!isValid) {
      // Bu hata DropZone içinde gösterilecek, FileUpload'ın ana error state'ini etkilemez.
      // Ancak istenirse setError ile ana hata da set edilebilir.
      console.warn("DropZone validator: Geçersiz dosya türü - ", file.name);
    }
    return isValid;
  };


  // handleDragOver, handleDragLeave, handleDrop fonksiyonları DropZone'a taşındı.

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>📁 Toplu Kelime Yükleme</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Kelimeler queue'ya eklenir ve arka planda <strong>Gemini 2.0 Flash</strong> ile 6 aşamalı analiz edilir
      </p>
      
      {progress && (
        <ProgressDisplay
          progress={{
            ...progress,
            successful: 0, 
            failed: 0,     
            timeElapsed: 0 
          }}
          title="Dosya Yükleme Süreci"
          showStats={false}
          variant="compact"
        />
      )}
      
      {/* DropZone component'i kullanılıyor */}
      <DropZone
        onFileAccepted={handleFileAcceptedFromDropZone}
        onBrowseClick={handleBrowseClick}
        disabled={isUploading}
        // fileValidator={customFileValidator} // İsterseniz özel validator'unuzu buradan geçebilirsiniz
        // DropZone içindeki varsayılan metinleri kullanıyoruz, isterseniz override edebilirsiniz:
        // mainText="Sürükle bırak veya tıkla"
        // subText=".txt dosyaları kabul edilir"
        // browseButtonText="dosya ara"
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,text/plain" // DropZone'daki accept ile tutarlı olmalı
        onChange={handleFileSelectFromInput}
        style={{ display: 'none' }}
        disabled={isUploading}
      />

      {error && !isUploading && ( // Sadece yükleme yokken ana hatayı göster
        <div style={{
          color: '#dc3545',
          backgroundColor: '#f8d7da',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
          marginTop: '15px', // DropZone sonrası biraz boşluk
          border: '1px solid #f5c6cb'
        }}>
          ❌ {error}
        </div>
      )}

      {result && (
        <div style={{
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '5px',
          padding: '20px',
          marginTop: '20px', // DropZone veya hata sonrası boşluk
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#155724', marginTop: 0 }}>✅ Dosya Başarıyla Queue'ya Eklendi!</h3>
          <div style={{ marginBottom: '15px' }}>
            <strong>📁 Dosya:</strong> {result.results.fileName}
            <br />
            <strong>🆔 Batch ID:</strong> 
            <code style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '2px 6px', 
              borderRadius: '3px',
              fontSize: '12px',
              marginLeft: '5px'
            }}>
              {result.results.batchId}
            </code>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '10px',
            marginBottom: '15px'
          }}>
            <div style={{ backgroundColor: '#f1f8e9', padding: '10px', borderRadius: '3px' }}>
              <div style={{ fontWeight: 'bold', color: '#2e7d32' }}>📊 Toplam Kelime</div>
              <div style={{ fontSize: '24px' }}>{result.results.totalWords.toLocaleString()}</div>
            </div>
            <div style={{ backgroundColor: '#e8f5e8', padding: '10px', borderRadius: '3px' }}>
              <div style={{ fontWeight: 'bold', color: '#2e7d32' }}>✅ Queue'ya Eklendi</div>
              <div style={{ fontSize: '24px' }}>{result.results.queued.toLocaleString()}</div>
            </div>
            {result.results.duplicates > 0 && (
              <div style={{ backgroundColor: '#fff3e0', padding: '10px', borderRadius: '3px' }}>
                <div style={{ fontWeight: 'bold', color: '#f57c00' }}>⚠️ Zaten Queue'da</div>
                <div style={{ fontSize: '24px' }}>{result.results.duplicates.toLocaleString()}</div>
              </div>
            )}
            {result.results.failed > 0 && (
              <div style={{ backgroundColor: '#ffebee', padding: '10px', borderRadius: '3px' }}>
                <div style={{ fontWeight: 'bold', color: '#d32f2f' }}>❌ Başarısız</div>
                <div style={{ fontSize: '24px' }}>{result.results.failed.toLocaleString()}</div>
              </div>
            )}
          </div>
          <div style={{ 
            backgroundColor: '#cce5ff', 
            padding: '15px', 
            borderRadius: '5px',
            fontSize: '14px',
            color: '#0066cc'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              🤖 <strong>Sonraki Adım:</strong>
            </div>
            <p style={{ margin: '0 0 8px 0' }}>
              Kelimeler arka planda <strong>Gemini 2.0 Flash</strong> ile 6 aşamalı analiz edilmeye başlayacak. 
              Her kelime için Türkçe karşılıklar, kelime türleri ve akademik örnek cümleler çekilecek.
            </p>
            <p style={{ margin: 0 }}>
              📊 Progress'i takip etmek için <strong>"Queue Durumu"</strong> sekmesini kontrol edebilirsiniz.
            </p>
          </div>
        </div>
      )}

      <div style={{
        backgroundColor: '#e9ecef',
        padding: '15px',
        borderRadius: '5px',
        fontSize: '14px',
        color: '#495057',
        marginTop: '20px'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>ℹ️ 6 Aşamalı Analiz Sistemi</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <strong>📝 İlk 3 Aşama:</strong>
            <ol style={{ margin: '5px 0', paddingLeft: '15px', fontSize: '13px' }}>
              <li>İlk zorluk tahmini</li>
              <li>Anlam tespiti</li>
              <li>Akademik örnek cümleler</li>
            </ol>
          </div>
          <div>
            <strong>🧠 Son 3 Aşama:</strong>
            <ol style={{ margin: '5px 0', paddingLeft: '15px', fontSize: '13px' }} start={4}>
              <li>Zorluk doğrulama</li>
              <li>Türkçe çeviri</li>
              <li>Kelime eşleştirme</li>
            </ol>
          </div>
        </div>
        <div style={{ 
          marginTop: '10px',
          padding: '8px',
          backgroundColor: '#cce5ff',
          borderRadius: '3px',
          fontSize: '12px'
        }}>
          <strong>⚡ Hız:</strong> ~30 kelime/dakika | 
          <strong>🎯 Kalite:</strong> Her kelime için çoklu anlam + akademik örnekler
        </div>
      </div>
    </div>
  );
};

export default FileUpload;