"""把「访问统计」和「PDF 转 Excel」合并成一个 FastAPI 进程。

原来：
    uvicorn db:app          --port 8000   # /visit
    uvicorn api_server:app  --port 4000   # /api/PDF2Excel

现在：
    uvicorn main:app --host 127.0.0.1 --port 8001

路径保持原样，前端和 nginx 都不用改：
    GET  /visit
    POST /api/PDF2Excel
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api_server import convert_pdf
from db import add_visit_record

app = FastAPI(title="file-transform-api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 直接复用两个文件里的处理函数，路径与各自原来的完全一致
app.add_api_route("/api/PDF2Excel", convert_pdf, methods=["POST"])
app.add_api_route("/visit", add_visit_record, methods=["GET"])
