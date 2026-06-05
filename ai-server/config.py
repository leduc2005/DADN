import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(env_path)


# =========================
# MongoDB
# =========================

MONGO_URI = os.getenv("MONGO_URI")

RAG_DATABASE_NAME = os.getenv(
    "RAG_DATABASE_NAME",
    "mechanical_rag"
)

RAG_COLLECTION_NAME = os.getenv(
    "RAG_COLLECTION_NAME",
    "rag_chunks"
)

RAG_INDEX_NAME = os.getenv(
    "RAG_INDEX_NAME",
    "vector_index"
)


# =========================
# Gemini
# =========================

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

EMBEDDING_MODEL = os.getenv(
    "EMBEDDING_MODEL",
    "models/gemini-embedding-001"
)


# =========================
# Chunking
# =========================

CHUNK_SIZE = int(
    os.getenv("CHUNK_SIZE", 1000)
)

CHUNK_OVERLAP = int(
    os.getenv("CHUNK_OVERLAP", 150)
)



LLM_MODEL = os.getenv(
    "LLM_MODEL",
    "gemini-2.5-flash"
)



LLM_TEMPERATURE = float(
    os.getenv("LLM_TEMPERATURE", 0)
)




