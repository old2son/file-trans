import io
import logging

import pandas as pd
import pdfplumber
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

logger = logging.getLogger("uvicorn.error")

app = FastAPI()

# 1. 跨域配置修改：增加 POST 方法，因为文件上传必须用 POST
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 调试阶段建议先用 *，或者保留你的 http://192.168.0.35:3000
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 依次尝试的表格识别策略：
#   1) 默认：识别矢量线条，适合有框线的表格
#   2) 纯文字对齐：适合 Word/Excel 导出、网页打印这种没有框线只有列对齐的表格
#   3) 有竖线无横线：适合只有列分隔线的报表
TABLE_SETTINGS = [
    None,
    {
        "vertical_strategy": "text",
        "horizontal_strategy": "text",
        "intersection_tolerance": 5,
        "snap_tolerance": 3,
    },
    {
        "vertical_strategy": "lines",
        "horizontal_strategy": "text",
        "intersection_tolerance": 5,
    },
]


def clean_table(table):
    """去掉空行、把 None 转成空串、补齐每行长度"""
    rows = []
    for row in table:
        cells = [("" if cell is None else str(cell)).strip() for cell in row]
        if any(cells):
            rows.append(cells)

    if not rows:
        return []

    width = max(len(row) for row in rows)
    return [row + [""] * (width - len(row)) for row in rows]


def extract_page_tables(page):
    """按策略逐个尝试，返回第一个能识别出表格的结果"""
    for settings in TABLE_SETTINGS:
        try:
            tables = page.extract_tables(table_settings=settings) if settings else page.extract_tables()
        except Exception as exc:  # noqa: BLE001
            logger.warning("表格识别策略失败: %s", exc)
            continue

        cleaned = [clean_table(table) for table in tables or []]
        # 至少 2 行 2 列，避免把普通段落误判成表格
        cleaned = [table for table in cleaned if len(table) >= 2 and len(table[0]) >= 2]
        if cleaned:
            return cleaned

    return []


@app.post("/api/PDF2Excel")
async def convert_pdf(file: UploadFile = File(...)):
    # 检查是否是 PDF
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="请上传 PDF 文件")

    try:
        # 2. 读取上传的文件流到内存，不产生本地磁盘垃圾文件
        pdf_content = await file.read()
        pdf_stream = io.BytesIO(pdf_content)

        all_tables = []
        text_length = 0
        page_count = 0
        strategy_hits = 0

        # 3. 执行 PDF 提取逻辑
        with pdfplumber.open(pdf_stream) as pdf:
            page_count = len(pdf.pages)

            for index, page in enumerate(pdf.pages):
                try:
                    text_length += len((page.extract_text() or "").strip())
                    page_tables = extract_page_tables(page)
                except Exception as exc:  # noqa: BLE001
                    logger.warning("第 %s 页解析失败: %s", index + 1, exc)
                    continue

                for table in page_tables:
                    strategy_hits += 1

                    # 第一行当表头；如果表头里有空单元格，就把整表当无表头数据
                    header = table[0]
                    body = table[1:]
                    if not body:
                        continue

                    if all(header):
                        df = pd.DataFrame(body, columns=header)
                    else:
                        df = pd.DataFrame(table)

                    all_tables.append(df)

        if not all_tables:
            # 区分“扫描件没有文字层”和“有文字但没识别到表格”
            if text_length == 0:
                return {
                    "status": "error",
                    "message": "PDF 没有文字层（可能是扫描件或图片），需要先做 OCR 再转换",
                }
            return {
                "status": "error",
                "message": "PDF 中没有检测到表格（已尝试线条与文字对齐两种识别方式）",
            }

        # 4. 将合并后的结果保存到内存中的 Excel 对象
        result = pd.concat(all_tables, ignore_index=True)

        # 使用 BytesIO 创建一个内存中的文件对象
        excel_io = io.BytesIO()
        with pd.ExcelWriter(excel_io, engine='openpyxl') as writer:
            result.to_excel(writer, index=False)

        excel_io.seek(0)  # 指针回到开头以便读取

        # 5. 直接返回文件流给前端下载
        return StreamingResponse(
            excel_io,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": "attachment; filename=converted.xlsx",
                "X-Pages": str(page_count),
                "X-Tables": str(strategy_hits),
            }
        )

    except Exception as e:
        logger.exception("PDF 转换失败")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="localhost", port=4000)
