import logging
import os
from datetime import datetime

import pymysql
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger("uvicorn.error")

# 读取当前环境（默认 dev）
env = os.getenv("ENV", "dev")

# 加载对应 .env 文件（相对当前工作目录，pm2 里必须设置 cwd）
load_dotenv(f".env.{env}")

# 连接信息全部可配置，默认值保持和以前一致（以前是写死的 dd / file_transform）
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "port": int(os.getenv("DB_PORT") or 3306),
    "user": os.getenv("DB_USER", "dd"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME", "file_transform"),
    "charset": "utf8mb4",
    "connect_timeout": 5,
}

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
    return pymysql.connect(**DB_CONFIG)


@app.get("/visit")
def add_visit_record():
    # 访问统计属于“锦上添花”，数据库出问题时不要让整页报 500
    try:
        conn = get_connection()
    except Exception as exc:  # noqa: BLE001
        logger.warning("访问记录写入失败（连不上数据库）: %s", exc)
        return {"msg": "skip"}

    try:
        with conn.cursor() as cursor:
            cursor.execute("INSERT INTO visit_records (visit_time) VALUES (%s)", (datetime.now(),))
        conn.commit()
        return {"msg": "插入成功"}
    except Exception as exc:  # noqa: BLE001
        logger.warning("访问记录写入失败（SQL 出错）: %s", exc)
        return {"msg": "skip"}
    finally:
        conn.close()
