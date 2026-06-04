from rag.chunking import chunk_data
from database.vector_store import get_vector_store


def ingest_documents():
    """
    Đọc tài liệu, chunk và lưu vào MongoDB Atlas Vector Search
    """

    print("Loading documents...")

    chunks = chunk_data()

    print(f"Total chunks: {len(chunks)}")

    vector_store = get_vector_store()

    print("Uploading chunks to MongoDB Atlas...")

    vector_store.add_documents(chunks)

    print("Done!")


if __name__ == "__main__":
    ingest_documents()