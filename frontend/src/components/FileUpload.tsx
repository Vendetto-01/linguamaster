// frontend/src/components/FileUpload.tsx - SADELEŞTİRİLMİŞ VERSİYON
import React, { useState, useRef } from 'react';
import { wordApi } from '../services/api';
import { FileUploadProps, FileUploadResponse, UploadProgress } from '../types';

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<FileUploadResponse | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dosya içeriğini okuma
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
          
          // Her satırı bir kelime olarak ayır
          const words = content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .filter(line => /^[a-zA-Z\s-']+$/.test(line)); // Sadece İngilizce karakterler
            
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

  // Dosya yükleme
  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError('');
    setResult(null);
    setProgress(null);

    try {
      console.log('📖 Dosya okunuyor:', file.name);
      
      // Dosya boyutu kontrolü
      if (file.size > 10 * 1024 * 1024) { // 10MB
        throw new Error('Dosya boyutu 10MB\'dan büyük olamaz');
      }
      
      // Dosya içeriğini oku
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

      // Backend'e gönder
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
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
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
  };

  // File input change handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      // Sadece text dosyalarını kabul et
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        uploadFile(file);
      } else {
        setError('Sadece .txt dosyaları desteklenir');
      }
    }
  };

  // Browse button click
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Progress bar component
  const ProgressBar = () => {
    if (!progress) return null;

    return (
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          marginBottom: '10px', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '14px', color: '#666' }}>{progress.message}</span>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{progress.percentage}%</span>
        </div>
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#f0f0f0',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress.percentage}%`,
            height: '100%',
            backgroundColor: progress.stage === 'error' ? '#dc3545' : 
                           progress.stage === 'complete' ? '#28a745' : '#007bff',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>📁 Toplu Kelime Yükleme</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Kelimeler queue'ya eklenir ve arka planda <strong>Gemini 2.0 Flash</strong> ile 6 aşamalı analiz edilir
      </p>
      
      {/* Progress Bar */}
      <ProgressBar />
      
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragOver ? '#007bff' : '#ddd'}`,
          borderRadius: '10px',
          padding: '40px',
          textAlign: 'center',
          backgroundColor: isDragOver ? '#f8f9fa' : '#fafafa',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          marginBottom: '20px'
        }}
        onClick={handleBrowseClick}
      >
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>
          {isUploading ? '⏳' : '📄'}
        </div>
        
        {isUploading ? (
          <div>
            <div style={{ fontSize: '18px', color: '#007bff' }}>
              🔄 Dosya işleniyor...
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              Lütfen bekleyin
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>
              .txt dosyanızı sürükleyip bırakın
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              veya <strong>tıklayarak dosya seçin</strong>
            </div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
              Her satırda bir kelime • Maksimum 50.000 kelime • Sadece İngilizce karakterler
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Error Message */}
      {error && (
        <div style={{
          color: '#dc3545',
          backgroundColor: '#f8d7da',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div style={{
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '5px',
          padding: '20px',
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

      {/* Info Box */}
      <div style={{
        backgroundColor: '#e9ecef',
        padding: '15px',
        borderRadius: '5px',
        fontSize: '14px',
        color: '#495057'
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