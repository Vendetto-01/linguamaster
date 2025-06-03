// frontend/src/components/shared/DropZone.tsx
import React, { useState, useCallback } from 'react';

interface DropZoneProps {
  onFileAccepted: (file: File) => void; // Geçerli dosya bırakıldığında veya seçildiğinde çağrılır
  onBrowseClick: () => void; // "Dosya Seç" tıklandığında parent'taki input'u tetiklemek için
  accept?: string; // <input accept> attribute'u için (örn: ".txt,text/plain")
  fileValidator?: (file: File) => boolean; // Ekstra dosya doğrulama fonksiyonu
  disabled?: boolean; // Yükleme sırasında dropzone'u devre dışı bırakmak için
  mainText?: string;
  subText?: string;
  browseButtonText?: string;
  uploadingText?: string;
  iconDefault?: string;
  iconUploading?: string;
}

const DropZone: React.FC<DropZoneProps> = ({
  onFileAccepted,
  onBrowseClick,
  accept = ".txt,text/plain",
  fileValidator,
  disabled = false,
  mainText = ".txt dosyanızı sürükleyip bırakın",
  subText = "Her satırda bir kelime • Maksimum 50.000 kelime • Sadece İngilizce karakterler",
  browseButtonText = "tıklayarak dosya seçin",
  uploadingText = "Dosya işleniyor...",
  iconDefault = "📄",
  iconUploading = "⏳",
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
      setLocalError(null); // Sürükleme başladığında hatayı temizle
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Dosya tipi kontrolü (accept attribute'u istemci tarafında bir ön kontrol sağlar)
      // Ancak daha güvenilir bir kontrol için burada da yapılabilir.
      // Örnek: const acceptedTypes = accept.split(',').map(t => t.trim());
      // if (!acceptedTypes.includes(file.type) && !acceptedTypes.find(type => file.name.endsWith(type))) { ... }
      
      let isValid = true;
      if (fileValidator) {
        isValid = fileValidator(file);
      } else {
        // Varsayılan .txt kontrolü (FileUpload.tsx'deki gibi)
        if (!(file.type === 'text/plain' || file.name.endsWith('.txt'))) {
            isValid = false;
            setLocalError('Sadece .txt dosyaları desteklenir.');
        }
      }

      if (isValid) {
        onFileAccepted(file);
        setLocalError(null);
      } else {
        if (!localError && !fileValidator) { // Eğer validator yoksa ve localError set edilmediyse genel hata
             setLocalError('Geçersiz dosya türü veya içerik.');
        }
      }
    }
  }, [disabled, onFileAccepted, fileValidator, localError, accept]);


  const handleClick = () => {
    if (!disabled) {
      setLocalError(null); // Dosya seçimine tıklandığında hatayı temizle
      onBrowseClick();
    }
  }

  const borderColor = disabled ? '#e0e0e0' : isDragOver ? '#007bff' : '#ddd';
  const backgroundColor = disabled ? '#f5f5f5' : isDragOver ? '#f0f8ff' : '#fafafa'; // Hafif mavi tonu isDragOver için

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      style={{
        border: `2px dashed ${borderColor}`,
        borderRadius: '10px',
        padding: '40px',
        textAlign: 'center',
        backgroundColor: backgroundColor,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        opacity: disabled ? 0.7 : 1,
      }}
    >
      <div style={{ fontSize: '48px', marginBottom: '10px', color: disabled ? '#999' : '#666' }}>
        {disabled ? iconUploading : iconDefault}
      </div>
      
      {disabled ? (
        <div>
          <div style={{ fontSize: '18px', color: '#007bff' }}>
            {uploadingText}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
            Lütfen bekleyin
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '18px', marginBottom: '10px', color: '#333' }}>
            {mainText}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            veya <strong style={{color: '#007bff', cursor: 'pointer'}} onClick={handleClick}>{browseButtonText}</strong>
          </div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
            {subText}
          </div>
        </div>
      )}
      {localError && !disabled && (
        <div style={{ color: '#dc3545', marginTop: '10px', fontSize: '13px', fontWeight: 'bold' }}>
          {localError}
        </div>
      )}
    </div>
  );
};

export default DropZone;