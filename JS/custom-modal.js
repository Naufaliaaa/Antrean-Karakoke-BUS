/*************************************************
 * CUSTOM-MODAL.JS - Beautiful Alert & Confirm
 * Replace semua alert() dan confirm() bawaan browser
 *************************************************/

// ========= INJECT CSS KE HEAD =========
const modalStyles = `
<style id="custom-modal-styles">
.custom-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  animation: fadeIn 0.3s ease;
}

.custom-modal {
  background: white;
  border-radius: 20px;
  padding: 35px;
  max-width: 420px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
  position: relative;
}

.custom-modal-icon {
  font-size: 64px;
  text-align: center;
  margin-bottom: 20px;
}

.custom-modal-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 15px;
}

.custom-modal-message {
  font-size: 16px;
  color: #666;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 25px;
  white-space: pre-wrap;
}

.custom-modal-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.custom-modal-btn {
  padding: 14px 32px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 120px;
}

.custom-modal-btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.custom-modal-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.custom-modal-btn-secondary {
  background: #f1f5f9;
  color: #64748b;
}

.custom-modal-btn-secondary:hover {
  background: #e2e8f0;
  color: #334155;
}

.custom-modal-btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
}

.custom-modal-btn-danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.6);
}

.custom-modal-btn-success {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(67, 233, 123, 0.4);
}

.custom-modal-btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(67, 233, 123, 0.6);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 600px) {
  .custom-modal {
    padding: 25px;
    max-width: 95%;
  }
  
  .custom-modal-icon {
    font-size: 48px;
  }
  
  .custom-modal-title {
    font-size: 20px;
  }
  
  .custom-modal-buttons {
    flex-direction: column;
  }
  
  .custom-modal-btn {
    width: 100%;
  }
}
</style>
`;

// Inject styles ke head jika belum ada
if (!document.getElementById('custom-modal-styles')) {
  document.head.insertAdjacentHTML('beforeend', modalStyles);
}

// ========= CUSTOM ALERT =========
window.customAlert = function(message, options = {}) {
  return new Promise((resolve) => {
    const {
      title = 'Pemberitahuan',
      icon = '💬',
      buttonText = 'OK',
      buttonClass = 'custom-modal-btn-primary'
    } = options;
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    
    overlay.innerHTML = `
      <div class="custom-modal">
        <div class="custom-modal-icon">${icon}</div>
        <div class="custom-modal-title">${title}</div>
        <div class="custom-modal-message">${message}</div>
        <div class="custom-modal-buttons">
          <button class="custom-modal-btn ${buttonClass}" id="modal-ok-btn">${buttonText}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Event listener
    const okBtn = overlay.querySelector('#modal-ok-btn');
    
    const closeModal = () => {
      overlay.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => {
        overlay.remove();
        resolve();
      }, 300);
    };
    
    okBtn.addEventListener('click', closeModal);
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });
    
    // Close on ESC key
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  });
};

// ========= CUSTOM CONFIRM =========
window.customConfirm = function(message, options = {}) {
  return new Promise((resolve) => {
    const {
      title = 'Konfirmasi',
      icon = '❓',
      confirmText = 'Ya',
      cancelText = 'Batal',
      confirmClass = 'custom-modal-btn-primary',
      cancelClass = 'custom-modal-btn-secondary'
    } = options;
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    
    overlay.innerHTML = `
      <div class="custom-modal">
        <div class="custom-modal-icon">${icon}</div>
        <div class="custom-modal-title">${title}</div>
        <div class="custom-modal-message">${message}</div>
        <div class="custom-modal-buttons">
          <button class="custom-modal-btn ${cancelClass}" id="modal-cancel-btn">${cancelText}</button>
          <button class="custom-modal-btn ${confirmClass}" id="modal-confirm-btn">${confirmText}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Event listeners
    const confirmBtn = overlay.querySelector('#modal-confirm-btn');
    const cancelBtn = overlay.querySelector('#modal-cancel-btn');
    
    const closeModal = (result) => {
      overlay.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 300);
    };
    
    confirmBtn.addEventListener('click', () => closeModal(true));
    cancelBtn.addEventListener('click', () => closeModal(false));
    
    // Close on overlay click = cancel
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(false);
      }
    });
    
    // Close on ESC key = cancel
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal(false);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  });
};

// ========= SUCCESS ALERT (Green) =========
window.customSuccess = function(message, title = '✅ Berhasil!') {
  return customAlert(message, {
    title: title,
    icon: '✅',
    buttonClass: 'custom-modal-btn-success'
  });
};

// ========= ERROR ALERT (Red) =========
window.customError = function(message, title = '❌ Error!') {
  return customAlert(message, {
    title: title,
    icon: '❌',
    buttonClass: 'custom-modal-btn-danger'
  });
};

// ========= WARNING ALERT (Yellow) =========
window.customWarning = function(message, title = '⚠️ Peringatan!') {
  return customAlert(message, {
    title: title,
    icon: '⚠️',
    buttonClass: 'custom-modal-btn-primary'
  });
};

// ========= INFO ALERT (Blue) =========
window.customInfo = function(message, title = 'ℹ️ Informasi') {
  return customAlert(message, {
    title: title,
    icon: 'ℹ️',
    buttonClass: 'custom-modal-btn-primary'
  });
};

console.log('✅ Custom Modal System Loaded');

// ========= EXPORT FOR MODULES =========
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    customAlert,
    customConfirm,
    customSuccess,
    customError,
    customWarning,
    customInfo
  };
}