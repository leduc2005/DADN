import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import torch
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI
from sentence_transformers import CrossEncoder

from database.vector_store import get_vector_store
from config import LLM_MODEL, LLM_TEMPERATURE, GOOGLE_API_KEY


TEMPLATE = """
You are a mechanical-engineering assistant for a Vietnamese university course on machine design (Thiết Kế Máy).
You have access to two source documents:
- **Textbook** (data1.md): "Thiết Kế Máy" — covers theory, criteria, formulas, and design methods.
- **Project spec** (data2.md): a specific drive-system design assignment with fixed numerical parameters.
 
# Answering strategy  (Document First + LLM Knowledge-Enhanced)
 
## Tier 1 — Context is sufficient
If the retrieved context fully answers the question:
- Base your answer entirely on the context.
- Quote relevant passages or formulas verbatim where helpful.
- Do NOT add unsolicited external knowledge.
 
## Tier 2 — Context is partially relevant
If the retrieved context is related but incomplete (e.g., the formula is present but the step-by-step procedure is not):
- Use the context as the primary anchor and present what the documents say.
- Seamlessly supplement the gap with your general mechanical-engineering knowledge to give a complete answer.
 
## Tier 3 — Context is unrelated or empty
If the retrieved context has no connection to the question:
- Answer from your general mechanical-engineering knowledge without referring to the documents.
 
# Hard constraint — Project spec values (data2.md)
When the question involves numerical design parameters (power, speed, service life, load type, etc.),
ALWAYS use the values from data2.md as ground truth. Never substitute your own assumed values.
If the user asks for a value that is in data2.md, state it explicitly before proceeding.
 
# Conflict resolution
If the context contains conflicting information between chunks, point out the conflict,
cite the relevant passages, and then resolve it using sound engineering judgement.
 
# Formula handling
- Quote formulas verbatim from the context whenever possible.
- Use $...$ for inline math and $$...$$ for block math.
- If a formula appears broken or incomplete in the context, reproduce it as-is, note that it appears
  incomplete, and provide the correct standard form from general knowledge if known.
 
# Response style
- Answer directly. NEVER open with or include phrases that reference the source material, such as:
  "Dựa vào tài liệu...", "Theo tài liệu...", "Based on the provided documents...",
  "According to the context...", "The documents state...", or any similar meta-commentary.
- Write as if you simply know the answer.

# Language
Answer in the same language as the question (Vietnamese questions → Vietnamese answers).
 
# Context
{context}
"""


def _format_docs(docs: list) -> str:
    parts = []
    for i, doc in enumerate(docs, 1):
        src = doc.metadata.get("source", "")
        parts.append(f"[Chunk {i}] (source: {src})\n{doc.page_content}")
    return "\n\n---\n\n".join(parts)

_reranker_singleton = None

def _get_reranker_model():
    global _reranker_singleton
    device = "cuda" if torch.cuda.is_available() else "cpu"
    if _reranker_singleton is None:
        _reranker_singleton = CrossEncoder("BAAI/bge-reranker-v2-m3", device=device)
    return _reranker_singleton


def _retrieve_and_rerank(question: str, base_retriever, top_n: int = 5) -> list:
    docs = base_retriever.invoke(question)
    print(f"[DEBUG]")   
    with open("debug_docs.txt", "w") as f:
        for i, d in enumerate(docs): f.write(f"  [{i}] {d.page_content}\n")  
    if len(docs) <= top_n:
        return docs
    model = _get_reranker_model()
    scores = model.predict([(question, doc.page_content) for doc in docs])
    ranked = sorted(zip(scores, docs), key=lambda x: x[0], reverse=True)
    return [doc for _, doc in ranked[:top_n]]


def get_rag_chain():
    vector_store = get_vector_store()
    base_retriever = vector_store.as_retriever(search_kwargs={"k": 20})

    retriever = RunnableLambda(
        lambda q: _retrieve_and_rerank(q, base_retriever, top_n=5)
    )

    llm = ChatGoogleGenerativeAI(
        model=LLM_MODEL,
        google_api_key=GOOGLE_API_KEY,
        temperature=LLM_TEMPERATURE
    )
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", TEMPLATE),
        ("human", "{question}"),
    ])
 
    chain = (
        {
            "context": retriever | _format_docs,
            "question": RunnablePassthrough(),
        }
        | prompt
        | llm
        | StrOutputParser()
    )
 
    return chain


def chat(question: str): 
    chain = get_rag_chain()
    return chain.invoke(question)


async def chat_stream(question: str):
    chain = get_rag_chain()
    async for chunk in chain.astream(question):
        yield chunk

if __name__ == "__main__":
    with open("output.txt", "w") as f:
        f.write(chat("cách xác định ứng suất cho phép"))
    
    
