import { createApi } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        const data = refreshResult.data as { success: boolean; accessToken: string };
        localStorage.setItem('accessToken', data.accessToken);
        result = await baseQuery(args, api, extraOptions);
      } else {
        localStorage.clear();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    } else {
      localStorage.clear();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  return result;
};

export const aiApi = createApi({
  reducerPath: 'aiApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['AI'],
  endpoints: (builder) => ({
    // Whisper - Transcribe Audio
    transcribeAudio: builder.mutation<
      { success: boolean; data: { text: string; language: string; success: boolean }; message: string },
      FormData
    >({
      query: (formData) => ({
        url: '/ai/whisper/transcribe',
        method: 'POST',
        body: formData,
      }),
    }),
    
    // Gemini - Parse Prescription from Text
    parsePrescription: builder.mutation<
      {
        success: boolean;
        data: {
          diagnosis: string;
          medicines: Array<{
            name: string;
            dosage: string;
            frequency: string;
            duration: string;
            instructions: string;
          }>;
          notes: string;
        };
        message: string;
      },
      { transcription: string }
    >({
      query: (body) => ({
        url: '/ai/prescription/parse',
        method: 'POST',
        body,
      }),
    }),
    
    // Voice Prescription - Complete flow (Audio → Transcribe → Parse)
    voicePrescription: builder.mutation<
      {
        success: boolean;
        data: {
          transcription: string;
          diagnosis: string;
          medicines: Array<{
            name: string;
            dosage: string;
            frequency: string;
            duration: string;
            instructions: string;
          }>;
          notes: string;
        };
        message: string;
      },
      FormData
    >({
      query: (formData) => ({
        url: '/ai/prescription/voice',
        method: 'POST',
        body: formData,
      }),
    }),
    
    // Gemini Chat
    geminiChat: builder.mutation<
      { success: boolean; data: { response: string }; message: string },
      { message: string; conversationHistory?: Array<{ role: string; content: string }> }
    >({
      query: (body) => ({
        url: '/ai/gemini/chat',
        method: 'POST',
        body,
      }),
    }),

    chatWithAI: builder.mutation<any, { message: string; conversationHistory: any[] }>({
      query: (body) => ({
        url: '/ai/gemini/chat',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useTranscribeAudioMutation,
  useParsePrescriptionMutation,
  useVoicePrescriptionMutation,
  useGeminiChatMutation,
  useChatWithAIMutation,
} = aiApi;
