import io

import pandas as pd
import pdfplumber
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

app = FastAPI()

# 1. 跨域配置修改：增加 POST 方法，因为文件上传必须用 POST
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 调试阶段建议先用 *，或者保留你的 http://192.168.0.35:3000
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["*"],
)


@app.post("/api/PDF2Excel")
async def convert_pdf(file: UploadFile = File(...)):
    # 检查是否是 PDF
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="请上传 PDF 文件")

    try:
        # 2. 读取上传的文件流到内存，不产生本地磁盘垃圾文件
        pdf_content = await file.read()
        pdf_stream = io.BytesIO(pdf_content)

        all_tables = []

        # 3. 执行 PDF 提取逻辑
        with pdfplumber.open(pdf_stream) as pdf:
            for page in pdf.pages:
                table = page.extract_table()
                if table:
                    # 将提取的数据转为 DataFrame
                    df = pd.DataFrame(table[1:], columns=table[0])
                    all_tables.append(df)

        if not all_tables:
            return {"status": "error", "message": "PDF 中没有检测到表格"}

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
            headers={"Content-Disposition": f"attachment; filename=converted.xlsx"}
        )

    except Exception as e:
        print(f"服务器内部错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="192.168.0.35", port=4000)
