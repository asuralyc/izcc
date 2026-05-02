# IZCC 活動報名系統

Vue + NestJS + PostgreSQL 的 IZCC 活動報名站台。

## 功能

- 首頁顯示已發佈且未封存的可報名活動
- 一般使用者以 email 註冊，登入採 JWT
- Admin 帳號由環境變數建立，可新增、修改、發佈、下架、封存與解封存活動
- 活動有人報名後不能刪除，只能封存
- 活動封面圖由後端寫入 `/var/www/uploads`，前端與 Nginx 以 `/uploads` 讀取
- Admin 可查看每個活動的報名名單
- 前端內建「部署我自己」頁面，提供部署步驟與可複製指令

## 本機開發

```bash
cp .env.example .env
docker compose up -d
npm install
npm run dev
```

前端預設在 `http://localhost:5173`，後端 API 預設在 `http://localhost:3000/api`。

## 環境變數

請參考 [.env.example](/Users/sapp/Documents/GitProject/Sapp/IZCC/.env.example)。正式部署至少要修改：

- `JWT_SECRET`
- `DB_PASSWORD`
- `ADMIN_PASSWORD`
- `FRONTEND_ORIGIN`

## 部署提醒

這台 Linux 主機只有 IP、沒有網域與 SSL 憑證，因此 Nginx 不要開 HSTS，也不要強制導向 HTTPS。正式部署採前後端分離：

- 前端靜態檔：`/var/www/izcc`
- 後端專案與 NestJS build：`/opt/izcc`
- 上傳圖片：`/var/www/uploads`

部署範本在 [infra/nginx/izcc.conf](/Users/sapp/Documents/GitProject/Sapp/IZCC/infra/nginx/izcc.conf) 與 [infra/systemd/izcc-api.service](/Users/sapp/Documents/GitProject/Sapp/IZCC/infra/systemd/izcc-api.service)。
