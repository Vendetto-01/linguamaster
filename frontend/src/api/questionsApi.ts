// frontend/src/api/questionsApi.ts
import { 
  Question, 
  QuestionGenerationConfig,
  QuestionGenerationResponse,
  PaginatedQuestionsResponse,
  QuestionFilterParams,
  QuestionSortParams,
  BulkActionResponse 
} from '../types/questions';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface GetQuestionsParams extends QuestionFilterParams, QuestionSortParams {
  page?: number;
  limit?: number;
}

class QuestionsApi {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        // Eğer authentication varsa buraya eklenebilir
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'API request failed');
    }

    return response.json();
  }

  async getQuestions(params: GetQuestionsParams): Promise<PaginatedQuestionsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.searchTerm) queryParams.append('search', params.searchTerm);
    if (params.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    return this.request<PaginatedQuestionsResponse>(`/api/questions?${queryParams}`);
  }

  async generateQuestions(config: QuestionGenerationConfig): Promise<QuestionGenerationResponse> {
    return this.request<QuestionGenerationResponse>('/api/questions/generate', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async updateQuestion(questionId: string, updates: Partial<Question>): Promise<Question> {
    return this.request<Question>(`/api/questions/${questionId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteQuestion(questionId: string): Promise<void> {
    await this.request(`/api/questions/${questionId}`, {
      method: 'DELETE',
    });
  }

  async bulkDeleteQuestions(questionIds: string[]): Promise<BulkActionResponse> {
    return this.request<BulkActionResponse>('/api/questions/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ questionIds }),
    });
  }

  async toggleQuestionActive(questionId: string): Promise<Question> {
    return this.request<Question>(`/api/questions/${questionId}/toggle-active`, {
      method: 'POST',
    });
  }
}

export const questionsApi = new QuestionsApi();