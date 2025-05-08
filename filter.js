const config = require('./config');

function filterJson(queryType, data) {
  const cfg = config.filters[queryType] || config.filters.default;
  const toRemove = new Set(cfg.removeFromItems);

  function process(obj) {
    if (Array.isArray(obj)) {
      // Обрабатываем КАЖДЫЙ элемент массива
      return obj.map(item => process(item));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (!toRemove.has(key)) {
          result[key] = process(value); // Рекурсия для вложенных данных
        }
      }
      return result;
    }
    return obj;
  }

  return process(data); // Запускаем обработку
}


module.exports = { filterJson };