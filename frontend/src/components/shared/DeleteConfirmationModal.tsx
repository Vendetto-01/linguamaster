import React from 'react';
import '../styles/Modal.css';

interface DeleteConfirmationModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  title?: string;
  message?: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  show,
  onClose,
  onConfirm,
  itemName,
  title = 'Silme Onayı',
  message
}) => {
  if (!show) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <p>
            {message || `"${itemName}" öğesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            İptal
          </button>
          <button className="btn btn-danger" onClick={handleConfirm}>
            Sil
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;