import React, { useState } from 'react';

interface ProfileData {
  name: string;
  company: string;
  position: string;
  email: string;
  phone: string;
  industry: string;
  employees: string;
  avatar?: string; // URL или base64 изображения
}

interface ProfilePageProps {
  onClose: () => void;
  profileData: ProfileData;
  onSave: (data: ProfileData) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onClose, profileData, onSave }) => {
  const [formData, setFormData] = useState<ProfileData>(profileData);
  const [isEditing, setIsEditing] = useState(!profileData.name);

  const handleChange = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(profileData);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-rose-500 text-white p-4 sm:p-6 rounded-t-2xl sm:rounded-t-3xl flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-black" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
            Мой профиль
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 flex items-center justify-center transition-all touch-manipulation"
          >
            <span className="text-lg sm:text-xl">×</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-4 sm:mb-6">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full border-3 sm:border-4 border-indigo-200 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-3 sm:mb-4 shadow-xl overflow-hidden">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <svg viewBox="0 0 100 100" className="w-3/4 h-3/4">
                    <circle cx="50" cy="40" r="25" fill="#fdbcb4" stroke="#e89a91" strokeWidth="1.5"/>
                    <path d="M 30 35 Q 25 15, 35 12 Q 45 10, 55 12 Q 65 10, 70 15 Q 72 25, 70 35" 
                          fill="#ffd700" stroke="#ffc700" strokeWidth="1.5"/>
                    <circle cx="42" cy="38" r="2.5" fill="#654321"/>
                    <circle cx="58" cy="38" r="2.5" fill="#654321"/>
                    <path d="M 42 45 Q 50 50, 58 45" stroke="#654321" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                    <rect x="40" y="65" width="20" height="30" rx="3" fill="#2c2c2c"/>
                    <rect x="42" y="67" width="16" height="15" rx="2" fill="#ffffff"/>
                  </svg>
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-all shadow-lg">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData(prev => ({ ...prev, avatar: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <span className="text-xl">📷</span>
                </label>
              )}
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all"
              >
                Редактировать профиль
              </button>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#111C57] mb-2 uppercase tracking-wide">
                Имя
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Введите ваше имя"
                  className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl focus:outline-none focus:border-indigo-400 transition-all"
                  style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
                />
              ) : (
                <div className="px-4 py-3 bg-indigo-50 rounded-xl text-[#111C57] font-medium">
                  {formData.name || "Не указано"}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-[#111C57] mb-2 uppercase tracking-wide">
                Компания
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  placeholder="Название компании"
                  className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl focus:outline-none focus:border-indigo-400 transition-all"
                  style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
                />
              ) : (
                <div className="px-4 py-3 bg-indigo-50 rounded-xl text-[#111C57] font-medium">
                  {formData.company || "Не указано"}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-[#111C57] mb-2 uppercase tracking-wide">
                Должность
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => handleChange('position', e.target.value)}
                  placeholder="Ваша должность"
                  className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl focus:outline-none focus:border-indigo-400 transition-all"
                  style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
                />
              ) : (
                <div className="px-4 py-3 bg-indigo-50 rounded-xl text-[#111C57] font-medium">
                  {formData.position || "Не указано"}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#111C57] mb-2 uppercase tracking-wide">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-indigo-100 rounded-xl focus:outline-none focus:border-indigo-400 transition-all text-sm sm:text-base"
                    style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
                  />
                ) : (
                  <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-indigo-50 rounded-xl text-[#111C57] font-medium text-sm sm:text-base">
                    {formData.email || "Не указано"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#111C57] mb-2 uppercase tracking-wide">
                  Телефон
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+7 (999) 123-45-67"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-indigo-100 rounded-xl focus:outline-none focus:border-indigo-400 transition-all text-sm sm:text-base"
                    style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
                  />
                ) : (
                  <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-indigo-50 rounded-xl text-[#111C57] font-medium text-sm sm:text-base">
                    {formData.phone || "Не указано"}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#111C57] mb-2 uppercase tracking-wide">
                Отрасль
              </label>
              {isEditing ? (
                <select
                  value={formData.industry}
                  onChange={(e) => handleChange('industry', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl focus:outline-none focus:border-indigo-400 transition-all"
                  style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
                >
                  <option value="">Выберите отрасль</option>
                  <option value="IT">IT / Технологии</option>
                  <option value="retail">Розничная торговля</option>
                  <option value="production">Производство</option>
                  <option value="services">Услуги</option>
                  <option value="finance">Финансы</option>
                  <option value="construction">Строительство</option>
                  <option value="other">Другое</option>
                </select>
              ) : (
                <div className="px-4 py-3 bg-indigo-50 rounded-xl text-[#111C57] font-medium">
                  {formData.industry || "Не указано"}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-[#111C57] mb-2 uppercase tracking-wide">
                Количество сотрудников
              </label>
              {isEditing ? (
                <select
                  value={formData.employees}
                  onChange={(e) => handleChange('employees', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl focus:outline-none focus:border-indigo-400 transition-all"
                  style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
                >
                  <option value="">Выберите количество</option>
                  <option value="1">1 (ИП)</option>
                  <option value="2-10">2-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-250">51-250</option>
                  <option value="250+">250+</option>
                </select>
              ) : (
                <div className="px-4 py-3 bg-indigo-50 rounded-xl text-[#111C57] font-medium">
                  {formData.employees || "Не указано"}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
              <button
                onClick={handleSave}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-lg touch-manipulation text-sm sm:text-base"
                style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
              >
                Сохранить
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 text-[#111C57] rounded-xl font-bold hover:bg-gray-300 active:bg-gray-400 transition-all touch-manipulation text-sm sm:text-base"
                style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
              >
                Отмена
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

