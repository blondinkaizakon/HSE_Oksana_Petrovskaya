import re
import datetime
import time
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, NoSuchElementException, StaleElementReferenceException, \
    ElementClickInterceptedException
from webdriver_manager.chrome import ChromeDriverManager
import json

# --- Константы ---
EXCEL_FILE = "дела_арбитражных_судов_москва_вчера.xlsx"
KAD_ARB_URL = "https://kad.arbitr.ru/"


# --- Настройка драйвера ---
def get_driver():
    options = Options()
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-gpu')
    options.add_argument('--disable-extensions')
    options.add_argument('--disable-popup-blocking')
    options.add_argument('--start-maximized')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-web-security')
    options.add_argument('--allow-running-insecure-content')
    options.add_argument(
        '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    options.add_experimental_option("useAutomationExtension", False)
    options.add_experimental_option("excludeSwitches", ["enable-automation"])

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")
    driver.execute_script("Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});")
    driver.execute_script("Object.defineProperty(navigator, 'languages', {get: () => ['en-US', 'en']});")
    return driver


# --- Закрытие всплывающих окон ---
def close_popups(driver):
    try:
        close_buttons = driver.find_elements(By.CSS_SELECTOR,
                                             ".modal-close, .close, [aria-label='Close'], .b-promo_notification-popup .close")
        for button in close_buttons:
            if button.is_displayed():
                driver.execute_script("arguments[0].click();", button)
                time.sleep(1)
    except Exception as e:
        print(f"Ошибка при закрытии всплывающих окон: {e}")


# --- Получение вчерашней даты ---
def get_yesterday():
    today = datetime.datetime.now()
    yesterday = today - datetime.timedelta(days=1)
    return yesterday.strftime("%d.%m.%Y")


# --- Парсинг дел за вчера из АС Москвы ---
def parse_kad_cases(driver):
    cases = []
    day_yesterday_str = get_yesterday()
    page_num = 1

    print(f"🔍 Фильтр по дате: {day_yesterday_str}")
    print(f"🔍 Фильтр по суду: АС города Москвы")

    try:
        driver.get(KAD_ARB_URL)
        wait = WebDriverWait(driver, 60)
        print("Ожидаем загрузки главной страницы...")
        time.sleep(10)

        # Закрываем всплывающие окна
        close_popups(driver)

        # Устанавливаем дату: только вчера
        print("Ищем поля для ввода дат...")
        time.sleep(5)

        date_inputs = wait.until(EC.presence_of_all_elements_located(
            (By.CSS_SELECTOR, "input[type='text'][placeholder='дд.мм.гггг']")
        ))
        print(f"Найдено полей для дат: {len(date_inputs)}")

        if len(date_inputs) >= 2:
            print(f"Устанавливаем даты: {day_yesterday_str} - {day_yesterday_str}")

            date_inputs[0].clear()
            time.sleep(1)
            date_inputs[0].send_keys(day_yesterday_str)
            time.sleep(2)

            date_inputs[1].clear()
            time.sleep(1)
            date_inputs[1].send_keys(day_yesterday_str)
            time.sleep(2)

            print("Даты установлены успешно")
        else:
            print("❌ Не найдены поля для даты")
            return []

        # Закрываем всплывающие окна снова
        close_popups(driver)

        # Устанавливаем фильтр: только "АС города Москвы"
        print("Ищем поле для ввода суда...")
        time.sleep(3)

        court_found = False
        court_selectors = [
            (By.ID, "courtName"),
            (By.CSS_SELECTOR, "input[name='courtName']"),
            (By.CSS_SELECTOR, "input[data-field='court']"),
            (By.CSS_SELECTOR, ".court-input input"),
            (By.CSS_SELECTOR, "[class*='court'] input"),
            (By.XPATH, "//input[contains(@name, 'court') or contains(@id, 'court')]"),
            (By.XPATH, "//input[contains(@placeholder, 'суд') and not(contains(@placeholder, 'судья'))]"),
            (By.XPATH, "//input[contains(@placeholder, 'Суд') and not(contains(@placeholder, 'Судья'))]"),
            (By.XPATH, "//label[contains(text(), 'суд') and not(contains(text(), 'судья'))]/following-sibling::input"),
            (By.XPATH, "//label[contains(text(), 'Суд') and not(contains(text(), 'Судья'))]/following-sibling::input"),
            (By.XPATH, "//label[contains(text(), 'наименование суда')]/following-sibling::input"),
            (By.XPATH, "//label[contains(text(), 'Наименование суда')]/following-sibling::input")
        ]

        court_input = None
        for selector_type, selector in court_selectors:
            try:
                court_input = wait.until(EC.element_to_be_clickable((selector_type, selector)))
                if court_input.is_displayed() and court_input.is_enabled():
                    print(f"✅ Поле суда найдено через селектор: {selector}")
                    court_found = True
                    break
            except Exception as e:
                print(f"  Пробуем следующий селектор... ({type(e).__name__})")
                continue

        if not court_found:
            print("⚠️ Не удалось найти поле для ввода суда")
            return []

        if court_input:
            try:
                driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", court_input)
                time.sleep(1)
                court_input.clear()
                time.sleep(0.5)
                court_input.send_keys("АС города Москвы")
                time.sleep(2)
                print("Фильтр по суду установлен: АС города Москвы")
            except Exception as e:
                print(f"❌ Ошибка при установке фильтра по суду: {e}")

        # Закрываем всплывающие окна снова
        close_popups(driver)

        # Клик по кнопке "Найти"
        print("Ищем кнопку поиска...")
        time.sleep(3)

        search_clicked = False
        search_selectors = [
            (By.ID, "b-form-submit"),
            (By.CSS_SELECTOR, "#b-form-submit button"),
            (By.CSS_SELECTOR, ".b-form-submit button"),
            (By.CSS_SELECTOR, "button[type='submit']"),
            (By.XPATH, "//button[contains(text(), 'Найти')]"),
            (By.CSS_SELECTOR, ".b-button button"),
            (By.CSS_SELECTOR, "button.btn-search"),
            (By.CSS_SELECTOR, "input[type='submit']"),
            (By.CSS_SELECTOR, ".search-button"),
            (By.CSS_SELECTOR, "[class*='search'] button")
        ]

        for selector_type, selector in search_selectors:
            try:
                search_button = wait.until(EC.element_to_be_clickable((selector_type, selector)))
                if search_button.is_displayed():
                    print(f"Кнопка поиска найдена через селектор: {selector}, кликаем...")
                    driver.execute_script("arguments[0].scrollIntoView(true);", search_button)
                    time.sleep(1)
                    driver.execute_script("arguments[0].click();", search_button)
                    time.sleep(10)
                    search_clicked = True
                    break
            except Exception as e:
                print(f" Пробуем следующий селектор кнопки... ({type(e).__name__}: {e})")
                continue

        if not search_clicked:
            print("❌ Не удалось найти кнопку поиска")
            return []

        print(f"URL после поиска: {driver.current_url}")
        print("Начинаем парсинг страниц...")

        # Цикл по страницам результатов
        max_pages = 50
        while page_num <= max_pages:
            print(f"\n📄 Парсим страницу {page_num}...")
            print(f"URL текущей страницы: {driver.current_url}")
            time.sleep(5)

            try:
                tbody = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "#b-cases tbody")))
                rows = tbody.find_elements(By.TAG_NAME, "tr")

                print(f"Найдено строк в таблице: {len(rows)}")

                if not rows:
                    print("На странице нет дел.")
                    break

                page_cases = 0
                for row in rows:
                    try:
                        cells = row.find_elements(By.TAG_NAME, "td")
                        print(f"    Найдено колонок в строке: {len(cells)}")

                        if len(cells) < 4:
                            print(f"    ⏭️ Пропускаем строку - недостаточно колонок: {len(cells)}")
                            continue

                        # Извлечение данных из колонок
                        first_cell_text = cells[0].text.strip() if len(cells) > 0 else ""
                        case_date = ""
                        case_number = ""

                        if first_cell_text:
                            date_match = re.search(r"(\d{2}\.\d{2}\.\d{4})", first_cell_text)
                            if date_match:
                                case_date = date_match.group(1)
                                case_number = first_cell_text.replace(case_date, "").strip()
                            else:
                                case_number = first_cell_text
                                year_match = re.search(r'/(\d{4})', case_number)
                                if year_match:
                                    year = year_match.group(1)
                                    case_date = f"01.01.{year}"

                        court = ""
                        judge = ""

                        if len(cells) > 1:
                            cell_text = cells[1].text.strip()
                            parts = cell_text.split('\n')
                            if len(parts) >= 2:
                                judge = parts[0].strip()
                                court = parts[1].strip()
                            else:
                                if "ас" in cell_text.lower() or "арбитражный" in cell_text.lower():
                                    court = cell_text
                                else:
                                    judge = cell_text

                        # Проверка суда: только "АС города Москвы"
                        if "москв" not in court.lower() or "ас" not in court.lower():
                            print(f"    ⏭️ Пропускаем дело {case_number} - суд не подходит: '{court}'")
                            continue

                        # Проверка даты: только вчера
                        if case_date != day_yesterday_str:
                            print(
                                f"    ⏭️ Пропускаем дело {case_number} - дата не подходит: '{case_date}' (ожидаем: {day_yesterday_str})")
                            continue

                        istets_names = []
                        istets_addresses = []
                        otvetchik_names = []
                        otvetchik_addresses = []

                        if len(cells) > 2:
                            plaintiff_text = cells[2].text.strip()
                            if plaintiff_text:
                                istets_names.append(plaintiff_text)
                                istets_addresses.append("")

                        if len(cells) > 3:
                            defendant_text = cells[3].text.strip()
                            if defendant_text:
                                otvetchik_names.append(defendant_text)
                                otvetchik_addresses.append("")

                        claim_amount = ""

                        case_data = {
                            'Номер дела': case_number,
                            'Дата': case_date,
                            'Суд': court,
                            'Судья': judge,
                            'Наименование истца': ', '.join(istets_names),
                            'Адрес истца': ', '.join(istets_addresses),
                            'Наименование ответчика': ', '.join(otvetchik_names),
                            'Адрес ответчика': ', '.join(otvetchik_addresses),
                            'Сумма иска': claim_amount
                        }
                        cases.append(case_data)
                        page_cases += 1
                        print(f"  ✅ Добавлено дело: {case_number}")

                    except Exception as e:
                        print(f"Ошибка при обработке строки: {e}")
                        continue

                print(f"📊 На странице {page_num} найдено дел: {page_cases}")
                print(f"📈 Всего найдено дел: {len(cases)}")

                if page_cases == 0:
                    print("🛑 На странице нет дел - прекращаем парсинг")
                    break

                # Проверка наличия следующей страницы и переход на неё
                try:
                    next_button = None
                    next_selectors = [
                        "a.next-link:not(.disabled)",
                        "a[class*='next']:not(.disabled)",
                        "button[class*='next']:not(.disabled)",
                        ".pagination .next:not(.disabled)",
                        ".pager .next:not(.disabled)",
                        "a[title*='Следующая']",
                        "a[title*='Next']",
                        "button[title*='Следующая']",
                        "button[title*='Next']",
                        "a[aria-label*='Следующая']",
                        "a[aria-label*='Next']",
                        ".pagination a:last-child:not(.disabled)",
                        ".pager a:last-child:not(.disabled)",
                        "a[href*='page']",
                        ".pagination a[href*='page']",
                        ".pager a[href*='page']"
                    ]

                    print("Ищем кнопку 'Следующая'...")
                    for selector in next_selectors:
                        try:
                            elements = driver.find_elements(By.CSS_SELECTOR, selector)
                            for elem in elements:
                                if elem.is_enabled() and elem.is_displayed():
                                    next_button = elem
                                    print(f"Кнопка 'Следующая' найдена через селектор: {selector}")
                                    break
                            if next_button:
                                break
                        except Exception as e:
                            continue

                    if next_button and next_button.is_enabled() and next_button.is_displayed():
                        print("Переходим на следующую страницу...")
                        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", next_button)
                        time.sleep(1)
                        driver.execute_script("arguments[0].click();", next_button)
                        page_num += 1
                        print(f"Ожидаем загрузки страницы {page_num}...")
                        time.sleep(15)

                        try:
                            current_url = driver.current_url
                            print(f"Текущий URL: {current_url}")
                        except Exception as e:
                            print(f"❌ Браузер закрылся: {e}")
                            break

                        try:
                            wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "#b-cases tbody")))
                            print(f"Страница {page_num} загружена успешно")
                        except TimeoutException:
                            print(f"Таймаут при загрузке страницы {page_num}")
                            break
                    else:
                        print("Кнопка 'Следующая' недоступна.")
                        break

                except Exception as e:
                    print(f"Ошибка при поиске кнопки 'Следующая': {e}")
                    break

            except TimeoutException:
                print("Таймаут при загрузке таблицы.")
                break
            except Exception as e:
                print(f"Ошибка при парсинге страницы: {e}")
                break

    except Exception as e:
        print(f"Ошибка при парсинге: {e}")

    return cases


# --- Основная функция ---
def main():
    print("🚀 Запуск парсера дел АС Москвы за вчера...")

    driver = None
    try:
        driver = get_driver()
        driver.get(KAD_ARB_URL)

        cases = parse_kad_cases(driver)

        if cases:
            print(f"\n✅ Найдено дел: {len(cases)}")

            # Сохраняем результаты в Excel
            df = pd.DataFrame(cases)
            df.to_excel(EXCEL_FILE, index=False)
            print(f"💾 Результаты сохранены в файл: {EXCEL_FILE}")

        else:
            print("⚠️ Дела не найдены.")

    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if driver:
            driver.quit()


if __name__ == "__main__":
    main()