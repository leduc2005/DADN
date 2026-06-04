import re
import uuid
from pathlib import Path
from langchain_community.document_loaders import DirectoryLoader, UnstructuredMarkdownLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from pprint import pprint


def protect_latex(text: str) -> tuple[str, dict]:
    placeholders = {}

    def make_placeholder(match):
        key = f"__LTXPH_{uuid.uuid4().hex}__"
        placeholders[key] = match.group(0)
        return key

    text = re.sub(r'\\begin\{\w+\*?\}.+?\\end\{\w+\*?\}', make_placeholder, text, flags=re.DOTALL)
    text = re.sub(r'\$\$.+?\$\$', make_placeholder, text, flags=re.DOTALL)
    text = re.sub(r'\\\[.+?\\\]', make_placeholder, text, flags=re.DOTALL)
    text = re.sub(r'\\\(.+?\\\)', make_placeholder, text, flags=re.DOTALL)
    text = re.sub(r'(?<!\$)\$(?!\$).+?(?<!\$)\$(?!\$)', make_placeholder, text)

    return text, placeholders


def restore_latex(text: str, placeholders: dict) -> str:
    for key, formula in placeholders.items():
        text = text.replace(key, formula)
    return text


def chunk_data():
    # Use absolute path to avoid issues when script runs from different directories
    base_dir = Path(__file__).resolve().parent.parent
    preprocessing_output_path = base_dir / "preprocessing" / "output"
    
    loader = DirectoryLoader(
        path=str(preprocessing_output_path),
        glob="**/*.md",
        show_progress=True,
        loader_cls=UnstructuredMarkdownLoader,
        use_multithreading=True,
    )

    documents = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(
        separators=["\n## ", "\n### ", "\n#### ", "\n\n", "\n", " "],
        chunk_size=1000,
        chunk_overlap=100,
        keep_separator=True,
    )

    chunks = []
    for doc in documents:
        protected_text, placeholders = protect_latex(doc.page_content)
        split_docs = text_splitter.split_documents(
            [Document(page_content=protected_text, metadata=doc.metadata)]
        )
        for split_doc in split_docs:
            split_doc.page_content = restore_latex(split_doc.page_content, placeholders)
            chunks.append(split_doc)

    # with open("./output/docs.json", "w", encoding="utf-8") as f:
    #     for chunk in chunks:
    #         f.write(f"{chunk.page_content}\n\n---\n\n")

    return chunks

if __name__ == "__main__":
    chunk_data()