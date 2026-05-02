<script setup lang="ts">
import { reactive } from 'vue';
import CodeBlock from '../components/CodeBlock.vue';

type DeployFieldKey =
  | 'repositoryUrl'
  | 'serverIp'
  | 'dbPassword'
  | 'jwtSecret'
  | 'adminPassword';

const params = reactive<Record<DeployFieldKey, string>>({
  repositoryUrl: 'https://github.com/asuralyc/izcc.git',
  serverIp: '',
  dbPassword: '',
  jwtSecret: '',
  adminPassword: ''
});

const fieldLabels: Record<DeployFieldKey, string> = {
  repositoryUrl: 'Git Repository URL',
  serverIp: '主機 IP',
  dbPassword: 'PostgreSQL 密碼',
  jwtSecret: 'JWT Secret',
  adminPassword: '網站管理員密碼'
};

const deployFields: Array<{
  key: DeployFieldKey;
  label: string;
  placeholder: string;
  description: string;
  secret?: boolean;
}> = [
  {
    key: 'repositoryUrl',
    label: fieldLabels.repositoryUrl,
    placeholder: 'https://github.com/asuralyc/izcc.git',
    description: '正式主機要 clone 的 Git repository。'
  },
  {
    key: 'serverIp',
    label: fieldLabels.serverIp,
    placeholder: '203.0.113.10',
    description: '這台主機沒有網域時，前端 origin 與 Nginx server_name 都使用這個 IP。'
  },
  {
    key: 'dbPassword',
    label: fieldLabels.dbPassword,
    placeholder: '貼上產生的密碼',
    description: 'PostgreSQL role izcc 的密碼，會寫入資料庫與後端 .env；不需要太長。',
    secret: true
  },
  {
    key: 'jwtSecret',
    label: fieldLabels.jwtSecret,
    placeholder: '貼上 32 bytes 以上的 random secret',
    description: '用來簽發 JWT，請使用長且隨機的字串。',
    secret: true
  },
  {
    key: 'adminPassword',
    label: fieldLabels.adminPassword,
    placeholder: '貼上網站管理員密碼',
    description: '這是網站管理員 admin 的登入密碼；管理員登入後可以新增、修改、發佈、下架、封存活動並查看報名名單。',
    secret: true
  }
];

const deployNavItems = [
  { id: 'inputs', label: '參數' },
  { id: 'nginx-install', label: '1. Nginx' },
  { id: 'node-install', label: '2. NodeJS' },
  { id: 'postgres-install', label: '3. PostgreSQL' },
  { id: 'project', label: '4. 專案目錄' },
  { id: 'database', label: '5. 資料庫' },
  { id: 'env', label: '6. 環境變數' },
  { id: 'build', label: '7. 建置' },
  { id: 'systemd', label: '8. API 服務' },
  { id: 'nginx', label: '9. Nginx 設定' },
  { id: 'verify', label: '10. 驗證' },
  { id: 'update', label: '更新' }
];

const nginxInstall = `
sudo apt update
sudo apt install -y nginx
sudo systemctl enable --now nginx
sudo systemctl status nginx
`;

const nodeInstall = `
sudo apt install -y curl ca-certificates git rsync
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
`;

const postgresInstall = `
# Ubuntu 預設 apt 來源沒有 PostgreSQL 18，先加入 PostgreSQL 官方 Repository
sudo apt install -y postgresql-common
sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh

sudo apt update
sudo apt install -y postgresql-18
sudo systemctl enable --now postgresql
sudo systemctl status postgresql
`;

const passwordGenerator = `
# PostgreSQL 密碼或網站管理員密碼
openssl rand -base64 12

# JWT Secret
openssl rand -hex 32
`;

const prepareProject = `
sudo mkdir -p /opt/izcc /var/www/izcc /var/www/uploads
sudo git clone __REPOSITORY_URL__ /opt/izcc
sudo chown -R www-data:www-data /var/www/uploads
sudo chmod 775 /var/www/uploads
`;

const databaseSetup = `
sudo -u postgres psql <<'SQL'
CREATE USER izcc WITH PASSWORD '__DB_PASSWORD__';
CREATE DATABASE izcc OWNER izcc;
GRANT ALL PRIVILEGES ON DATABASE izcc TO izcc;
SQL
`;

const envFile = `
cd /opt/izcc
sudo tee .env > /dev/null <<'EOF'
NODE_ENV=production
PORT=3000
FRONTEND_ORIGIN=http://__SERVER_IP__
JWT_SECRET=__JWT_SECRET__
JWT_EXPIRES_IN=7d

DB_HOST=localhost
DB_PORT=5432
DB_USER=izcc
DB_PASSWORD=__DB_PASSWORD__
DB_NAME=izcc
DB_SYNC=true

ADMIN_ACCOUNT=admin
ADMIN_PASSWORD=__ADMIN_PASSWORD__

UPLOAD_DIR=/var/www/uploads
PUBLIC_UPLOAD_BASE_URL=/uploads
EOF

sudo chown www-data:www-data /opt/izcc/.env
sudo chmod 640 /opt/izcc/.env
`;

const buildApp = `
cd /opt/izcc
sudo npm install
sudo npm run build
sudo rsync -a --delete apps/frontend/dist/ /var/www/izcc/
`;

const systemdService = `
sudo tee /etc/systemd/system/izcc-api.service > /dev/null <<'EOF'
[Unit]
Description=IZCC NestJS API
After=network.target postgresql.service

[Service]
Type=simple
WorkingDirectory=/opt/izcc
EnvironmentFile=/opt/izcc/.env
ExecStart=/usr/bin/node /opt/izcc/apps/backend/dist/main.js
Restart=always
RestartSec=5
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now izcc-api
sudo systemctl status izcc-api
`;

const nginxConfig = `
sudo tee /etc/nginx/sites-available/izcc > /dev/null <<'EOF'
server {
    listen 80;
    server_name __SERVER_IP__;

    root /var/www/izcc;
    index index.html;

    location /uploads/ {
        alias /var/www/uploads/;
        try_files $uri =404;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

sudo ln -sfn /etc/nginx/sites-available/izcc /etc/nginx/sites-enabled/izcc
sudo nginx -t
sudo systemctl reload nginx
`;

const verifyCommands = `
curl -I http://__SERVER_IP__
curl http://__SERVER_IP__/api/events
`;

const updateCommands = `
cd /opt/izcc
sudo git pull
sudo npm install
sudo npm run build
sudo rsync -a --delete apps/frontend/dist/ /var/www/izcc/
sudo systemctl restart izcc-api
sudo systemctl reload nginx
`;

function required(keys: DeployFieldKey[]) {
  return keys.map((key) => ({ key, label: fieldLabels[key] }));
}

function replaceToken(source: string, token: string, value: string) {
  return source.split(token).join(value);
}

function filled(template: string) {
  let code = template;
  code = replaceToken(code, '__REPOSITORY_URL__', params.repositoryUrl || 'https://github.com/asuralyc/izcc.git');
  code = replaceToken(code, '__SERVER_IP__', params.serverIp || 'YOUR_SERVER_IP');
  code = replaceToken(code, '__DB_PASSWORD__', params.dbPassword || 'REPLACE_WITH_STRONG_PASSWORD');
  code = replaceToken(code, '__JWT_SECRET__', params.jwtSecret || 'REPLACE_WITH_LONG_RANDOM_SECRET');
  code = replaceToken(code, '__ADMIN_PASSWORD__', params.adminPassword || 'REPLACE_WITH_ADMIN_PASSWORD');
  return code;
}

function scrollToDeployStep(id: string) {
  const target = document.getElementById(id);
  if (!target) return;

  const header = document.querySelector<HTMLElement>('.site-header');
  const headerOffset = header?.offsetHeight ?? 0;
  const top = target.getBoundingClientRect().top + window.scrollY - headerOffset - 18;

  window.history.replaceState(null, '', `#${id}`);
  window.scrollTo({
    top: Math.max(top, 0),
    behavior: 'smooth'
  });
}
</script>

<template>
  <main class="page">
    <section class="section-head">
      <div>
        <p class="eyebrow">Self Deploy</p>
        <h1>部署我自己</h1>
      </div>
    </section>

    <section class="deploy-layout">
      <nav class="panel deploy-nav" aria-label="部署步驟">
        <a
          v-for="item in deployNavItems"
          :key="item.id"
          :href="`#${item.id}`"
          @click.prevent="scrollToDeployStep(item.id)"
        >
          {{ item.label }}
        </a>
      </nav>

      <div class="step-list">
        <article class="panel deploy-step">
          <h2>部署前提</h2>
          <p class="muted">
            這台主機只有 IP、沒有網域也沒有 SSL 憑證，所以網站走 HTTP。Nginx 設定不要加入
            <code>Strict-Transport-Security</code>，也不要做 HTTP 轉 HTTPS。
          </p>
        </article>

        <article id="inputs" class="panel deploy-step">
          <h2>需要填寫的參數</h2>
          <p class="muted">下方欄位會自動帶入後面的指令。指令需要的欄位沒填好時，複製按鈕會提醒你補上。</p>
          <div class="deploy-inputs">
            <label v-for="field in deployFields" :key="field.key" class="field">
              <span>{{ field.label }}</span>
              <input
                v-model.trim="params[field.key]"
                :type="field.secret ? 'password' : 'text'"
                :placeholder="field.placeholder"
              />
              <small>{{ field.description }}</small>
            </label>
          </div>
        </article>

        <article class="panel deploy-step">
          <h2>產生密碼參考指令</h2>
          <p class="muted">PostgreSQL 密碼與網站管理員密碼可用較短的隨機值；JWT secret 請使用較長的隨機值。</p>
          <CodeBlock :code="passwordGenerator" language="bash" />
        </article>

        <article id="nginx-install" class="panel deploy-step">
          <h2>1. 安裝 Nginx</h2>
          <CodeBlock :code="nginxInstall" language="bash" />
        </article>

        <article id="node-install" class="panel deploy-step">
          <h2>2. 安裝 NodeJS 24</h2>
          <CodeBlock :code="nodeInstall" language="bash" />
        </article>

        <article id="postgres-install" class="panel deploy-step">
          <h2>3. 安裝 PostgreSQL 18</h2>
          <p class="muted">Ubuntu 預設的 apt 來源沒有 PostgreSQL 18，需要先加入 PostgreSQL 官方 repository。</p>
          <CodeBlock :code="postgresInstall" language="bash" />
        </article>

        <article id="project" class="panel deploy-step">
          <h2>4. 建立前後端目錄</h2>
          <p class="muted">
            後端原始碼與 Nest build 放在 <code>/opt/izcc</code>，前端靜態檔放在
            <code>/var/www/izcc</code>，圖片上傳固定放在 <code>/var/www/uploads</code>。
          </p>
          <CodeBlock
            :code="filled(prepareProject)"
            language="bash"
            :required="required(['repositoryUrl'])"
            :values="params"
          />
        </article>

        <article id="database" class="panel deploy-step">
          <h2>5. 建立 PostgreSQL 資料庫</h2>
          <CodeBlock
            :code="filled(databaseSetup)"
            language="bash"
            :required="required(['dbPassword'])"
            :values="params"
          />
        </article>

        <article id="env" class="panel deploy-step">
          <h2>6. 建立後端環境變數</h2>
          <CodeBlock
            :code="filled(envFile)"
            language="bash"
            :required="required(['serverIp', 'dbPassword', 'jwtSecret', 'adminPassword'])"
            :values="params"
          />
        </article>

        <article id="build" class="panel deploy-step">
          <h2>7. 建置並發佈前端</h2>
          <CodeBlock :code="buildApp" language="bash" />
        </article>

        <article id="systemd" class="panel deploy-step">
          <h2>8. 建立 NestJS API 服務</h2>
          <CodeBlock :code="systemdService" language="ini" />
        </article>

        <article id="nginx" class="panel deploy-step">
          <h2>9. 設定 Nginx</h2>
          <p class="muted">此設定只開 HTTP 80，沒有 HSTS，也沒有強制 HTTPS。</p>
          <CodeBlock
            :code="filled(nginxConfig)"
            language="nginx"
            :required="required(['serverIp'])"
            :values="params"
          />
        </article>

        <article id="verify" class="panel deploy-step">
          <h2>10. 驗證</h2>
          <CodeBlock
            :code="filled(verifyCommands)"
            language="bash"
            :required="required(['serverIp'])"
            :values="params"
          />
        </article>

        <article id="update" class="panel deploy-step">
          <h2>之後更新站台</h2>
          <CodeBlock :code="updateCommands" language="bash" />
        </article>
      </div>
    </section>
  </main>
</template>
