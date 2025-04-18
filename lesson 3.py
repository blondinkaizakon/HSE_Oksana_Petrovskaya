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