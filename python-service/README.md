# python-service

PDF 转 Excel 的后端（FastAPI + pdfplumber + pandas），另含访问统计接口。

## 数据库配置

`db.py` 的连接信息全部从环境变量读，不设就用默认值（默认值和以前硬编码的 `dd` / `file_transform` 一致）：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `DB_HOST` | `127.0.0.1` | |
| `DB_PORT` | `3306` | |
| `DB_USER` | `dd` | |
| `DB_PASSWORD` | 无 | 必填，放在 `.env.{ENV}` 里 |
| `DB_NAME` | `file_transform` | |

`ENV` 决定加载哪个 `.env` 文件（默认 `dev` → `.env.dev`）。换数据库时优先改环境变量，不要改代码。

## 一个进程跑全部接口

`main.py` 把两个模块的路由合并到同一个 FastAPI app，路径与原来一致：

- `GET /visit`（来自 `db.py`，写 MySQL）
- `POST /api/PDF2Excel`（来自 `api_server.py`）

```bash
cd /home/python-service
source .venv/bin/activate
pip install -r requirements.txt

# 8001 正好对上 nginx 的 location /pyApi/ → 127.0.0.1:8001
pm2 start "uvicorn main:app --host 127.0.0.1 --port 8001" --name file-api
pm2 save
```

如果 8001 上有旧进程，先 `pm2 delete <名字>` 再启动。

自测：

```bash
curl -i http://127.0.0.1:8001/visit
curl -i -X POST http://127.0.0.1:8001/api/PDF2Excel   # 期望 422（缺 file 字段）
```

## 和 Web 的对接

Next 端的 `/file-api/pdf2excel` 会代理到 `http://127.0.0.1:4000`，如果服务跑在 8001，给 Next 进程加环境变量：

```bash
PDF2EXCEL_API=http://127.0.0.1:8001
```

（`web/.env.production` 里已经写了这一行，用 pm2 部署时确认它被加载，或在 pm2 的 env 里设置。）

## 单独跑（不合并时）

```bash
pm2 start "uvicorn db:app --host 127.0.0.1 --port 8001" --name visit
pm2 start "uvicorn api_server:app --host 127.0.0.1 --port 4000" --name pdf2excel
```
