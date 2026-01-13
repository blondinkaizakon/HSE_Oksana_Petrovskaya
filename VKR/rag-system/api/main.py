"""
FastAPI приложение для RAG системы
"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import sys
from pathlib import Path

# Добавляем родительскую директорию в путь
sys.path.append(str(Path(__file__).parent.parent))

from rag_system import RAGSystem

app = FastAPI(title="RAG System API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Инициализация RAG системы
rag = RAGSystem()


class SearchRequest(BaseModel):
    query: str
    k: int = 5
    filter_dict: Optional[Dict] = None


class SearchResponse(BaseModel):
    results: List[Dict]
    query: str
    count: int


@app.get("/")
async def root():
    """Корневой endpoint"""
    return {
        "message": "RAG System API",
        "version": "1.0.0",
        "endpoints": {
            "info": "/info",
            "search": "/search",
            "search_with_scores": "/search/with-scores",
            "add_document": "/documents/upload",
            "add_all": "/documents/add-all",
            "context": "/context"
        }
    }


@app.get("/info")
async def get_info():
    """Получить информацию о системе"""
    return rag.get_info()


@app.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    """Поиск документов по запросу"""
    try:
        results = rag.search(
            query=request.query,
            k=request.k,
            filter_dict=request.filter_dict
        )
        return SearchResponse(
            results=results,
            query=request.query,
            count=len(results)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search/with-scores")
async def search_with_scores(request: SearchRequest):
    """Поиск с оценками релевантности"""
    try:
        results = rag.search_with_scores(
            query=request.query,
            k=request.k
        )
        return {
            "results": results,
            "query": request.query,
            "count": len(results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/context")
async def get_context(request: SearchRequest):
    """Получить контекст для запроса с источниками"""
    try:
        # Получаем результаты поиска с метаданными
        results = rag.search(query=request.query, k=request.k)
        
        # Формируем контекст с источниками
        context_parts = []
        sources = []
        for i, result in enumerate(results, 1):
            filename = result.get('filename', 'unknown')
            source = result.get('source', 'unknown')
            content = result.get('content', '')
            
            # Добавляем источник в список
            source_info = {
                "id": i,
                "filename": filename,
                "source": source
            }
            if source_info not in sources:
                sources.append(source_info)
            
            # Формируем контекст с указанием источника
            context_parts.append(
                f"[Источник {i}: {filename}]\n{content}\n"
            )
        
        context = "\n".join(context_parts)
        
        return {
            "context": context,
            "sources": sources,
            "query": request.query,
            "length": len(context)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """Загрузить документ в систему"""
    try:
        # Сохраняем файл во временную директорию
        from config import DOCUMENTS_DIR
        import os
        from pathlib import Path
        import re
        
        # Санитизация имени файла - удаляем path traversal и небезопасные символы
        safe_filename = os.path.basename(file.filename)  # Убираем путь, оставляем только имя файла
        # Удаляем небезопасные символы
        safe_filename = re.sub(r'[^\w\s\-_\.]', '', safe_filename)
        # Ограничиваем длину
        safe_filename = safe_filename[:255]
        
        if not safe_filename or safe_filename in ('.', '..'):
            raise HTTPException(status_code=400, detail="Недопустимое имя файла")
        
        file_path = DOCUMENTS_DIR / safe_filename
        
        # Дополнительная проверка - файл должен быть внутри DOCUMENTS_DIR
        try:
            file_path.resolve().relative_to(DOCUMENTS_DIR.resolve())
        except ValueError:
            raise HTTPException(status_code=400, detail="Путь файла выходит за пределы разрешенной директории")
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Добавляем в RAG систему
        result = rag.add_document(str(file_path))
        
        return {
            "success": result["success"],
            "message": result.get("message", "Документ успешно добавлен"),
            "filename": result.get("filename", safe_filename),
            "chunks_count": result.get("chunks_count", 0)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/documents/add-all")
async def add_all_documents():
    """Добавить все документы из директории"""
    try:
        result = rag.add_all_documents()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

