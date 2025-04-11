import { useState } from 'react';

const API_BASE_URL = 'https://db79-2406-8800-81-8770-dda6-d82f-a691-48b0.ngrok-free.app';

interface Document {
  id: string;
  title: string;
  content: string;
  version: number;
  versionHash: string;
  checkedOutBy: string[];
  lastModifiedBy: string;
  changeHistory: ChangeCommit[];
  createdAt: string;
  updatedAt: string;
}

interface ChangeCommit {
  action: string;
  userId: string;
  content: string;
  diffBlocks: DiffBlock[];
}

interface DiffBlock {
  type: 'diff';
  content: string;
  startLine: number;
  startOffset: number;
  endLine: number;
  endOffset: number;
  operation: 'insert' | 'delete' | 'equal';
}

interface CreateDocumentParams {
  title: string;
  content: string;
  userId: string;
}

interface CheckoutDocumentParams {
  documentId: string;
  userId: string;
}

interface CommitDocumentParams {
  documentId: string;
  userId: string;
  content: string;
  checkoutVersionHash: string;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// Custom hook for document operations
export const useDocumentApi = () => {
  const [response, setResponse] = useState<ApiResponse<Document>>({
    data: null,
    error: null,
    loading: false,
  });

  const setLoading = (loading: boolean) => {
    setResponse(prev => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setResponse(prev => ({ ...prev, error }));
  };

  const setData = (data: Document) => {
    setResponse(prev => ({ ...prev, data }));
  };

  const fetchDocument = async (documentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setData(data);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch document';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async (params: CreateDocumentParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setData(data);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create document';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkoutDocument = async (params: CheckoutDocumentParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/documents/checkout`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setData(data);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to checkout document';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const commitDocument = async (params: CommitDocumentParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/documents/commit`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setData(data);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to commit document';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    ...response,
    fetchDocument,
    createDocument,
    checkoutDocument,
    commitDocument,
  };
}; 