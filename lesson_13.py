import requests
from bs4 import BeautifulSoup

class ParserCBRF:
    """
    Класс для парсинга курсов валют ЦБ РФ с таблицы на странице https://cbr.ru/currency_base/daily/
    Использует BeautifulSoup для парсинга таблицы — без pandas.read_html.
    """

    def __init__(self):
        self.base_url = "https://cbr.ru/currency_base/daily/"
        self.data = {}

    def start(self):
        """
        Публичный метод — точка входа.
        Вызывает приватные методы для загрузки, парсинга и сохранения.
        Возвращает словарь с данными: {"USD": 79.7796, "EUR": 92.8800, ...}
        """
        print("🚀 Запуск парсера курсов валют ЦБ РФ...")
        self._fetch_page()
        self._parse_table()
        print("✅ Парсинг завершён.")
        return self.data

    def _fetch_page(self):
        """
        Приватный метод — загружает HTML-страницу.
        """
        print(f"📥 Загружаем страницу с {self.base_url}...")
        try:
            response = requests.get(self.base_url)
            response.raise_for_status()
            response.encoding = 'utf-8'  # чтобы корректно читать кириллицу
            self.page_content = response.text
            print("✅ Страница успешно загружена.")
        except Exception as e:
            print(f"❌ Ошибка при загрузке страницы: {e}")
            raise

    def _parse_table(self):
        """
        Приватный метод — парсит таблицу с курсами валют вручную.
        """
        print("📖 Ищем таблицу с курсами валют...")
        soup = BeautifulSoup(self.page_content, 'html.parser')

        # Найдём таблицу с заголовками "Цифр. код", "Букв. код", "Единиц", "Валюта", "Курс"
        target_headers = ["Букв. код", "Курс"]
        found_table = None

        for table in soup.find_all('table'):
            # Извлекаем текст заголовков (первых строк)
            headers_row = table.find('tr')
            if headers_row:
                headers = [th.get_text(strip=True) for th in headers_row.find_all(['th', 'td'])]
                if target_headers[0] in headers and target_headers[1] in headers:
                    found_table = table
                    print(f"✅ Найдена таблица с заголовками: {headers}")
                    break

        if not found_table:
            print("❌ Таблица с курсами валют не найдена на странице.")
            return

        # Извлекаем строки таблицы
        rows = found_table.find_all('tr')[1:]  # Пропускаем заголовок

        data = []
        for row in rows:
            cells = row.find_all('td')
            if len(cells) >= 5:
                code = cells[1].get_text(strip=True)  # Букв. код
                rate = cells[4].get_text(strip=True)  # Курс
                data.append([code, rate])

        if not data:
            print("❌ Не удалось извлечь данные из таблицы.")
            return

        # Преобразуем курсы: заменяем запятую на точку и приводим к float
        processed_data = []
        for code, rate_str in data:
            try:
                rate = float(rate_str.replace(',', '.'))
                processed_data.append([code, rate])
            except ValueError:
                print(f"⚠️ Не удалось преобразовать курс '{rate_str}' для валюты {code}")
                continue

        # Создаём словарь: "букв. код" -> "курс"
        self.data = dict(processed_data)

        print(f"✅ Успешно обработано {len(self.data)} валют.")


# ==========================
# 💡 Пример использования
# ==========================
if __name__ == "__main__":
    parser = ParserCBRF()
    data = parser.start()

    # Выведем первые 5 валют
    print("\n📊 Последние 5 курсов валют ЦБ РФ:")
    for code, rate in list(data.items())[-5:]:
        print(f"💱 {code}: {rate}")
