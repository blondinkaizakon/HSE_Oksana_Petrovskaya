import json
import csv

path_inn = r"C:\Users\OX\Desktop\LP\traders.txt"
path_json = r"C:\Users\OX\Desktop\LP\traders.json"
path_csv = r"C:\Users\OX\Desktop\LP\traders.csv"

with open(path_inn, 'r', encoding='utf-8') as file:
    inn_list = [line.strip() for line in file if line.strip()]

with open(path_json, 'r', encoding='utf-8') as file:
    data = json.load(file)

filtered_data = []
for org in data:
    if org.get("ИНН") in inn_list:
        filtered_data.append({
            "ИНН": org.get("inn", ""),
            "ОГРН": org.get("ogrn", ""),
            "Адрес": org.get("Адрес", "")
        })

with open(path_csv, 'w', newline='', encoding='utf-8') as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=["ИНН", "ОГРН", "Адрес"])
    writer.writeheader()
    writer.writerows(filtered_data)

print(f"✅ Найдено и записано {len(filtered_data)} организаций в {path_csv}")

import re

text = "Напишите на info@legalflow.ru или support@company.com для связи."

emails = re.findall(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)
print(emails)

import json
import re
from collections import defaultdict

from pathlib import Path

# Универсальная папка Desktop
desktop_dir = Path.home() / 'Desktop'

# Путь к входному файлу
input_path = desktop_dir / 'LP' / '100000_efrsb_messages.json'

# Путь к файлу с результатами
output_path = desktop_dir / 'emails.json'

# Пример использования:
with input_path.open('r', encoding='utf-8') as infile:
    data = infile.read()
    # ... обработка данных ...

with output_path.open('w', encoding='utf-8') as outfile:
    outfile.write('ваши результаты')

# Регулярное выражение для email-адресов
email_pattern = re.compile(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+')

# Результирующий словарь: ИНН -> множество email-адресов
emails_by_inn = defaultdict(set)

# Загрузка JSON
with open(input_path, "r", encoding="utf-8") as file:
    data = json.load(file)

# Обработка каждой записи
for record in data:
    inn = str(record.get("publisher_inn", "")).strip()
    text = record.get("msg_text", "")
    if inn and text:
        found_emails = email_pattern.findall(text)
        if found_emails:
            emails_by_inn[inn].update(found_emails)

# Преобразуем set в list для сериализации
result = {inn: list(emails) for inn, emails in emails_by_inn.items()}

# Сохраняем результат в JSON
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"✅ Найдено {len(result)} ИНН с email-адресами. Результат сохранён в {output_path}")

import re
import json
import json
import re

# 🔹 Укажите путь к вашему ICS-файлу
input_path = r"C:\Users\OX\Desktop\LP\RAD_09_04_2024.ics"
output_path = r"C:\Users\OX\Desktop\LP\court_dates1.json"

case_number = "А40-183194/2015"
events = []
event = {}
inside_event = False

with open(input_path, "r", encoding="utf-8") as file:
    for line in file:
        line = line.strip()

        if line == "BEGIN:VEVENT":
            inside_event = True
            event = {}
        elif line == "END:VEVENT":
            inside_event = False
            # Пропускаем события без даты или места
            if event.get("DTSTART", "").startswith("00010101") or "LOCATION" not in event:
                continue

            def parse_dt(value):
                if value.startswith("TZID=UTC+3:"):
                    value = value.replace("TZID=UTC+3:", "")
                if "T" in value:
                    return f"{value[:4]}-{value[4:6]}-{value[6:8]}T{value[9:11]}:{value[11:13]}:00+03:00"
                return ""

            events.append({
                "case_number": case_number,
                "start": parse_dt(event.get("DTSTART", "")),
                "end": parse_dt(event.get("DTEND", "")),
                "location": event.get("LOCATION", "").replace("\\,", ",").replace("\\n", " ").strip(),
                "description": event.get("DESCRIPTION", "").replace("\\n", "\n").replace("\\,", ",").strip()
            })
        elif inside_event and ":" in line:
            key, value = line.split(":", 1)
            key = key.split(";")[0].strip().upper()
            event[key] = value.strip()

# 🔹 Сохраняем в JSON
with open(output_path, "w", encoding="utf-8") as out_file:
    json.dump(events, out_file, ensure_ascii=False, indent=2)

print(f"✅ Найдено {len(events)} заседаний. Данные сохранены в {output_path}")
