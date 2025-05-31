// frontend/src/components/FileUpload.tsx
import React, { useState, useRef } from 'react';

interface FileUploadProps {
  onFileUploaded: (result: any) => void;
}

interface UploadResult {
  fileName: string;
  batchId: string;
  totalWords: number;
  inserted: number;
  duplicates: number;
  failed: number;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dosya içeriğini okuma
  const readFileContent = (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          
          // Her satırı bir kelime olarak ayır
          const words = content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
            
          resolve(words);
        } catch (err) {
          reject(new Error('Dosya okunamadı'));
        }
      };
      
      reader.onerror = () => reject(new Error('Dosya okuma hatası'));
      reader.readAsText(file, 'utf-8');
    });
  };

  // Dosya yükleme
  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError('');
    setResult(null);

    try {
      console.log('📖 Dosya okunuyor:', file.name);
      
      // Dosya içeriğini oku
      const words = await readFileContent(file);
      
      if (words.length === 0) {
        throw new Error('Dosyada kelime bulunamadı');
      }

      console.log(`📊 ${words.length} kelime bulundu, sunucuya gönderiliyor...`);

      // Backend'e gönder
      const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      
      const response = await fetch(`${API_BASE_URL}/api/words/upload-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          words: words,
          fileName: file.name 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload hatası');
      }

      const uploadResult = await response.json();
      console.log('✅ Upload başarılı:', uploadResult);
      
      setResult(uploadResult.results);
      onFileUploaded(uploadResult);

    } catch (err) {
      console.error('❌ Upload hatası:', err);
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
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

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>📁 Toplu Kelime Yükleme</h2>
      
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
          📄
        </div>
        
        {isUploading ? (
          <div>
            <div style={{ fontSize: '18px', color: '#007bff' }}>
              🔄 Dosya yükleniyor...
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
              Her satırda bir kelime olmalı • Maksimum 50.000 kelime
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
          color: 'red',
          backgroundColor: '#ffebee',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #ffcdd2'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div style={{
          backgroundColor: '#e8f5e8',
          border: '1px solid #4caf50',
          borderRadius: '5px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#2e7d32', marginTop: 0 }}>✅ Dosya Başarıyla Yüklendi!</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>📁 Dosya:</strong> {result.fileName}
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '10px',
            marginBottom: '15px'
          }}>
            <div style={{ backgroundColor: '#f1f8e9', padding: '10px', borderRadius: '3px' }}>
              <div style={{ fontWeight: 'bold', color: '#2e7d32' }}>📊 Toplam Kelime</div>
              <div style={{ fontSize: '24px' }}>{result.totalWords.toLocaleString()}</div>
            </div>
            
            <div style={{ backgroundColor: '#e8f5e8', padding: '10px', borderRadius: '3px' }}>
              <div style={{ fontWeight: 'bold', color: '#2e7d32' }}>✅ Queue'ya Eklendi</div>
              <div style={{ fontSize: '24px' }}>{result.inserted.toLocaleString()}</div>
            </div>
            
            {result.duplicates > 0 && (
              <div style={{ backgroundColor: '#fff3e0', padding: '10px', borderRadius: '3px' }}>
                <div style={{ fontWeight: 'bold', color: '#f57c00' }}>⚠️ Zaten Mevcut</div>
                <div style={{ fontSize: '24px' }}>{result.duplicates.toLocaleString()}</div>
              </div>
            )}
            
            {result.failed > 0 && (
              <div style={{ backgroundColor: '#ffebee', padding: '10px', borderRadius: '3px' }}>
                <div style={{ fontWeight: 'bold', color: '#d32f2f' }}>❌ Başarısız</div>
                <div style={{ fontSize: '24px' }}>{result.failed.toLocaleString()}</div>
              </div>
            )}
          </div>

          <div style={{ 
            backgroundColor: '#bbdefb', 
            padding: '10px', 
            borderRadius: '3px',
            fontSize: '14px',
            color: '#1565c0'
          }}>
            🚀 <strong>Sonraki Adım:</strong> Kelimeler arka planda işlenmeye başlayacak. 
            Progress'i takip etmek için "Queue Durumu" sekmesini kontrol edebilirsiniz.
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;