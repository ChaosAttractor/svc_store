/**
 * Создание искусственной задержки
 * @param delay - задержка в мс
 */
export const delayPromise = (delay = 3000) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, delay);
  });
