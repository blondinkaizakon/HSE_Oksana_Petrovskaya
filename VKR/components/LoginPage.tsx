import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (email: string) => void;
  onSwitchToRegister: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Проверка наличия пользователя в localStorage
      let users;
      try {
        const usersData = localStorage.getItem('users');
        if (!usersData) {
          setError('База пользователей пуста. Пожалуйста, зарегистрируйтесь.');
          setLoading(false);
          return;
        }
        users = JSON.parse(usersData);
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
      
      // Ищем пользователя по нормализованному email (проверяем все ключи)
      let user = null;
      let userKey = null;
      
      // Проверяем нормализованный email
      if (users[normalizedEmail]) {
        user = users[normalizedEmail];
        userKey = normalizedEmail;
      } else {
        // Если не нашли, ищем среди всех ключей (на случай если сохранили с другим регистром)
        for (const key in users) {
          if (key.toLowerCase() === normalizedEmail) {
            user = users[key];
            userKey = key;
            break;
          }
        }
      }
      
      if (!user) {
        setError('Пользователь с таким email не найден. Проверьте правильность email или зарегистрируйтесь.');
        setLoading(false);
        return;
      }

      if (user.password !== password) {
        setError('Неверный пароль');
        setLoading(false);
        return;
      }

      // Сохраняем текущего пользователя (используем оригинальный ключ из localStorage)
      localStorage.setItem('currentUser', JSON.stringify({ email: userKey || normalizedEmail, ...user }));
      onLogin(userKey || normalizedEmail);
    } catch (err: any) {
      console.error('Ошибка при входе:', err);
      setError(err?.message || 'Ошибка при входе. Попробуйте еще раз.');
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
          <p className="text-sm sm:text-base text-indigo-600 font-medium">Вход в систему</p>
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-indigo-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-base"
              style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
              placeholder="••••••••"
            />
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
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-indigo-600">
            Нет аккаунта?{' '}
            <button
              onClick={onSwitchToRegister}
              className="font-bold text-indigo-600 hover:text-indigo-800 underline"
              style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
            >
              Зарегистрироваться
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

