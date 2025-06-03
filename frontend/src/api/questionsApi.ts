// frontend/src/api/questionsApi.ts
import { 
  Question, 
  QuestionGenerationConfig,
  QuestionGenerationResponse,
  PaginationInfo,
  QuestionFilterParams,
  QuestionSortParams,
  BulkActionResponse 
} from '../types/questions';

interface GetQuestionsResponse {
  data: Question[];
  pagination: PaginationInfo;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class QuestionsApi {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'API request failed');
    }
  }

  async getQuestions(params: QuestionFilterParams & QuestionSortParams): Promise<GetQuestionsResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    return this.request<GetQuestionsResponse>(`/api/questions?${queryParams}`);
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