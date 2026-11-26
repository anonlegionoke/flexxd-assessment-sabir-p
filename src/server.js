import { createApp } from './app.js';
import { createStore } from './store.js';

const PORT = Number(process.env.PORT) || 3000;
const store = createStore();
const app = createApp({ store });

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
