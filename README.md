# LandBankControl — система управління земельним банком

Монорепозиторій: **backend** (Python) і **frontend** (Node.js) в одному репозиторії.
Архітектура — **модульний моноліт**: кожна доменна область (земельні ділянки, договори оренди,
контрагенти, ГІС, користувачі та доступ) є ізольованим модулем.

## Структура репозиторію

```
LandBankControl/
├── .gitignore
├── README.md                  # цей файл
├── backend/                   # Python 3.14 + FastAPI (uv)
│   ├── .python-version
│   ├── .env.example           # шаблон змінних оточення
│   ├── pyproject.toml
│   ├── uv.lock
│   └── app/
│       └── modules/           # ізольовані доменні модулі backend
└── frontend/                  # React + TypeScript + Vite (npm)
    ├── .env.example
    ├── components.json        # конфігурація shadcn/ui
    ├── package.json
    ├── package-lock.json
    ├── vite.config.ts
    └── src/
        ├── components/ui/     # компоненти shadcn/ui (генеруються CLI)
        ├── lib/utils.ts
        ├── modules/           # ізольовані доменні модулі frontend
        └── shared/api/        # спільний клієнт API
```

Модулі взаємодіють лише через явні інтерфейси/сервіси.

## Стек

| Шар | Технології |
|-----|-----------|
| Backend | Python 3.14, uv, FastAPI, SQLAlchemy 2.0 (pyodbc), pydantic-settings, MS SQL Server (заплановано) |
| Frontend | Node.js v24, Vite 8, React 19, TypeScript 6 (strict), Tailwind CSS 4, shadcn/ui (Radix UI, пресет Nova), TanStack Query 5, ESLint 10 |
| Автентифікація | JWT + RBAC; токени лише в httpOnly cookie або в пам'яті (заплановано) |
| Карти | Не обрано (див. «Відкриті питання») |

Поточний стан: створено каркас обох проєктів. Залежності backend (FastAPI тощо) ще не додані.

## Вимоги до середовища (Windows, PowerShell)

- Git
- uv (менеджер Python-залежностей)
- Node.js 20.19+ або 22.12+ (використовується v24), npm
- (за потреби) GitHub CLI `gh`

Встановлення:

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
winget install --id Git.Git -e
winget install --id GitHub.cli -e
```

Після встановлення перезапустіть термінал.

## Швидкий старт (перенесення на іншу машину)

```powershell
git clone https://github.com/Goray-Igor/LandBankControl.git
cd LandBankControl

# Backend
cd backend
uv python install 3.14
uv sync
Copy-Item .env.example .env      # заповніть значення (файл .env не комітиться)
cd ..

# Frontend
cd frontend
npm ci                           # точні версії з package-lock.json
Copy-Item .env.example .env
npm run dev                      # http://localhost:5173
```

Dev-сервер frontend проксує запити `/api` на `http://localhost:8000` (backend), тому CORS не потрібен
і працюють httpOnly cookie.

Перевірка:

```powershell
cd backend;  uv run python -c "import app; print('ok')"
cd ..\frontend; npm run lint; npm run build
```

## Відтворення проєкту з нуля

### 1. Репозиторій і backend

```powershell
mkdir LandBankControl
cd LandBankControl
git init -b main

uv python install 3.14
uv init backend --app --python 3.14 --vcs none
cd backend
Remove-Item main.py
mkdir app\modules
```

Створіть файли (у редакторі, UTF-8 без BOM):

- `app\__init__.py` — `"""Backend системи управління земельним банком."""`
- `app\modules\__init__.py` — `"""Ізольовані доменні модулі (модульний моноліт)."""`

```powershell
uv sync
cd ..
```

У `backend\pyproject.toml` не повинно бути секцій `[build-system]` і `[project.scripts]`:
застосунок запускається як `app/`, а не збирається у пакет.

Також створіть кореневий `.gitignore` (секрети, `.venv/`, `__pycache__/`, `node_modules/`, `dist/`,
дампи БД `*.bak`, `*.bacpac`, `*.dump`, логи, `.idea/`, `.vscode/`; шаблон `!.env.example` має бути
виключенням для `.env.*`) та `backend\.env.example` (`DB_SERVER`, `DB_NAME`, `DB_USER`,
`DB_PASSWORD`, `JWT_SECRET` без значень).

### 2. Frontend

```powershell
npm create vite@latest frontend -- --template react-ts
```

Відповіді майстра: лінтер — **ESLint**; «Install and start now» — **No**.

```powershell
cd frontend
```

**Важливо:** шаблон ставить TypeScript 7, а `typescript-eslint` підтримує лише `>=4.8.4 <6.1.0`.
У `package.json` змініть `"typescript": "~7.0.2"` на `"~6.0.0"`, і лише потім:

```powershell
npm install
npm install tailwindcss @tailwindcss/vite
npm install -D @types/node
npm install @tanstack/react-query
```

Не використовуйте `--force` та `--legacy-peer-deps`.

Налаштування файлів (точкові правки):

- `src/index.css` — `@import "tailwindcss";` (далі `shadcn init` доповнить його сам).
- `vite.config.ts` — плагін `tailwindcss()`, аліас `@` → `src` через `import.meta.dirname`, проксі `/api` → `http://localhost:8000`.
- `tsconfig.app.json` — `"paths": { "@/*": ["./src/*"] }`, `"strict": true`, `"noUncheckedIndexedAccess": true`. **Без `baseUrl`** (у TypeScript 6 він застарілий).
- `tsconfig.json` — у `compilerOptions` додайте той самий `paths` (його читає shadcn).
- `eslint.config.js` — два блоки: основний для `**/*.{ts,tsx}` з `@typescript-eslint/no-explicit-any: 'error'` і окремий для `src/components/ui/**` з вимкненим `react-refresh/only-export-components` (блок для `ui` має йти після основного).
- `index.html` — `lang="uk"`, зрозумілий `<title>`.

shadcn/ui:

```powershell
npx shadcn@latest init
```

Відповіді: бібліотека — **Radix UI**; пресет — **Nova (Lucide / Geist)**; базовий колір — Neutral.

```powershell
npx shadcn@latest add button
```

Скелет модулів і шаблон оточення:

```powershell
mkdir src\modules, src\shared, src\shared\api
```

- `src\modules\README.md` — опис: модулі `land-plots`, `leases`, `counterparties`, `gis`, `users`.
- `.env.example` — `VITE_API_BASE_URL=/api` (змінні `VITE_*` потрапляють у публічний бандл, секретів там бути не може).

### 3. Публікація в GitHub

```powershell
cd ..
git add .
git status        # перевірте: немає node_modules, dist, .env, .venv
git commit -m "chore: ініціалізація проєкту"
gh auth login
gh repo create LandBankControl --private --source . --remote origin --push
```

## Журнал рішень

- **Монорепозиторій** замість двох репозиторіїв: єдина історія змін API і UI, спільна документація,
  повний контекст проєкту в одному місці.
- **TypeScript 6.0.x** (а не 7): конфлікт peer-залежностей з `typescript-eslint 8.72.1`.
  Повернутися на TypeScript 7 можна, коли `typescript-eslint` розширить допустимий діапазон.
- **Без `baseUrl`** у `tsconfig`: застарілий у TS 6; аліаси працюють через `paths` у режимі `moduleResolution: "bundler"`.
- **`app/` замість `src/`-розкладки uv**: видалено `src/backend` та `[build-system]`.
- **ESLint**, а не Oxlint: потрібні строгі правила TypeScript (заборона `any`), які краще підтримуються в ESLint.
- **shadcn/ui на Radix UI**, пресет Nova: зрілий варіант з найбільшою кількістю прикладів; шрифт Geist підключається локально (без CDN), підтримує кирилицю.
- **Пакет `cn`** (залежність shadcn) — офіційний, від автора shadcn, заміна `clsx` + `tailwind-merge`.
- **`package-lock.json` комітиться** (аналог `uv.lock`): відтворювані встановлення через `npm ci`.
- **`frontend/.gitignore`** від Vite залишено: його правила доповнюють кореневий.
- **`@arcgis/core` не встановлено**: бібліотеку карт ще не обрано.

## Правила розробки (коротко)

- Мова: UI, змінні, коментарі та документація коду — українська.
- `any` заборонено, TypeScript у режимі strict.
- SQL лише з параметрами; без f-рядків у запитах.
- Секрети — лише через змінні оточення (`.env` не комітиться).
- Токени — лише httpOnly cookie або в пам'яті; `localStorage` для JWT заборонено.
- Усі ендпоінти, крім health/ready, потребують автентифікації.
- Скрипти зміни даних: dry-run, транзакція, підтвердження, резервна копія.
- Коміти — за Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`…).

## Відкриті питання та наступні кроки

1. Backend: додати FastAPI, SQLAlchemy 2.0, pyodbc, pydantic-settings; перевірити наявність wheels під Python 3.14 для Windows; `app/core/config.py`; ендпоінти `health`/`ready`.
2. MS SQL Server: версія та ODBC Driver (17 або 18) — визначити.
3. Бібліотека карт: джерело даних (ArcGIS Server/Portal, геометрія в MS SQL, публічні WMS/WMTS) — визначити.
4. Прибрати залишки шаблону Vite (`App.tsx`, `App.css`, логотипи), додати каркас застосунку з `QueryClientProvider`.
5. Розібрати `npm audit --omit=dev` (без `npm audit fix --force`).