// API modules barrel export
export { ApiError, request } from './http';
export { openaiTts } from './openai';
export { chatApi } from './chat';
export { getWords, addWord, updateWord, deleteWord } from './words';
export { 
  getDashboardData, 
  updateProgress, 
  completeLesson,
  getTodayTodos,
  completeTodayLesson,
  updateSrsReview,
  healthCheck,
  type TodayTodo
} from './dashboard';

