import React, { useState } from 'react';
import { saveToYandexDisk } from '../services/yandexDiskService';

interface RegisterPageProps {
  onRegister: (email: string) => void;
  onSwitchToLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consentPersonalData, setConsentPersonalData] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Проверка обязательного согласия на обработку персональных данных
    if (!consentPersonalData) {
      setError('Для регистрации необходимо дать согласие на обработку персональных данных');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setLoading(true);

    try {
      // Проверка существующего пользователя
      let users;
      try {
        const usersData = localStorage.getItem('users');
        users = usersData ? JSON.parse(usersData) : {};
      } catch (parseError) {
        console.error('Ошибка парсинга users из localStorage:', parseError);
        setError('Ошибка чтения данных. Попробуйте очистить localStorage и зарегистрироваться заново.');
        setLoading(false);
        return;
      }
      
      // Нормализуем email (приводим к нижнему регистру и убираем пробелы)
      const normalizedEmail = email.trim().toLowerCase();
      
      if (!normalizedEmail) {
        setError('Введите email');
        setLoading(false);
        return;
      }
      
      // Проверяем, существует ли пользователь (ищем по нормализованному email среди всех ключей)
      let existingUser = null;
      if (users[normalizedEmail]) {
        existingUser = users[normalizedEmail];
      } else {
        // Проверяем все ключи на случай если сохранили с другим регистром
        for (const key in users) {
          if (key.toLowerCase() === normalizedEmail) {
            existingUser = users[key];
            break;
          }
        }
      }
      
      if (existingUser) {
        setError('Пользователь с таким email уже зарегистрирован');
        setLoading(false);
        return;
      }

      // Регистрация нового пользователя (сохраняем с нормализованным email)
      const registrationData = {
        email: normalizedEmail,
        password,
        registeredAt: new Date().toISOString(),
        consentPersonalData: true, // Всегда true, так как проверено выше
        consentMarketing: consentMarketing
      };
      
      users[normalizedEmail] = registrationData;
      localStorage.setItem('users', JSON.stringify(users));

      // Сохраняем текущего пользователя
      localStorage.setItem('currentUser', JSON.stringify({ email: normalizedEmail, ...users[normalizedEmail] }));
      
      // Сохраняем данные в Яндекс.Диск (асинхронно, не блокируем регистрацию)
      try {
        await saveToYandexDisk({
          email: normalizedEmail,
          registeredAt: registrationData.registeredAt,
          consentPersonalData: registrationData.consentPersonalData,
          consentMarketing: registrationData.consentMarketing
        });
      } catch (diskError) {
        console.error('Ошибка сохранения в Яндекс.Диск:', diskError);
        // Не блокируем регистрацию, если не удалось сохранить в Яндекс.Диск
      }
      
      onRegister(normalizedEmail);
    } catch (err: any) {
      console.error('Ошибка при регистрации:', err);
      setError(err?.message || 'Ошибка при регистрации. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md border-2 border-indigo-100">
        <div className="text-center mb-6 sm:mb-8">
          <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">👩‍💼</div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111C57] mb-2" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
            Блондинка в законе
          </h1>
          <p className="text-sm sm:text-base text-indigo-600 font-medium">Регистрация</p>
        </div>

        <form onSubmit={handleSubmit} autoComplete="on" className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-[#111C57] mb-2" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="username email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-indigo-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-base"
              style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs sm:text-sm font-bold text-[#111C57] mb-2" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
              Пароль
            </label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-indigo-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-base"
              style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
              placeholder="Минимум 6 символов"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-bold text-[#111C57] mb-2" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
              Подтвердите пароль
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-indigo-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-base"
              style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
              placeholder="Повторите пароль"
            />
          </div>

          {/* Чекбоксы согласий */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <input
                type="checkbox"
                id="consentPersonalData"
                checked={consentPersonalData}
                onChange={(e) => setConsentPersonalData(e.target.checked)}
                required
                className="mt-1 w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 border-2 border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer flex-shrink-0"
              />
              <label htmlFor="consentPersonalData" className="text-xs sm:text-sm text-[#111C57] font-medium leading-relaxed cursor-pointer" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
                <span className="text-rose-600">*</span> Даю согласие на обработку своих персональных данных
              </label>
            </div>
            
            <div className="flex items-start gap-2 sm:gap-3">
              <input
                type="checkbox"
                id="consentMarketing"
                checked={consentMarketing}
                onChange={(e) => setConsentMarketing(e.target.checked)}
                className="mt-1 w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 border-2 border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer flex-shrink-0"
              />
              <label htmlFor="consentMarketing" className="text-xs sm:text-sm text-[#111C57] font-medium leading-relaxed cursor-pointer" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
                Даю согласие на отправку мне информационно-рекламных материалов
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border-2 border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-semibold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#111C57] hover:bg-indigo-800 active:bg-indigo-900 disabled:opacity-50 text-white font-bold py-3 sm:py-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed touch-manipulation text-base sm:text-lg"
            style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-indigo-600">
            Уже есть аккаунт?{' '}
            <button
              onClick={onSwitchToLogin}
              className="font-bold text-indigo-600 hover:text-indigo-800 underline"
              style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
            >
              Войти
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

