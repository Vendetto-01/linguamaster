// frontend/src/utils/apiUtils.ts

/**
 * API yanıtlarında oluşabilecek hataları işlemek için genel bir yardımcı fonksiyon.
 * Yanıt başarılı değilse (response.ok false ise) çağrılır.
 * Yanıttan JSON formatında bir hata mesajı okumaya çalışır.
 * JSON okuma başarısız olursa veya yanıt JSON değilse, HTTP durumuna göre genel bir hata fırlatır.
 * @param response API'den gelen Response objesi.
 * @returns Hiçbir zaman bir değer döndürmez, her zaman bir hata fırlatır (Promise<never>).
 */
export const handleApiError = async (response: Response): Promise<never> => {
  try {
    // Yanıttan JSON formatında hata detaylarını almaya çalış
    const errorData = await response.json();
    // Hata mesajını fırlat. errorData.message varsa onu, yoksa genel bir API hatası mesajı kullan.
    throw new Error(errorData.message || `API Error: ${response.status} - ${response.statusText}`);
  } catch (e: any) {
    // JSON parse etme sırasında bir hata oluşursa (örn: yanıt JSON değilse)
    // veya yukarıdaki throw new Error() zaten bir hata fırlattıysa bu bloğa girer.
    
    // Eğer hata bir SyntaxError ise veya yanıtın content-type'ı application/json değilse,
    // bu durum yanıtın JSON formatında olmadığını gösterir.
    // Bu durumda, HTTP durumuna dayalı daha genel bir hata mesajı fırlat.
    if (e instanceof SyntaxError || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}. Response was not valid JSON.`);
    }
    // Eğer hata yukarıdaki koşullara girmiyorsa (örn: response.json() zaten bir Error objesi fırlattıysa),
    // o hatayı tekrar fırlat.
    throw e;
  }
};

// Gelecekte başka API yardımcı fonksiyonları buraya eklenebilir.
// Örneğin, standart header'ları oluşturan bir fonksiyon vb.