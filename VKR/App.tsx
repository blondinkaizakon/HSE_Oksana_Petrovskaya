
import React, { useState, useEffect, useRef } from 'react';
import { AvatarState, GameLevel, Message, Risk } from './types';
import { LEVELS, AVATAR_QUOTES } from './constants';
import { GAME_LEVELS, calculateTotalScore, getScoreZone, LevelQuestion } from './gameStructure';
import { qwen } from './services/qwenService';
import Avatar from './components/Avatar';
import HealthBar from './components/HealthBar';
import RiskCard from './components/RiskCard';
import ProfilePage from './components/ProfilePage';
import QuestionCard from './components/QuestionCard';
import RiskSummary from './components/RiskSummary';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';

export interface ProfileData {
  name: string;
  company: string;
  position: string;
  email: string;
  phone: string;
  industry: string;
  employees: string;
  avatar?: string; // URL или base64 изображения
}

const App: React.FC = () => {
  // Аутентификация
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const currentUser = localStorage.getItem('currentUser');
    return !!currentUser;
  });
  const [showLogin, setShowLogin] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser).email : '';
  });

  // Система баллов вместо HP
  const [levelScores, setLevelScores] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('levelScores');
    return saved ? JSON.parse(saved) : {
      digital_shield: 0,
      judicial_fortress: 0,
      hr_shield: 0,
      tax_labyrinth: 0
    };
  });
  
  const totalScore = calculateTotalScore(levelScores);
  
  const [currentLevel, setCurrentLevel] = useState<GameLevel>(GameLevel.PRIMARY_AUDIT);
  const [avatarState, setAvatarState] = useState<AvatarState>(AvatarState.IDLE);
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>(() => {
    const saved = localStorage.getItem('profileData');
    return saved ? JSON.parse(saved) : {
      name: '',
      company: '',
      position: '',
      email: '',
      phone: '',
      industry: '',
      employees: ''
    };
  });
  
  // Отдельная история сообщений для каждого уровня аудита
  const [levelMessages, setLevelMessages] = useState<Record<GameLevel, Message[]>>({
    [GameLevel.PRIMARY_AUDIT]: [{ role: 'assistant', content: AVATAR_QUOTES.welcome }],
    [GameLevel.JUDICIAL_FORTRESS]: [{ role: 'assistant', content: '⚖️ Судебная крепость! Проверим твои договоры, полномочия и корпоративные процедуры. Готов к проверке?' }],
    [GameLevel.HR_JUNGLE]: [{ role: 'assistant', content: '👥 Кадровый щит активирован! Давай проверим трудовые отношения, СОУТ, дистанционку и все кадровые риски!' }],
    [GameLevel.TAX_LABYRINTH]: [{ role: 'assistant', content: '💰 Налоговый лабиринт! Проверим дробление, самозанятых, контрагентов и все налоговые риски. Входим?' }]
  });
  
  // Получаем сообщения для текущего уровня
  const messages = levelMessages[currentLevel];
  
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showQuestions, setShowQuestions] = useState(true);
  const [showTab, setShowTab] = useState<'chat' | 'summary'>('chat');
  const [showSidebar, setShowSidebar] = useState(false); // Для мобильных устройств
  
  // Маппинг GameLevel на id в gameStructure
  const levelIdMap: Record<GameLevel, string> = {
    [GameLevel.PRIMARY_AUDIT]: 'digital_shield',
    [GameLevel.JUDICIAL_FORTRESS]: 'judicial_fortress',
    [GameLevel.HR_JUNGLE]: 'hr_shield',
    [GameLevel.TAX_LABYRINTH]: 'tax_labyrinth'
  };
  
  // Получаем текущий уровень из gameStructure
  const currentLevelId = levelIdMap[currentLevel];
  const currentLevelData = GAME_LEVELS.find(l => l.id === currentLevelId);
  
  // Сохраняем ответы на вопросы
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, boolean | null>>(() => {
    const saved = localStorage.getItem('questionAnswers');
    return saved ? JSON.parse(saved) : {};
  });
  
  // Обработчик ответа на вопрос
  const handleQuestionAnswer = (questionId: number, answer: boolean) => {
    const key = `${currentLevelId}_${questionId}`;
    setQuestionAnswers(prev => {
      const newAnswers = { ...prev, [key]: answer };
      localStorage.setItem('questionAnswers', JSON.stringify(newAnswers));
      
      // Обновляем баллы
      const question = currentLevelData?.questions.find(q => q.id === questionId);
      if (question) {
        const oldAnswer = prev[key];
        let pointsToAdd = 0;
        
        if (oldAnswer === answer) {
          pointsToAdd = 0; // Уже отвечен
        } else if (oldAnswer === true && answer === false) {
          pointsToAdd = -question.points; // Меняем с Да на Нет
        } else if (oldAnswer === false && answer === true) {
          pointsToAdd = question.points; // Меняем с Нет на Да
        } else {
          pointsToAdd = answer ? question.points : 0; // Новый ответ
        }
        
        setLevelScores(prevScores => {
          const newScores = {
            ...prevScores,
            [currentLevelId]: Math.max(0, Math.min(
              (prevScores[currentLevelId] || 0) + pointsToAdd,
              currentLevelData.maxPoints
            ))
          };
          localStorage.setItem('levelScores', JSON.stringify(newScores));
          return newScores;
        });
      }
      
      return newAnswers;
    });
  };

  const handleProfileSave = async (data: ProfileData) => {
    setProfileData(data);
    localStorage.setItem('profileData', JSON.stringify(data));
    
    // Обновляем данные профиля в Яндекс.Диске, если пользователь зарегистрирован
    if (currentUserEmail) {
      try {
        const { saveToYandexDisk } = await import('./services/yandexDiskService');
        const usersData = localStorage.getItem('users');
        if (usersData) {
          const users = JSON.parse(usersData);
          const user = users[currentUserEmail];
          if (user) {
            await saveToYandexDisk({
              email: currentUserEmail,
              registeredAt: user.registeredAt || new Date().toISOString(),
              consentPersonalData: user.consentPersonalData || false,
              consentMarketing: user.consentMarketing || false,
              profileData: {
                name: data.name,
                company: data.company,
                position: data.position,
                phone: data.phone,
                industry: data.industry,
                employees: data.employees
              }
            });
          }
        }
      } catch (diskError) {
        console.error('Ошибка обновления профиля в Яндекс.Диск:', diskError);
      }
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentLevel]);

  // Функция для агрегации всех рисков по уровню
  const getLevelRisks = (level: GameLevel): Risk[] => {
    const messages = levelMessages[level] || [];
    const allRisks: Risk[] = [];
    const riskIds = new Set<string>();
    
    // Собираем все риски из сообщений
    messages.forEach(msg => {
      if (msg.risks && msg.risks.length > 0) {
        msg.risks.forEach(risk => {
          // Убираем дубликаты по id
          if (!riskIds.has(risk.id)) {
            riskIds.add(risk.id);
            allRisks.push(risk);
          }
        });
      }
    });
    
    // Сортируем по severity (HIGH -> MEDIUM -> LOW)
    const severityOrder: Record<string, number> = { HIGH: 0, high: 0, MEDIUM: 1, medium: 1, LOW: 2, low: 2 };
    return allRisks.sort((a, b) => {
      const aSeverity = (a.severity || '').toUpperCase();
      const bSeverity = (b.severity || '').toUpperCase();
      return (severityOrder[aSeverity] ?? 3) - (severityOrder[bSeverity] ?? 3);
    });
  };

  // Обработчик смены уровня аудита
  const handleLevelChange = (levelId: GameLevel) => {
    setCurrentLevel(levelId);
    setShowQuestions(true); // Показываем вопросы при смене уровня
    setShowTab('chat'); // Сбрасываем таб на чат
    // История автоматически переключается через messages, которые зависят от currentLevel
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Сбрасываем input для возможности повторной загрузки того же файла
    e.target.value = '';
    
    setAvatarState(AvatarState.ANALYZING);
    setIsAnalyzing(true);
    
    try {
      let text = '';
      console.log('📁 Начало обработки файла:', file.name, 'тип:', file.type);
      
      // Проверяем тип файла
      if (file.type === 'text/plain' || file.type === 'text/markdown' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        // Текстовые файлы
        text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve(event.target?.result as string);
          };
          reader.onerror = reject;
          reader.readAsText(file);
        });
      } else if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // DOCX файлы - используем mammoth для извлечения текста
        setLevelMessages(prev => ({
          ...prev,
          [currentLevel]: [...prev[currentLevel], { 
            role: 'assistant', 
            content: '📄 Загружен файл .docx. Извлечение текста...' 
          }]
        }));
        
        try {
          console.log('📄 Начало обработки .docx файла:', file.name);
          // Динамический импорт mammoth
          let mammoth;
          try {
            const mammothModule = await import('mammoth');
            mammoth = mammothModule.default || mammothModule;
            console.log('✅ Mammoth успешно загружен');
          } catch (importError: any) {
            console.error('❌ Ошибка импорта mammoth:', importError);
            throw new Error(`Не удалось загрузить библиотеку обработки .docx: ${importError?.message || 'Неизвестная ошибка'}`);
          }
          
          // Конвертируем файл в ArrayBuffer
          console.log('📦 Конвертация файла в ArrayBuffer...');
          const arrayBuffer = await file.arrayBuffer();
          console.log('✅ ArrayBuffer создан, размер:', arrayBuffer.byteLength, 'байт');
          
          // Извлекаем текст из .docx
          console.log('🔍 Извлечение текста из .docx...');
          const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
          console.log('✅ Текст извлечен, длина:', result.value?.length || 0, 'символов');
          
          text = result.value || `Документ: ${file.name}\n\nТекст не удалось извлечь из .docx файла. Попробуйте сохранить документ как .txt или скопировать текст.`;
          
          // Если есть предупреждения, логируем их
          if (result.messages && result.messages.length > 0) {
            console.warn('⚠️ Mammoth warnings:', result.messages);
          }
        } catch (docxError: any) {
          console.error('❌ DOCX extraction error:', docxError);
          const errorMessage = docxError?.message || docxError?.toString() || 'Неизвестная ошибка';
          console.error('❌ Полная информация об ошибке:', {
            message: errorMessage,
            stack: docxError?.stack,
            name: docxError?.name
          });
          
          setLevelMessages(prev => ({
            ...prev,
            [currentLevel]: [...prev[currentLevel], { 
              role: 'assistant', 
              content: `❌ Ошибка при обработке .docx файла: ${errorMessage}. Попробуйте сохранить документ как .txt или скопировать текст.` 
            }]
          }));
          
          setAvatarState(AvatarState.IDLE);
          setIsAnalyzing(false);
          return; // Прерываем выполнение, чтобы не вызывать processAnalysis с пустым текстом
        }
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // PDF файлы - используем pdfjs-dist для извлечения текста
        setLevelMessages(prev => ({
          ...prev,
          [currentLevel]: [...prev[currentLevel], { 
            role: 'assistant', 
            content: '📄 Загружен PDF файл. Извлечение текста... Это может занять некоторое время.' 
          }]
        }));
        
        try {
          console.log('📄 Начало обработки PDF файла:', file.name);
          
          // Динамический импорт pdfjs-dist
          let pdfjsLib: any;
          try {
            const pdfjsModule = await import('pdfjs-dist');
            // В версии 5.x экспорт может быть разным
            pdfjsLib = pdfjsModule.default || pdfjsModule;
            console.log('✅ PDF.js успешно загружен, версия:', pdfjsLib.version || 'неизвестна');
          } catch (importError: any) {
            console.error('❌ Ошибка импорта pdfjs-dist:', importError);
            throw new Error(`Не удалось загрузить библиотеку обработки PDF: ${importError?.message || 'Неизвестная ошибка'}`);
          }
          
          // Настройка worker для pdfjs-dist
          // Используем worker из node_modules через правильный путь
          if (typeof window !== 'undefined') {
            const version = pdfjsLib.version || '5.4.530';
            
            // Пробуем несколько вариантов загрузки worker
            // 1. Через unpkg (более надежный CDN)
            const workerUrl = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
            
            if (pdfjsLib.GlobalWorkerOptions) {
              pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
            } else if (pdfjsLib.setWorkerSrc) {
              pdfjsLib.setWorkerSrc(workerUrl);
            }
            
            console.log('✅ Worker настроен:', workerUrl);
          }
          
          // Конвертируем файл в ArrayBuffer
          console.log('📦 Конвертация PDF файла в ArrayBuffer...');
          const arrayBuffer = await file.arrayBuffer();
          console.log('✅ ArrayBuffer создан, размер:', arrayBuffer.byteLength, 'байт');
          
          // Загружаем PDF документ
          console.log('🔍 Загрузка PDF документа...');
          // Используем правильный метод для версии 5.x
          const getDocument = pdfjsLib.getDocument || (pdfjsLib as any).getDocument;
          if (!getDocument) {
            throw new Error('Метод getDocument не найден в pdfjs-dist');
          }
          
          const loadingTask = getDocument({ data: arrayBuffer });
          const pdfDocument = await loadingTask.promise;
          console.log('✅ PDF документ загружен, страниц:', pdfDocument.numPages);
          
          // Извлекаем текст со всех страниц
          console.log('📝 Извлечение текста из PDF...');
          const textParts: string[] = [];
          
          for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
            console.log(`📄 Обработка страницы ${pageNum} из ${pdfDocument.numPages}...`);
            const page = await pdfDocument.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // Объединяем текстовые элементы страницы
            // В pdfjs-dist items - это массив объектов с полем str
            const pageText = (textContent.items as any[])
              .map((item: any) => item.str || '')
              .filter((str: string) => str.trim().length > 0)
              .join(' ')
              .trim();
            
            if (pageText) {
              textParts.push(`--- Страница ${pageNum} ---\n${pageText}\n`);
            }
          }
          
          text = textParts.length > 0 
            ? `PDF документ: ${file.name}\n\n${textParts.join('\n')}`
            : `PDF документ: ${file.name}\n\nТекст не удалось извлечь из PDF файла. Возможно, документ содержит только изображения. Попробуйте использовать OCR для изображений страниц.`;
          
          console.log('✅ Текст извлечен из PDF, длина:', text.length, 'символов, страниц обработано:', textParts.length);
        } catch (pdfError: any) {
          console.error('❌ PDF extraction error:', pdfError);
          const errorMessage = pdfError?.message || pdfError?.toString() || 'Неизвестная ошибка';
          console.error('❌ Полная информация об ошибке:', {
            message: errorMessage,
            stack: pdfError?.stack,
            name: pdfError?.name
          });
          
          setLevelMessages(prev => ({
            ...prev,
            [currentLevel]: [...prev[currentLevel], { 
              role: 'assistant', 
              content: `❌ Ошибка при обработке PDF файла: ${errorMessage}. Попробуйте сохранить документ как .txt или использовать OCR для изображений страниц.` 
            }]
          }));
          
          setAvatarState(AvatarState.IDLE);
          setIsAnalyzing(false);
          return;
        }
      } else if (file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
        // Изображения - используем OCR
        setLevelMessages(prev => ({
          ...prev,
          [currentLevel]: [...prev[currentLevel], { 
            role: 'assistant', 
            content: '🖼️ Загружено изображение. Распознавание текста с помощью OCR...' 
          }]
        }));
        
        try {
          // Динамический импорт Tesseract.js
          const { createWorker } = await import('tesseract.js');
          const worker = await createWorker('rus+eng');
          
          const { data: { text: ocrText } } = await worker.recognize(file);
          await worker.terminate();
          
          text = ocrText || `Изображение: ${file.name}\n\nТекст не распознан. Убедитесь, что изображение содержит читаемый текст.`;
        } catch (ocrError) {
          console.error('OCR Error:', ocrError);
          text = `Изображение: ${file.name}\n\nОшибка распознавания текста. Попробуйте загрузить более четкое изображение или текстовый файл.`;
        }
      } else {
        // Другие типы файлов
        text = `Файл: ${file.name}\n\nТип файла не поддерживается для автоматического распознавания. Пожалуйста, загрузите текстовый файл (.txt, .md), PDF или изображение.`;
      }
      
      console.log('📝 Текст подготовлен, длина:', text.length, 'символов');
      
      if (text && text.trim().length > 0) {
        setLevelMessages(prev => ({
          ...prev,
          [currentLevel]: [...prev[currentLevel], { role: 'user', content: `Загружен документ: ${file.name}` }]
        }));
        
        console.log('🚀 Запуск анализа текста...');
        try {
          await processAnalysis(text.slice(0, 8000));
          console.log('✅ Анализ завершен успешно');
        } catch (analysisError: any) {
          console.error('❌ Analysis error:', analysisError);
          console.error('❌ Полная информация об ошибке анализа:', {
            message: analysisError?.message,
            stack: analysisError?.stack,
            name: analysisError?.name
          });
          
          setLevelMessages(prev => ({
            ...prev,
            [currentLevel]: [...prev[currentLevel], { 
              role: 'assistant', 
              content: `❌ Ошибка при анализе документа: ${analysisError?.message || analysisError?.toString() || 'Неизвестная ошибка'}. Попробуйте еще раз.` 
            }]
          }));
          setAvatarState(AvatarState.IDLE);
          setIsAnalyzing(false);
        }
      } else {
        console.warn('⚠️ Текст пустой, анализ не выполняется');
        setLevelMessages(prev => ({
          ...prev,
          [currentLevel]: [...prev[currentLevel], { 
            role: 'assistant', 
            content: '⚠️ Не удалось извлечь текст из файла. Попробуйте загрузить файл в другом формате (.txt, .md).' 
          }]
        }));
        setAvatarState(AvatarState.IDLE);
        setIsAnalyzing(false);
      }
    } catch (error: any) {
      console.error('❌ File upload error:', error);
      console.error('❌ Полная информация об ошибке загрузки:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        cause: error?.cause
      });
      
      setLevelMessages(prev => ({
        ...prev,
        [currentLevel]: [...prev[currentLevel], { 
          role: 'assistant', 
          content: `❌ Ошибка при обработке файла: ${error?.message || error?.toString() || 'Неизвестная ошибка'}. Проверьте консоль браузера (F12) для деталей.` 
        }]
      }));
      setAvatarState(AvatarState.IDLE);
      setIsAnalyzing(false);
    }
  };

  const processAnalysis = async (text: string) => {
    console.log('🔍 processAnalysis вызван, длина текста:', text.length);
    setAvatarState(AvatarState.ANALYZING);
    setIsAnalyzing(true);
    
    const levelInfo = LEVELS.find(l => l.id === currentLevel);
    console.log('📋 Уровень:', levelInfo?.name, 'описание:', levelInfo?.description);
    
    try {
      console.log('📤 Отправка запроса к API для анализа...');
      const result = await qwen.analyzeText(text, levelInfo?.description || "");
      console.log('✅ Получен результат анализа:', {
        commentaryLength: result.commentary?.length || 0,
        risksCount: result.risks?.length || 0,
        state: result.state
      });
      
      // Обновляем сообщения только для текущего уровня
      setLevelMessages(prev => ({
        ...prev,
        [currentLevel]: [
          ...prev[currentLevel], 
          { 
            role: 'assistant', 
            content: result.commentary, 
            risks: result.risks,
            stateChange: result.state as AvatarState
          }
        ]
      }));
      
      setAvatarState(result.state as AvatarState);
      
      // Обновляем баллы на основе healthImpact (преобразуем в баллы)
      // healthImpact: -50 до +50 преобразуем в изменение баллов
      const scoreChange = Math.round((result.healthImpact || 0) * 2); // -100 до +100 баллов за разумные изменения
      
      setLevelScores(prev => {
        const newScores = {
          ...prev,
          [currentLevelId]: Math.max(0, Math.min(
            GAME_LEVELS.find(l => l.id === currentLevelId)?.maxPoints || 0,
            (prev[currentLevelId] || 0) + scoreChange
          ))
        };
        localStorage.setItem('levelScores', JSON.stringify(newScores));
        return newScores;
      });
    } catch (error: any) {
      console.error('❌ Error analyzing text:', error);
      console.error('❌ Полная информация об ошибке анализа:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        cause: error?.cause,
        response: error?.response
      });
      
      let errorMessage = 'Неизвестная ошибка';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.toString) {
        errorMessage = error.toString();
      }
      
      setLevelMessages(prev => ({
        ...prev,
        [currentLevel]: [...prev[currentLevel], { 
          role: 'assistant', 
          content: error?.message?.includes('недоступна') || error?.message?.includes('Qwen') 
            ? `❌ Локальная модель Qwen недоступна! Убедитесь, что API запущен: cd /root/qwen-model && ./start_api.sh`
            : error?.message?.includes('API key') || error?.message?.includes('authentication')
            ? "❌ Используется локальная модель Qwen. Проверьте, что API запущен на порту 8001."
            : error?.message?.includes('Load failed') || 
              error?.message?.includes('Failed to fetch') || 
              error?.message?.includes('NetworkError') ||
              error?.message?.includes('LLMost API недоступен') ||
              (error?.name === 'TypeError' && errorMessage?.includes('Load failed'))
            ? `❌ Ошибка подключения к API: ${errorMessage}\n\nВозможные причины:\n• Проблема с интернет-соединением\n• Блокировка запросов расширениями браузера\n• Проблема с CORS\n• Временная недоступность API\n\nПопробуйте:\n1. Проверить интернет-соединение\n2. Отключить расширения браузера (AdBlock и т.д.)\n3. Попробовать другой браузер\n4. Открыть консоль браузера (F12) для деталей`
            : `❌ Ошибка: ${errorMessage}. Проверьте консоль браузера (F12) для деталей.`
        }]
      }));
      setAvatarState(AvatarState.IDLE);
      setIsAnalyzing(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isAnalyzing) return;
    
    const userMsg = input;
    setInput('');
    
    // Добавляем сообщение пользователя в историю текущего уровня
    setLevelMessages(prev => ({
      ...prev,
      [currentLevel]: [...prev[currentLevel], { role: 'user', content: userMsg }]
    }));
    
    await processAnalysis(userMsg);
  };

  // Обработчики аутентификации
  const handleLogin = (email: string) => {
    setCurrentUserEmail(email);
    setIsAuthenticated(true);
    setShowLogin(false);
  };

  const handleRegister = (email: string) => {
    setCurrentUserEmail(email);
    setIsAuthenticated(true);
    setShowLogin(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setIsAuthenticated(false);
    setCurrentUserEmail('');
    setShowLogin(true);
  };

  // Если не аутентифицирован, показываем страницу входа/регистрации
  if (!isAuthenticated) {
    return showLogin ? (
      <LoginPage
        onLogin={handleLogin}
        onSwitchToRegister={() => setShowLogin(false)}
      />
    ) : (
      <RegisterPage
        onRegister={handleRegister}
        onSwitchToLogin={() => setShowLogin(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F4FF] text-[#111C57] flex flex-col lg:flex-row h-screen overflow-hidden">
      
      {/* Мобильное меню кнопка */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="lg:hidden fixed top-3 sm:top-4 left-3 sm:left-4 z-30 w-11 h-11 sm:w-12 sm:h-12 bg-indigo-600 text-white rounded-xl shadow-lg flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all"
        style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
        aria-label="Меню"
      >
        <span className="text-xl sm:text-2xl font-bold">{showSidebar ? '✕' : '☰'}</span>
      </button>
      
      {/* Overlay для мобильных */}
      {showSidebar && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setShowSidebar(false)}
        />
      )}
      
      {/* Sidebar: Navigation & Avatar */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-full lg:w-[420px] p-4 sm:p-6 lg:p-8 flex flex-col items-center border-b lg:border-b-0 lg:border-r border-indigo-100 bg-white/95 lg:bg-white/40 backdrop-blur-xl lg:backdrop-blur-none shadow-xl z-20 overflow-y-auto transition-transform duration-300 ${
        showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Кнопка выхода */}
        <div className="w-full mb-4 flex justify-end">
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition-all"
            style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
          >
            Выход
          </button>
        </div>
        
        <div className="flex flex-col items-center w-full">
          <div className="mb-4 sm:mb-6 lg:mb-10 text-center px-2">
            <h1
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-[900] italic tracking-tighter bg-gradient-to-br from-indigo-700 to-rose-500 bg-clip-text text-transparent uppercase leading-none"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                letterSpacing: '0.12em',
                whiteSpace: 'normal',
                wordBreak: 'keep-all'
              }}
            >
              ЛЕГАЛФЛОУ
            </h1>
          </div>
          
          <div className="transform-none cursor-pointer" onClick={() => setShowProfile(true)}>
            <Avatar state={AvatarState.IDLE} avatarUrl={profileData.avatar} />
          </div>
          
          <div className="mt-6 lg:mt-12 w-full flex flex-col items-center gap-4 lg:gap-8">
            <HealthBar score={totalScore} maxScore={1000} />
            
            <nav className="w-full space-y-2 lg:space-y-4">
              <p className="text-sm sm:text-base lg:text-lg font-black text-indigo-700 uppercase tracking-wider px-2 mb-2 lg:mb-4" style={{fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800}}>Разделы Аудита</p>
              {LEVELS.map(level => (
                <button
                  key={level.id}
                  onClick={() => {
                    handleLevelChange(level.id);
                    setShowSidebar(false); // Закрываем sidebar на мобильных после выбора
                  }}
                  className={`w-full p-3 sm:p-4 lg:p-5 rounded-xl lg:rounded-2xl flex items-start gap-3 lg:gap-4 transition-all border-2 active:scale-95 ${
                  currentLevel === level.id 
                    ? 'border-indigo-600 bg-indigo-50 shadow-lg' 
                    : 'border-transparent hover:bg-white hover:border-indigo-100'
                }`}
                >
                  <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center text-xl lg:text-2xl shadow-sm flex-shrink-0 ${currentLevel === level.id ? 'bg-indigo-600' : 'bg-indigo-50'}`}>
                    {level.icon}
                  </div>
                  <div className="text-left flex-1 overflow-visible min-w-0">
                    <div className="text-base sm:text-lg lg:text-xl font-black text-[#111C57] mb-1 lg:mb-2 leading-tight" style={{fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '0.02em', fontWeight: 800}}>{level.name}</div>
                    <div className="text-xs sm:text-sm lg:text-base text-indigo-700 font-semibold leading-relaxed whitespace-normal break-words" style={{fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: '1.5', fontWeight: 600}}>{level.description}</div>
                  </div>
                  {currentLevel === level.id && <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse flex-shrink-0"></div>}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-12 w-full">
          <div className="p-6 rounded-2xl border-2 border-indigo-50 bg-white/60 text-sm font-semibold leading-relaxed text-indigo-700/70 shadow-sm italic" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
            "Игровые механики повышают вовлеченность и заставляют внимательнее относиться к критическим рискам."
            <div className="mt-2 text-xs opacity-50">— Научное обоснование, Глава 3</div>
          </div>
        </div>
      </aside>

      {/* Main Content: Chat & Interaction */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-white/20">
        
        {/* Header Display */}
        <div className="pl-14 sm:pl-16 lg:pl-4 pr-3 sm:pr-4 md:pr-6 lg:pr-8 py-2.5 sm:py-3 lg:py-4 border-b border-indigo-50 bg-white/60 backdrop-blur-xl flex justify-between items-center z-10">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 pr-2">
            <span className="text-lg sm:text-xl md:text-2xl flex-shrink-0">{LEVELS.find(l => l.id === currentLevel)?.icon}</span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-black text-[#111C57] mb-0.5 sm:mb-1 leading-tight break-words" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>{LEVELS.find(l => l.id === currentLevel)?.name}</h2>
              <p className="text-xs sm:text-sm text-indigo-600 font-medium leading-snug break-words line-clamp-2">{LEVELS.find(l => l.id === currentLevel)?.description}</p>
            </div>
          </div>
        </div>

        {/* Tabs: Questions / Chat / Summary */}
        <div className="border-b border-indigo-100 bg-white/60 flex overflow-x-auto">
          <button
            onClick={() => setShowQuestions(true)}
            className={`flex-1 min-w-[120px] py-2.5 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm lg:text-base font-bold transition-all active:scale-95 ${
              showQuestions
                ? 'bg-indigo-600 text-white border-b-2 border-indigo-600'
                : 'text-indigo-600 hover:bg-indigo-50'
            }`}
            style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
          >
            <span className="hidden sm:inline">📋 </span>Вопросы
          </button>
          <button
            onClick={() => { setShowQuestions(false); setShowTab('chat'); }}
            className={`flex-1 min-w-[120px] py-2.5 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm lg:text-base font-bold transition-all active:scale-95 ${
              !showQuestions && showTab === 'chat'
                ? 'bg-indigo-600 text-white border-b-2 border-indigo-600'
                : 'text-indigo-600 hover:bg-indigo-50'
            }`}
            style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
          >
            <span className="hidden sm:inline">💬 </span>Чат
          </button>
          <button
            onClick={() => { setShowQuestions(false); setShowTab('summary'); }}
            className={`flex-1 min-w-[120px] py-2.5 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm lg:text-base font-bold transition-all active:scale-95 ${
              !showQuestions && showTab === 'summary'
                ? 'bg-indigo-600 text-white border-b-2 border-indigo-600'
                : 'text-indigo-600 hover:bg-indigo-50'
            }`}
            style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
          >
            <span className="hidden sm:inline">📊 </span>Анализ
          </button>
        </div>

        {/* Questions Area */}
        {showQuestions && currentLevelData && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-[#111C57] mb-2 leading-tight break-words" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
                  Вопросы аудита: {currentLevelData.name}
                </h3>
                <p className="text-xs sm:text-sm md:text-base text-indigo-600 font-medium leading-relaxed">
                  Ответьте на вопросы для оценки вашего уровня соответствия. За каждый положительный ответ вы получите баллы.
                </p>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                {currentLevelData.questions.map((question) => {
                  const answerKey = `${currentLevelId}_${question.id}`;
                  const answer = questionAnswers[answerKey] ?? null;
                  return (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      index={question.id}
                      answer={answer}
                      onAnswer={handleQuestionAnswer}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Summary Tab */}
        {!showQuestions && showTab === 'summary' && currentLevelData && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-5xl mx-auto">
                    <RiskSummary
                      level={currentLevel}
                      levelName={currentLevelData.name}
                      risks={getLevelRisks(currentLevel)}
                      totalScore={levelScores[currentLevelId] || 0}
                      maxScore={currentLevelData.maxPoints}
                      messages={levelMessages[currentLevel] || []}
                      questions={currentLevelData.questions.map(q => ({
                        id: q.id,
                        text: q.text,
                        answer: questionAnswers[`${currentLevelId}_${q.id}`] ?? null
                      }))}
                      profileData={profileData}
                    />
            </div>
          </div>
        )}

        {/* Chat Area */}
        {!showQuestions && showTab === 'chat' && (
        <>
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8 scroll-smooth"
        >
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-full group`}>
              <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 shadow-sm flex gap-3 sm:gap-4 ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-200 flex-row-reverse' 
                  : 'bg-white text-[#111C57] border border-indigo-50 rounded-tl-none shadow-indigo-100/50'
              }`}>
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0">
                    <Avatar state={msg.stateChange || avatarState} size="small" />
                  </div>
                )}
                <p className={`text-sm sm:text-base lg:text-lg font-medium leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'text-right' : ''}`} style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>{msg.content}</p>
              </div>

              {msg.risks && msg.risks.length > 0 && (
                <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {msg.risks.map(risk => (
                    <RiskCard key={risk.id} risk={risk} />
                  ))}
                </div>
              )}
            </div>
          ))}
          {isAnalyzing && (
            <div className="flex flex-col items-center gap-4 text-indigo-600 font-black italic text-sm">
              <div className="flex items-center gap-3 animate-pulse">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-200"></span>
                </div>
                <span>Блондинка изучает твои кодексы...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Controls */}
        <div className="p-4 sm:p-6 lg:p-8 border-t border-indigo-50 bg-white/80 backdrop-blur-2xl">
          <div className="max-w-5xl mx-auto flex flex-col gap-3 sm:gap-4 lg:gap-5">
            <div className="relative group">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Расскажите о своем деле..."
                className="w-full bg-indigo-50/50 border-2 border-indigo-100 rounded-2xl sm:rounded-3xl pl-4 sm:pl-6 pr-24 sm:pr-32 py-3 sm:py-4 lg:py-5 text-sm sm:text-base lg:text-lg font-semibold text-[#111C57] focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all placeholder:text-indigo-300 shadow-inner"
                style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
              />
              <button 
                onClick={handleSend}
                disabled={isAnalyzing || !input.trim()}
                className="absolute right-2 sm:right-3 top-2 sm:top-3 bottom-2 sm:bottom-3 bg-[#111C57] hover:bg-indigo-800 disabled:opacity-20 text-white px-4 sm:px-6 lg:px-8 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm lg:text-base transition-all shadow-lg active:scale-95 flex items-center gap-1 sm:gap-2 uppercase tracking-wide"
                style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
              >
                <span className="hidden sm:inline">Анализ</span>
                <span className="sm:hidden">→</span>
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-6">
              <label className="group flex items-center justify-center gap-2 sm:gap-3 cursor-pointer text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-all uppercase tracking-wide bg-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border-2 border-indigo-100 shadow-sm hover:shadow-md hover:border-indigo-200 active:scale-95" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
                <input type="file" className="hidden" accept=".txt,.doc,.docx,.pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp" onChange={handleFileUpload} />
                <span className="text-lg sm:text-xl">📄</span> <span className="hidden sm:inline">Загрузить Документ</span><span className="sm:hidden">Документ</span>
              </label>
              
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-white border border-indigo-100 flex items-center justify-center text-xs">⚖️</div>
                 <span className="text-xs font-semibold text-indigo-300" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>сделано Петровской О.Ю.</span>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </main>

      {/* Modern Accents */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-indigo-200/20 blur-[120px] rounded-full -z-10"></div>
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-rose-200/20 blur-[100px] rounded-full -z-10"></div>

      {/* Profile Modal */}
      {showProfile && (
        <ProfilePage
          onClose={() => setShowProfile(false)}
          profileData={profileData}
          onSave={handleProfileSave}
        />
      )}
    </div>
  );
};

export default App;
