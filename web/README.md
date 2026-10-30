##### Excel 转 PDF
pdfkit + xlsx

##### PDF 转 图片
pdfjs + canvas


##### PDF 转 Excel
todo

##### 视频压缩
服务端 ffmpeg（`spawn` 子进程）统一转为 H.264 / mp4，进度用 NDJSON 流式回传。

依赖：服务器需要安装 FFmpeg（含 ffprobe）

- Windows：`winget install Gyan.FFmpeg`
- macOS：`brew install ffmpeg`
- Ubuntu：`sudo apt install ffmpeg`

默认从 PATH 及常见安装目录查找，找不到时用环境变量 `FFMPEG_PATH` 指定绝对路径。

接口：

- `POST /file-api/slimVideo?name=xxx.mp4&quality=balanced&height=1080`，body 直接是视频二进制（不是 formData，避免大文件被读进内存）
- `GET /file-api/slimVideo` 列出保留期内仍在磁盘上的结果（页面刷新后靠它恢复列表）
- `GET /file-api/slimVideo/:id` 下载压缩结果，产物在系统临时目录保留 1 小时

参数：`quality` 取 `high`（CRF 20）/ `balanced`（CRF 26）/ `small`（CRF 30）；`height` 为短边上限（1080 = 1080p），`0` 表示保持原分辨率，小于上限的视频不会被放大。

限制与配置：

- 单文件上限 8GB（`MAX_BYTES`），并且流式写入时会二次校验，chunked 上传也绕不过去
- 临时目录同时要放输入和输出，按“输入 2 倍 + 512MB”检查可用空间；空间不足直接返回 507
- 输出目录默认在系统临时目录，可设 `SLIM_VIDEO_JOB_DIR` 指到大容量磁盘
- 转码超时按 `3 × 时长 + 10 分钟` 放宽，下限 30 分钟、上限 6 小时

