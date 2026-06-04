from database.vector_store import get_vector_store


def retrieve_documents(query: str, k: int = 5):
    """
    Truy xuất top-k chunk liên quan nhất
    """

    vector_store = get_vector_store()

    results = vector_store.similarity_search(
        query=query,
        k=k
    )

    return results