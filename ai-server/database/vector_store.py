from pymongo import MongoClient

from langchain_mongodb import MongoDBAtlasVectorSearch

from config import (
    MONGO_URI,
    RAG_DATABASE_NAME,
    RAG_COLLECTION_NAME,
    RAG_INDEX_NAME
)

from rag.embedding import get_embedding_model


def get_mongo_collection():
    """
    Kết nối MongoDB collection chứa vector
    """

    client = MongoClient(MONGO_URI)

    db = client[RAG_DATABASE_NAME]

    collection = db[RAG_COLLECTION_NAME]

    return collection


def get_vector_store():
    """
    Khởi tạo MongoDB Atlas Vector Search
    """

    collection = get_mongo_collection()

    embedding_model = get_embedding_model()

    vector_store = MongoDBAtlasVectorSearch(
        collection=collection,
        embedding=embedding_model,
        index_name=RAG_INDEX_NAME,
    )

    return vector_store