// frontend/src/services/keepAlive.ts

interface KeepAliveConfig {
  enabled: boolean;
  interval: number; // milliseconds
  backendUrl: string;
  endpoint: string;
  maxRetries: number;
}

class KeepAliveService {
  private config: KeepAliveConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private lastPingTime: Date | null = null;
  private consecutiveFailures: number = 0;
  
  constructor(config: Partial<KeepAliveConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'production', // Sadece production'da çalış
      interval: 10 * 60 * 1000, // 10 dakika
      backendUrl: process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000',
      endpoint: '/health',
      maxRetries: 3,
      ...config
    };
  }

  // Keep-alive servisini başlat
  start(): void {
    if (!this.config.enabled) {
      console.log('🏓 Keep-alive disabled (development mode)');
      return;
    }

    if (this.isRunning) {
      console.log('🏓 Keep-alive already running');
      return;
    }

    console.log('🏓 Starting keep-alive service...', {
      interval: this.config.interval / 1000 / 60 + ' minutes',
      target: this.config.backendUrl + this.config.endpoint
    });

    this.isRunning = true;
    
    // İlk ping'i hemen at
    this.ping();
    
    // Periyodik ping'leri başlat
    this.intervalId = setInterval(() => {
      this.ping();
    }, this.config.interval);
  }

  // Keep-alive servisini durdur
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
    console.log('🏓 Keep-alive service stopped');
  }

  // Backend'e ping at
  private async ping(): Promise<void> {
    try {
      const url = `${this.config.backendUrl}${this.config.endpoint}`;
      
      console.log(`🏓 Pinging backend: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 saniye timeout
      
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-cache',
        signal: controller.signal,
        headers: {
          'User-Agent': 'WordWizard-KeepAlive/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        this.lastPingTime = new Date();
        this.consecutiveFailures = 0;
        
        console.log('✅ Keep-alive ping successful:', {
          status: response.status,
          time: this.lastPingTime.toLocaleTimeString(),
          url: url
        });
        
        // Response body'yi consume et (memory leak'i önlemek için)
        try {
          const data = await response.json();
          console.log('📊 Backend status:', {
            uptime: data.uptime ? Math.round(data.uptime) + 's' : 'unknown',
            processor: data.wordProcessor?.isProcessing ? 'active' : 'idle'
          });
        } catch (e) {
          // JSON parse edilemezse sorun değil
        }
        
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      this.consecutiveFailures++;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.warn('⚠️ Keep-alive ping failed:', {
        error: errorMessage,
        consecutiveFailures: this.consecutiveFailures,
        maxRetries: this.config.maxRetries,
        url: this.config.backendUrl + this.config.endpoint
      });
      
      // Çok fazla başarısız ping varsa interval'ı artır
      if (this.consecutiveFailures >= this.config.maxRetries) {
        console.warn('🔄 Too many failures, increasing ping interval');
        this.adjustInterval(1.5); // 1.5x yavaşlat
      }
    }
  }

  // Ping interval'ını ayarla
  private adjustInterval(multiplier: number): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      
      const newInterval = Math.min(
        this.config.interval * multiplier,
        20 * 60 * 1000 // Maximum 20 dakika
      );
      
      console.log(`🔧 Adjusting ping interval: ${newInterval / 1000 / 60} minutes`);
      
      this.intervalId = setInterval(() => {
        this.ping();
      }, newInterval);
    }
  }

  // Manuel ping
  async manualPing(): Promise<boolean> {
    try {
      await this.ping();
      return this.consecutiveFailures === 0;
    } catch (error) {
      return false;
    }
  }

  // Servis durumu
  getStatus() {
    return {
      isRunning: this.isRunning,
      isEnabled: this.config.enabled,
      lastPingTime: this.lastPingTime,
      consecutiveFailures: this.consecutiveFailures,
      nextPingIn: this.isRunning ? 
        Math.round((this.config.interval - (Date.now() - (this.lastPingTime?.getTime() || Date.now()))) / 1000) :
        null,
      config: {
        interval: this.config.interval / 1000 / 60 + ' minutes',
        target: this.config.backendUrl + this.config.endpoint
      }
    };
  }

  // Browser visibility change event'lerini dinle
  setupVisibilityListener(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.config.enabled) {
          // Sayfa tekrar görünür olduğunda manuel ping at
          console.log('📱 Page became visible, sending keep-alive ping');
          this.manualPing();
        }
      });
    }
  }

  // Browser beforeunload event'ini dinle
  setupUnloadListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.stop();
      });
    }
  }
}

// Singleton instance
export const keepAliveService = new KeepAliveService();

// React Hook
export const useKeepAlive = () => {
  const [status, setStatus] = React.useState(keepAliveService.getStatus());

  React.useEffect(() => {
    // Servisi başlat
    keepAliveService.start();
    keepAliveService.setupVisibilityListener();
    keepAliveService.setupUnloadListener();

    // Status'u periyodik olarak güncelle
    const statusInterval = setInterval(() => {
      setStatus(keepAliveService.getStatus());
    }, 5000);

    // Cleanup
    return () => {
      clearInterval(statusInterval);
      keepAliveService.stop();
    };
  }, []);

  return {
    ...status,
    manualPing: () => keepAliveService.manualPing(),
    start: () => keepAliveService.start(),
    stop: () => keepAliveService.stop()
  };
};

export default keepAliveService;