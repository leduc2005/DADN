"""
Faithfulness Evaluation for the Mechanical RAG pipeline.
Implements RAGAS-style faithfulness scoring using Gemini as the judge LLM.
No ragas/datasets dependency required.

Algorithm per sample:
  1. Retrieve + rerank top-5 context chunks.
  2. Generate an answer with the existing RAG prompt.
  3. Decompose the answer into atomic statements (Gemini judge).
  4. Verify each statement against the retrieved context (Gemini judge).
  5. faithfulness = supported_statements / total_statements  (0 → 1)

Usage (run from ai-server/):
    python rag/evaluate_faithfulness.py
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import json
import csv
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI

from rag.chatbot import TEMPLATE, _retrieve_and_rerank
from database.vector_store import get_vector_store
from config import GOOGLE_API_KEY, LLM_MODEL, LLM_TEMPERATURE


# ─────────────────────────────────────────────────────────────────
# Evaluation questions: 5 from data2 (project spec) + 5 from data1 (theory)
# ─────────────────────────────────────────────────────────────────
EVAL_QUESTIONS = [
    # data2 – fixed numerical project parameters
    "Hệ thống dẫn động thùng trộn gồm những bộ phận nào?",
    "Chế độ tải của hệ thống là gì và tải va đập ra sao?",
    # data1 – machine design theory
    # "Công thức tính tỉ số truyền toàn bộ ut của hệ thống là gì?",
    # "Hộp giảm tốc có chức năng gì trong hệ thống truyền dẫn cơ khí?",
    # "Bộ truyền đai thang hoạt động theo nguyên lý nào?",
    # "Độ bền mỏi của chi tiết máy được xác định như thế nào?",
    # "Tiêu chuẩn lựa chọn vật liệu trong thiết kế máy là gì?",
]


# ─────────────────────────────────────────────────────────────────
# Judge prompts
# ─────────────────────────────────────────────────────────────────
DECOMPOSE_PROMPT = """\
You are an evaluation assistant. Given the following answer text, extract every individual
atomic factual statement. Return ONLY a valid JSON array of strings with no markdown and
no explanation. Example: ["Statement 1.", "Statement 2."]

Answer:
{answer}
"""

VERIFY_PROMPT = """\
You are an evaluation assistant. Decide whether the statement below is fully supported
by the provided context. Reply with exactly one word: "yes" or "no".

Context:
{context}

Statement: {statement}
"""


# ─────────────────────────────────────────────────────────────────
# Core helpers
# ─────────────────────────────────────────────────────────────────
def build_eval_sample(question: str, base_retriever, llm) -> tuple[str, str]:
    """Retrieve + rerank, generate answer; return (answer, joined_context_string)."""
    docs = _retrieve_and_rerank(question, base_retriever, top_n=5)
    ctx_str = "\n\n---\n\n".join(
        f"[Chunk {i+1}] (source: {doc.metadata.get('source', '')})\n{doc.page_content}"
        for i, doc in enumerate(docs)
    )
    prompt = ChatPromptTemplate.from_messages([
        ("system", TEMPLATE),
        ("human", "{question}"),
    ])
    chain = prompt | llm | StrOutputParser()
    answer = chain.invoke({"context": ctx_str, "question": question})
    return answer, ctx_str


def decompose_statements(answer: str, judge_llm) -> list[str]:
    prompt = ChatPromptTemplate.from_messages([("human", DECOMPOSE_PROMPT)])
    raw = (prompt | judge_llm | StrOutputParser()).invoke({"answer": answer}).strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        raw = raw[4:] if raw.startswith("json") else raw
    try:
        return json.loads(raw.strip())
    except json.JSONDecodeError:
        lines = [l.strip().lstrip("-•").strip() for l in raw.splitlines() if l.strip()]
        return [l for l in lines if l]


def verify_statement(statement: str, context: str, judge_llm) -> bool:
    prompt = ChatPromptTemplate.from_messages([("human", VERIFY_PROMPT)])
    verdict = (prompt | judge_llm | StrOutputParser()).invoke(
        {"context": context, "statement": statement}
    )
    return verdict.strip().lower().startswith("yes")


def compute_faithfulness(answer: str, context: str, judge_llm) -> tuple[float, int, int]:
    statements = decompose_statements(answer, judge_llm)
    if not statements:
        return 0.0, 0, 0
    supported = sum(verify_statement(s, context, judge_llm) for s in statements)
    return supported / len(statements), supported, len(statements)


def main():
    llm = ChatGoogleGenerativeAI(
        model=LLM_MODEL,
        google_api_key=GOOGLE_API_KEY,
        temperature=LLM_TEMPERATURE,
    )
    judge_llm = ChatGoogleGenerativeAI(
        model=LLM_MODEL,
        google_api_key=GOOGLE_API_KEY,
        temperature=0,  
    )

    vector_store = get_vector_store()
    base_retriever = vector_store.as_retriever(search_kwargs={"k": 20})

    rows = []
    total_score = 0.0

    print(f"Running faithfulness evaluation on {len(EVAL_QUESTIONS)} questions...\n")
    for i, q in enumerate(EVAL_QUESTIONS, 1):
        print(f"[{i}/{len(EVAL_QUESTIONS)}] {q}")
        answer, ctx_str = build_eval_sample(q, base_retriever, llm)
        score, supported, total = compute_faithfulness(answer, ctx_str, judge_llm)
        total_score += score
        rows.append({
            "question": q,
            "faithfulness": round(score, 4),
            "supported_statements": supported,
            "total_statements": total,
            "answer_preview": answer[:300],
        })
        print(f"  → faithfulness={score:.4f}  ({supported}/{total} statements supported)\n")

    avg = total_score / len(EVAL_QUESTIONS)
    print(f"===== Average Faithfulness: {avg:.4f} =====\n")

    out_path = Path(__file__).parent / "ragas_faithfulness_result.csv"
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    print(f"Per-sample results saved → {out_path}")


if __name__ == "__main__":
    main()
