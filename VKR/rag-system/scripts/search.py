#!/usr/bin/env python3
"""
Скрипт для поиска в RAG системе
"""
import sys
from pathlib import Path

# Добавляем родительскую директорию в путь
sys.path.append(str(Path(__file__).parent.parent))

from rag_system import RAGSystem
import argparse


def main():
    parser = argparse.ArgumentParser(description="Поиск в RAG системе")
    parser.add_argument(
        "query",
        type=str,
        help="Поисковый запрос"
    )
    parser.add_argument(
        "-k",
        type=int,
        default=5,
        help="Количество результатов (по умолчанию: 5)"
    )
    parser.add_argument(
        "--with-scores",
        action="store_true",
        help="Показать оценки релевантности"
    )
    parser.add_argument(
        "--context",
        action="store_true",
        help="Показать объединенный контекст"
    )
    
    args = parser.parse_args()
    
    print("Инициализация RAG системы...")
    rag = RAGSystem()
    
    print(f"\nПоиск: '{args.query}'\n")
    print("=" * 80)
    
    if args.context:
        # Получаем контекст
        context = rag.get_context_for_query(args.query, k=args.k)
        print("\nКОНТЕКСТ:\n")
        print(context)
    elif args.with_scores:
        # Поиск с оценками
        results = rag.search_with_scores(args.query, k=args.k)
        
        for i, result in enumerate(results, 1):
            print(f"\n[Результат {i}] (Score: {result['score']:.4f})")
            print(f"Файл: {result['filename']}")
            print(f"Источник: {result['source']}")
            print(f"\nТекст:\n{result['content'][:500]}...")
            print("-" * 80)
    else:
        # Обычный поиск
        results = rag.search(args.query, k=args.k)
        
        for i, result in enumerate(results, 1):
            print(f"\n[Результат {i}]")
            print(f"Файл: {result['filename']}")
            print(f"Источник: {result['source']}")
            print(f"\nТекст:\n{result['content'][:500]}...")
            print("-" * 80)
    
    print(f"\nНайдено результатов: {len(results) if not args.context else 'N/A'}")


if __name__ == "__main__":
    main()

