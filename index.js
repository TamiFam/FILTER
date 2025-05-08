const express = require('express');
const bodyParser = require('body-parser');
const { filterJson } = require('./filter');
const config = require('./config');
const path = require('path');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static('public'));

// Хранилище результатов (временное)
const resultsStore = new Map();

// Обработка формы
app.post('/process', (req, res) => {
  const startTime = Date.now();
  try {
    const { queryType = 'default', jsonInput } = req.body;
    
    if (!jsonInput) {
      return res.status(400).json({ 
        error: 'Необходимо предоставить JSON данные',
        details: 'Поле jsonInput пустое'
      });
    }

    // Проверка валидности JSON
    const jsonData = JSON.parse(jsonInput);
    const filteredData = filterJson(queryType, jsonData);
    
    const processingTime = Date.now() - startTime;
    const resultId = Date.now().toString();
    
    resultsStore.set(resultId, {
      original: jsonData,
      filtered: filteredData,
      stats: {
        originalLength: JSON.stringify(jsonData).length,
        filteredLength: JSON.stringify(filteredData).length,
        processingTime,
        removedTags: calculateRemovedTags(jsonData, filteredData)
      }
    });

    res.json({ 
      resultId,
      preview: getFirstLines(JSON.stringify(filteredData, null, 2)),
      stats: resultsStore.get(resultId).stats
    });

  } catch (error) {
    res.status(400).json({ 
      error: 'Ошибка обработки JSON',
      details: error.message,
      position: error instanceof SyntaxError ? error.stack.match(/at position (\d+)/)?.[1] : null
    });
  }
});

// Получение полного результата
app.get('/result/:id', (req, res) => {
  const result = resultsStore.get(req.params.id);
  if (!result) {
    return res.status(404).json({ error: 'Результат не найден' });
  }
  res.json(result.filtered);
});

// Вспомогательные функции
function getFirstLines(jsonString, maxLines = 20) {
  const lines = jsonString.split('\n');
  const preview = lines.slice(0, maxLines).join('\n');
  return lines.length > maxLines 
    ? preview + '\n... (показаны первые ' + maxLines   + ' строк из ' + lines.length + ')' 
    : preview;
}

function calculateRemovedTags(original, filtered) {
  // Рекурсивный подсчёт удалённых полей
  let count = 0;
  function compare(obj1, obj2) {
    for (const key in obj1) {
      if (!(key in obj2)) {
        count++;
      } else if (typeof obj1[key] === 'object' && obj1[key] !== null) {
        compare(obj1[key], obj2[key]);
      }
    }
  }
  compare(original, filtered);
  return count;
}

app.listen(config.port, () => {
  console.log(`Сервер запущен на http://localhost:${config.port}`);
});