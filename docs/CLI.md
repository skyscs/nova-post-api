# CLI Commands Documentation

Это руководство по использованию CLI команд для управления NovaPost API.

## Обзор команд

### 🔍 Проверка статуса

```bash
# Показать детальную информацию о системе
bun run cli:status

# Проверить последние обновления
bun run cli:check

# Показать историю обновлений
bun run cli:history [количество]
```

### 🔄 Управление обновлениями

```bash
# Проверить и применить обновления (безопасно)
bun run cli:update

# Принудительно загрузить данные с NovaPost API
bun src/cli/update.ts update-api [лимит]

# Загрузить данные из файла
bun src/cli/update.ts load-file /path/to/file.json
```

### ❓ Справка

```bash
# Показать список всех команд
bun run cli:help
```

## Примеры использования

### Ежедневное обслуживание

```bash
# 1. Проверить статус системы
bun run cli:status

# 2. Посмотреть последние обновления
bun run cli:check

# 3. При необходимости запустить обновление
bun run cli:update
```

### Экстренное обновление

```bash
# Загрузить последние 1000 записей с NovaPost API
bun src/cli/update.ts update-api 1000

# Проверить результат
bun run cli:status
bun run cli:history
```

### Диагностика проблем

```bash
# Посмотреть последние 20 обновлений
bun src/cli/update.ts history 20

# Проверить детальный статус
bun run cli:check
```

## Вывод команд

### `bun run cli:status`
```json
{
  "divisions": {
    "count": 100,
    "last_update": "2025-06-04T19:26:27.164Z"
  },
  "countries": {
    "count": 26
  },
  "cities": {
    "count": 58222
  }
}
```

### `bun run cli:check`
```
🔍 Checking for updates...
📊 Current status:
   Last update: 6/4/2025, 11:26:27 PM
   Divisions in DB: 100
   Countries: 26
   Cities: 58222
   Last update message: Successfully loaded 100 divisions from NovaPost API
   Divisions processed: 100

💡 Use "bun run cli/update.ts update" to check and apply updates
```

### `bun run cli:history`
```
📋 Update History (last 10 updates):
   1. 6/4/2025, 11:26:27 PM
      Status: completed
      Message: Successfully loaded 100 divisions from NovaPost API
      Divisions: 100
      Completed: 6/4/2025, 11:26:27 PM
```

## Статусы обновлений

- **`started`** - Обновление запущено
- **`completed`** - Обновление успешно завершено  
- **`failed`** - Обновление завершилось с ошибкой

## Безопасность

- Все CLI команды требуют прямого доступа к серверу (SSH)
- Команды не доступны через публичные API endpoints
- Логи всех операций сохраняются в таблице `update_logs`

## Мониторинг

Для мониторинга можно использовать:

1. **Логи приложения**: `logs/combined.log`
2. **История CLI**: `bun run cli:history`
3. **Публичные endpoints**:
   - `GET /api/v1/system/health`
   - `GET /api/v1/system/status`  
   - `GET /api/v1/system/update-status`

## Автоматизация

CLI команды можно интегрировать в cron jobs:

```bash
# Ежедневная проверка в 4:00
0 4 * * * cd /path/to/nova-post-api && bun run cli:update

# Еженедельная диагностика в воскресенье
0 2 * * 0 cd /path/to/nova-post-api && bun run cli:check >> /var/log/nova-post-weekly.log
``` 