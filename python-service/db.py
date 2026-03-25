import os
from datetime import datetime

import pymysql
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 默认读取 env
# load_dotenv()

# 读取当前环境（默认 dev）
env = os.getenv("ENV", "dev")

# 加载对应 .env 文件
load_dotenv(f".env.{env}")

password = os.getenv("DB_PASSWORD")

app = FastAPI()

# 允许跨域（开发环境直接放开）
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://192.168.0.35:3000"],
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_connection():
    return pymysql.connect(
        host="localhost",
        user="dd",
        password=password,
        database="file_transform",
        charset="utf8mb4"
    )


@app.get("/visit")
def add_visit_record():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            sql = "INSERT INTO visit_records (visit_time) VALUES (%s)"
            cursor.execute(sql, (datetime.now(),))
        conn.commit()
    finally:
        conn.close()

    return {"msg": "插入成功"}
