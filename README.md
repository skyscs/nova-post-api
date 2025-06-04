# NovaPost Divisions API

🚀 High-performance REST API для работы с базой данных почтовых отделений NovaPost с поддержкой геопространственного поиска.

## ✨ Основные возможности

- 🌍 **Геопространственный поиск** - найти ближайшие отделения по координатам
- 🔍 **Поиск по стране и городу** - фильтрация отделений 
- 🔄 **Автоматическое обновление** - ежедневная синхронизация с NovaPost API
- ⚡ **PostGIS** - эффективные пространственные запросы
- 🐳 **Docker** - контейнеризация для простого развертывания
- 📊 **Мониторинг** - логирование и health checks
- 🔄 **CI/CD** - автоматический деплой через GitHub Actions

## 🛠 Технологический стек

- **Runtime**: [Bun](https://bun.sh/) - быстрая JavaScript/TypeScript среда выполнения
- **Framework**: [Hono](https://hono.dev/) - легкий веб-фреймворк
- **Database**: PostgreSQL + PostGIS - пространственная база данных
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions

## 🚀 Быстрый старт

### Локальная разработка

```bash
# Клонировать репозиторий
git clone <repository-url>
cd nova-post-api

# Установить зависимости
bun install

# Настроить окружение
cp env.example .env
# Отредактируйте .env файл

# Запустить базу данных
docker-compose up -d postgres

# Запустить в режиме разработки
bun run dev
```

### Продакшн развертывание

1. **Настройте секреты в GitHub репозитории**
2. **Выполните push в main ветку** для автоматического деплоя

## 📡 API Endpoints

### Базовый URL: `/api/v1`

| Endpoint | Method | Описание |
|----------|--------|----------|
| `/divisions/nearby` | GET | Поиск ближайших отделений |
| `/divisions/search` | GET | Поиск по фильтрам |
| `/divisions/:id` | GET | Получить отделение по ID |
| `/divisions/countries` | GET | Список всех стран |
| `/divisions/countries/:code/cities` | GET | Города по стране |
| `/system/health` | GET | Проверка здоровья API |
| `/system/status` | GET | Статус системы |
| `/system/update-status` | GET | Статус последнего обновления |
| `/system/updates/history` | GET | История обновлений |

### Примеры запросов

```bash
# Найти ближайшие отделения
curl "http://localhost:3001/api/v1/divisions/nearby?lat=50.4501&lng=30.5234&radius=10"

# Поиск по стране
curl "http://localhost:3001/api/v1/divisions/search?country=Ukraine&limit=10"

# Проверка здоровья
curl "http://localhost:3001/api/v1/system/health"
```

## 📋 Архитектура

```
src/
├── types/          # TypeScript типы
├── utils/          # Утилиты (database, logger)
├── services/       # Бизнес-логика
├── routes/         # API маршруты
└── index.ts        # Главный файл приложения

docker/
└── init.sql        # SQL инициализация БД

docs/
└── README.md       # Подробная документация API
```

## 🔧 Конфигурация

### Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `PORT` | Порт приложения | 3001 |
| `DATABASE_URL` | Строка подключения к БД | - |
| `NOVA_POST_API_URL` | URL NovaPost API | - |
| `UPDATE_CRON` | Cron выражение для обновлений | `0 2 * * *` |
| `LOG_LEVEL` | Уровень логирования | `info` |

### GitHub Secrets (для деплоя)

- `HOST` - IP/hostname сервера
- `USERNAME` - SSH пользователь  
- `SSH_KEY` - Приватный SSH ключ
- `DATABASE_URL` - Строка подключения к БД
- `APP_PORT` - Порт приложения
- Остальные переменные окружения...

## 📊 Мониторинг

- **Логи**: `logs/combined.log`, `logs/error.log`
- **Health Check**: `GET /api/v1/system/health`
- **Статус**: `GET /api/v1/system/status`
- **История обновлений**: `GET /api/v1/system/updates/history`

## 🔄 Автоматическое обновление

API автоматически проверяет обновления NovaPost базы данных каждый день в 3:00 UTC и обновляет локальную базу при появлении новой версии.

### 🔒 Безопасность обновлений

Для безопасности **публичные endpoints обновления удалены**. Ручное управление доступно только через CLI с доступом к серверу:

```bash
# Проверить статус
bun run cli:status

# Проверить доступные обновления  
bun run cli:check

# Выполнить обновление
bun run cli:update

# Показать историю обновлений
bun run cli:history
```

Подробнее в [документации по безопасности](docs/SECURITY.md).

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch
3. Внесите изменения
4. Добавьте тесты
5. Обновите документацию
6. Создайте Pull Request

## 📄 Лицензия

MIT License

## 📞 Поддержка

- 📖 [Подробная документация](docs/README.md)
- 🐛 [Issues](../../issues)
- 💬 [Discussions](../../discussions)

---

Создано с ❤️ для эффективной работы с API NovaPost 