// Сервис для работы с Яндекс.Диском API
// Для работы требуется OAuth токен от Яндекс.Диска

interface RegistrationData {
  email: string;
  registeredAt: string;
  consentPersonalData: boolean;
  consentMarketing: boolean;
  profileData?: {
    name?: string;
    company?: string;
    position?: string;
    phone?: string;
    industry?: string;
    employees?: string;
  };
}

interface YandexDiskConfig {
  accessToken?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}

class YandexDiskService {
  private config: YandexDiskConfig;
  private readonly API_BASE = 'https://cloud-api.yandex.net/v1/disk';
  private readonly TABLE_FILE_NAME = 'Регистрации_ЛегалФлоу.csv';
  private readonly TABLE_FOLDER = '/ЛегалФлоу';

  constructor() {
    // Получаем конфигурацию из переменных окружения или localStorage
    this.config = {
      accessToken: import.meta.env.VITE_YANDEX_DISK_TOKEN || localStorage.getItem('yandexDiskToken') || undefined,
      clientId: import.meta.env.VITE_YANDEX_DISK_CLIENT_ID || undefined,
      clientSecret: import.meta.env.VITE_YANDEX_DISK_CLIENT_SECRET || undefined,
      redirectUri: import.meta.env.VITE_YANDEX_DISK_REDIRECT_URI || window.location.origin + '/yandex-disk-callback'
    };
  }

  /**
   * Сохраняет данные регистрации в таблицу на Яндекс.Диске
   */
  async saveRegistrationData(data: RegistrationData): Promise<void> {
    if (!this.config.accessToken) {
      console.warn('Yandex Disk token не настроен. Данные не будут сохранены в Яндекс.Диск.');
      return;
    }

    try {
      // Проверяем существование файла и создаем/обновляем его
      const csvData = await this.getOrCreateTable();
      const newRow = this.formatRegistrationRow(data);
      
      // Добавляем новую строку
      const updatedCsv = csvData + '\n' + newRow;
      
      // Загружаем обновленный файл на Яндекс.Диск
      await this.uploadFile(updatedCsv);
      
      console.log('✅ Данные регистрации сохранены в Яндекс.Диск');
    } catch (error) {
      console.error('❌ Ошибка сохранения в Яндекс.Диск:', error);
      throw error;
    }
  }

  /**
   * Получает существующую таблицу или создает новую с заголовками
   */
  private async getOrCreateTable(): Promise<string> {
    try {
      // Пытаемся скачать существующий файл
      const filePath = `${this.TABLE_FOLDER}/${this.TABLE_FILE_NAME}`;
      const downloadUrl = await this.getDownloadUrl(filePath);
      
      if (downloadUrl) {
        const response = await fetch(downloadUrl);
        if (response.ok) {
          return await response.text();
        }
      }
    } catch (error) {
      console.log('Файл не найден, создаем новый');
    }

    // Создаем новый файл с заголовками
    return this.getTableHeaders();
  }

  /**
   * Возвращает заголовки таблицы CSV
   */
  private getTableHeaders(): string {
    return [
      'Дата регистрации',
      'Email пользователя',
      'Согласие на обработку ПД',
      'Согласие на рекламные рассылки',
      'Имя',
      'Компания',
      'Должность',
      'Телефон',
      'Отрасль',
      'Количество сотрудников'
    ].join(',');
  }

  /**
   * Форматирует строку регистрации для CSV
   */
  private formatRegistrationRow(data: RegistrationData): string {
    const escapeCsv = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const profile = data.profileData || {};
    
    return [
      escapeCsv(data.registeredAt),
      escapeCsv(data.email),
      escapeCsv(data.consentPersonalData ? 'Да' : 'Нет'),
      escapeCsv(data.consentMarketing ? 'Да' : 'Нет'),
      escapeCsv(profile.name || ''),
      escapeCsv(profile.company || ''),
      escapeCsv(profile.position || ''),
      escapeCsv(profile.phone || ''),
      escapeCsv(profile.industry || ''),
      escapeCsv(profile.employees || '')
    ].join(',');
  }

  /**
   * Получает URL для скачивания файла
   */
  private async getDownloadUrl(filePath: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.API_BASE}/resources/download?path=${encodeURIComponent(filePath)}`,
        {
          headers: {
            'Authorization': `OAuth ${this.config.accessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.href || null;
      }
    } catch (error) {
      console.error('Ошибка получения URL скачивания:', error);
    }
    return null;
  }

  /**
   * Загружает файл на Яндекс.Диск
   */
  private async uploadFile(content: string): Promise<void> {
    // Создаем папку, если её нет
    await this.ensureFolderExists();

    const filePath = `${this.TABLE_FOLDER}/${this.TABLE_FILE_NAME}`;
    
    // Получаем URL для загрузки
    const uploadUrl = await this.getUploadUrl(filePath);
    
    if (!uploadUrl) {
      throw new Error('Не удалось получить URL для загрузки файла');
    }

    // Загружаем файл
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/csv; charset=utf-8'
      },
      body: content
    });

    if (!response.ok) {
      throw new Error(`Ошибка загрузки файла: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Получает URL для загрузки файла
   */
  private async getUploadUrl(filePath: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.API_BASE}/resources/upload?path=${encodeURIComponent(filePath)}&overwrite=true`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `OAuth ${this.config.accessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.href || null;
      }
    } catch (error) {
      console.error('Ошибка получения URL загрузки:', error);
    }
    return null;
  }

  /**
   * Создает папку, если её нет
   */
  private async ensureFolderExists(): Promise<void> {
    try {
      const response = await fetch(
        `${this.API_BASE}/resources?path=${encodeURIComponent(this.TABLE_FOLDER)}`,
        {
          headers: {
            'Authorization': `OAuth ${this.config.accessToken}`
          }
        }
      );

      // Если папка не существует (404), создаем её
      if (response.status === 404) {
        await fetch(
          `${this.API_BASE}/resources?path=${encodeURIComponent(this.TABLE_FOLDER)}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `OAuth ${this.config.accessToken}`
            }
          }
        );
      }
    } catch (error) {
      console.error('Ошибка создания папки:', error);
    }
  }

  /**
   * Инициирует OAuth авторизацию Яндекс.Диска
   */
  initiateOAuth(): void {
    if (!this.config.clientId) {
      throw new Error('Yandex Disk Client ID не настроен');
    }

    const authUrl = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${this.config.clientId}&redirect_uri=${encodeURIComponent(this.config.redirectUri || '')}`;
    window.location.href = authUrl;
  }

  /**
   * Обменивает код авторизации на токен
   */
  async exchangeCodeForToken(code: string): Promise<string> {
    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error('Yandex Disk Client ID или Client Secret не настроены');
    }

    const response = await fetch('https://oauth.yandex.ru/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      })
    });

    if (!response.ok) {
      throw new Error(`Ошибка получения токена: ${response.status}`);
    }

    const data = await response.json();
    const accessToken = data.access_token;
    
    // Сохраняем токен
    localStorage.setItem('yandexDiskToken', accessToken);
    this.config.accessToken = accessToken;
    
    return accessToken;
  }
}

export const yandexDiskService = new YandexDiskService();

// Функция для сохранения данных регистрации (используется в компонентах)
export async function saveToYandexDisk(data: RegistrationData): Promise<void> {
  return yandexDiskService.saveRegistrationData(data);
}

