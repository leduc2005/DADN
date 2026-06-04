import base64
import json
import os
import re
import requests
from dotenv import load_dotenv
from bs4 import BeautifulSoup, NavigableString
from pprint import pprint

load_dotenv()

text_data_dir = "./output/text.md"
table_data_dir = "./output/table.json"

def parse_data(file_path): 

    with open(file_path, "rb") as file:
        file_bytes = file.read()
        file_data = base64.b64encode(file_bytes).decode("ascii")

    headers = {
        "Authorization": f"token {os.getenv('TOKEN')}",
        "Content-Type": "application/json"
    }

    required_payload = {
        "file": file_data,
        "fileType": 0,  
    }

    optional_payload = {
        "markdownIgnoreLabels": [
            "header",
            "header_image",
            "footer",
            "footer_image",
            "number",
            "footnote",
            "aside_text"
        ],
        "useDocOrientationClassify": False,
        "useDocUnwarping": False,
        "useLayoutDetection": True,
        "useChartRecognition": False,
        "useSealRecognition": True,
        "useOcrForImageBlock": False,
        "mergeTables": True,
        "relevelTitles": True,
        "layoutShapeMode": "auto",
        "promptLabel": "ocr",
        "repetitionPenalty": 1,
        "temperature": 0,
        "topP": 1,
        "minPixels": 147384,
        "maxPixels": 2822400,
        "layoutNms": True,
        "restructurePages": True
    }

    payload = {**required_payload, **optional_payload}
    response = requests.post(os.getenv("API_URL"), json=payload, headers=headers)
    print(response.status_code)
    assert response.status_code == 200
    
    with open("./output/raw.json", "w") as raw_file:
        json.dump(response.json(), raw_file, indent=4, ensure_ascii=False)
        
    return  response.json()["result"]
    
def process_parsed_date(result): 
    text_data = []
    table_data  = []
    
    if isinstance(result, str):
        result = json.loads(result)
    if isinstance(result, dict) and "result" in result:
        result = result["result"]

    if isinstance(result, list):
        for item in result:
            if isinstance(item, dict) and "layoutParsingResults" in item:
                found = item
                break

        if found is not None:
            result = found
        else:
            result = {"layoutParsingResults": result}
        
    print("page count:", len(result["layoutParsingResults"]))
    
    for page in result["layoutParsingResults"]:
        page_text = page["markdown"]["text"] 
        soup = BeautifulSoup(page_text, "html.parser")

        stack = []
        
        for node in soup.contents: 

            if isinstance(node, NavigableString):   
                text = node.strip()
                if text:
                    text_data.append(text)
            
            elif node.name == "table":
                if stack and stack[-1].name == "table": 
                        js_data = transform_table_to_json(str(stack.pop()), "")
                        table_data.append(js_data)
                        continue
                
                title = ""
                
                while stack and stack[-1].name == "div":
                    title = stack.pop().get_text(" ", strip=True) + " " + title
                    
                js_data = transform_table_to_json(str(node), title)
                table_data.append(js_data)
                
            elif node.name == "div":
                if stack and stack[-1].name == "table":
                    js_data = transform_table_to_json(str(stack.pop()), node.get_text(" ", strip=True))
                    
                    if js_data:
                        table_data.append(js_data)
                        
                    continue
                
                stack.append(node)
                   
    with open(text_data_dir, "w") as text_file:
        text_file.write("\n".join(text_data))
        
    with open(table_data_dir, "w") as table_file:
        table_file.write('[' + ",\n".join(table_data) + ']')    
    
def transform_table_to_json(data, title=""): 
    soup = BeautifulSoup(data, "html.parser")
    table = soup.find("table")
    
    if not table:
        return
    
    rows = table.find_all("tr")
    matrix = []
    rowspan_map = {}
    
    for row in rows:
        row_data = []   
        cells = row.find_all(["td", "th"])
        col = 0 
        
        while col in rowspan_map: 
            row_data.append(rowspan_map[col]["value"])
            rowspan_map[col]["remain"] -= 1
            
            if rowspan_map[col]["remain"] == 0:
                del rowspan_map[col]
                
            col += 1         
            
        for cell in cells:
            text = cell.get_text(" ", strip=True)

            rowspan = int(cell.get("rowspan", 1))
            colspan = int(cell.get("colspan", 1))

            for _ in range(colspan):
                row_data.append(text)

                if rowspan > 1:
                    rowspan_map[col] = {
                        "value": text,
                        "remain": rowspan - 1
                    }

                col += 1
                
        matrix.append(row_data)
        
    return json.dumps({
        "name": title,
        "table": matrix
    }, indent=4, ensure_ascii=False)


if __name__ == "__main__":
    try:
        res = parse_data("./source/data1.pdf")
        process_parsed_date(res)
    except Exception as e:
        print(f"Error: {e}")