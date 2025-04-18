def factorial(n):
    """Вычисляет факториал числа n."""
    if n < 0:
        return None
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result


def max_of_three(numbers):
    """Находит наибольшее число из трёх."""
    return max(numbers)


def right_triangle_area(a, b):
    """Вычисляет площадь прямоугольного треугольника по двум катетам."""
    return (a * b) / 2



if __name__ == "__main__":
    # Тестирование factorial
    print("Факториал 5:", factorial(5))  # 120
    print("Факториал -3:", factorial(-3))  # None

    nums = (10, 20, 5)
    print("Максимум из (10, 20, 5):", max_of_three(nums))  # 20

    cathetus1 = 3
    cathetus2 = 4
    print(f"Площадь треугольника с катетами {cathetus1} и {cathetus2}:",
          right_triangle_area(cathetus1, cathetus2))  # 6.0

from lesson_2_data import respondents

# Базовый список судов
courts = [
    {'court_name': 'Арбитражного суда города Москвы', 'court_code': 'А40',
     'court_address': '115225 Москва, ул. Б. Тульская, 17'},
    {'court_name': 'Арбитражного суда Московской области', 'court_code': 'А41',
     'court_address': '107053 Москва, пр. Академика Сахарова, 18'},
    {'court_name': 'Арбитражного суда Санкт-Петербурга и Ленинградской области',
     'court_code': 'А56', 'court_address': '191124 Санкт-Петербург, ул. Смольного, 6'},
    {'court_name': 'Арбитражного суда Краснодарского края',
     'court_code': 'А32', 'court_address': '350063, г. Краснодар, ул. Постовая, д. 32'},
    {'court_name': 'Арбитражного суда Вологодской области',
     'court_code': 'А13', 'court_address': '160000, г. Вологда, ул. Герцена, 1а'}
]

# Проверка отсутствующих судов
used_codes = {resp['case_number'].split('-')[0] for resp in respondents if 'case_number' in resp}
missing_codes = used_codes - {c['court_code'] for c in courts}

if missing_codes:
    print(f"Предупреждение: В базе отсутствуют суды с кодами: {', '.join(missing_codes)}")
    print("Добавьте их в список courts для полной обработки")


def generate_court_header(respondent_data, case_number):
    court_code = case_number.split('-')[0]
    court = next((c for c in courts if c['court_code'] == court_code), None)

    if not court:
        return f"Суд с кодом {court_code} не найден (дело: {case_number})"

    plaintiff_data = {
        'full_name': 'Иванов Иван Иванович',
        'inn': '123456789012',
        'ogrn': '1234567890123',
        'address': '123456, г. Москва, ул. Примерная, д. 1'
    }

    return f"""
В арбитражный суд {court['court_name']}
Адрес: {court['court_address']}

Истец: {plaintiff_data['full_name']}
ИНН {plaintiff_data['inn']} ОГРН {plaintiff_data['ogrn']}
Адрес: {plaintiff_data['address']}

Ответчик: {respondent_data['short_name']}
ИНН {respondent_data['inn']} ОГРН {respondent_data['ogrn']}
Адрес: {respondent_data['address']}

Номер дела {case_number}
"""


def generate_all_headers(respondents_list):
    for respondent in respondents_list:
        if 'case_number' in respondent:
            header = generate_court_header(respondent, respondent['case_number'])
            print(header)
            print("-" * 50)


generate_all_headers(respondents)

def get_and_validate_inn() -> bool:
    """
    Запрашивает ИНН у пользователя и проверяет его валидность.
    Возвращает True, если ИНН корректен, иначе False.
    """
    inn_str = input("Введите ИНН (10 или 12 цифр): ").strip()

    if not inn_str.isdigit():
        print("Ошибка: ИНН должен содержать только цифры.")
        return False

    inn = [int(c) for c in inn_str]
    length = len(inn)

    if length == 10:
        is_valid = _validate_inn_10(inn)
    elif length == 12:
        is_valid = _validate_inn_12(inn)
    else:
        print("Ошибка: ИНН должен быть длиной 10 или 12 цифр.")
        return False

    if is_valid:
        print("ИНН корректен.")
    else:
        print("Ошибка: Неверное контрольное число.")
    return is_valid


def _validate_inn_10(inn: list[int]) -> bool:
    """Проверка 10-значного ИНН."""
    coefficients = [2, 4, 10, 3, 5, 9, 4, 6, 8]
    control_sum = sum(coef * num for coef, num in zip(coefficients, inn[:9]))
    control_number = control_sum % 11
    if control_number > 9:
        control_number %= 10
    return control_number == inn[9]


def _validate_inn_12(inn: list[int]) -> bool:
    """Проверка 12-значного ИНН."""
    # Проверка первого контрольного числа (11-я цифра)
    coefficients_1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8]
    control_sum_1 = sum(coef * num for coef, num in zip(coefficients_1, inn[:10]))
    control_number_1 = control_sum_1 % 11
    if control_number_1 > 9:
        control_number_1 %= 10
    if control_number_1 != inn[10]:
        return False

    # Проверка второго контрольного числа (12-я цифра)
    coefficients_2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]
    control_sum_2 = sum(coef * num for coef, num in zip(coefficients_2, inn[:11]))
    control_number_2 = control_sum_2 % 11
    if control_number_2 > 9:
        control_number_2 %= 10
    return control_number_2 == inn[11]


# Пример использования
if __name__ == "__main__":
    is_valid = get_and_validate_inn()
    print("Результат проверки:", is_valid)
