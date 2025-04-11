import React, { useRef, useState } from 'react';
import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';
import colorSyntax from '@toast-ui/editor-plugin-color-syntax';
import 'tui-color-picker/dist/tui-color-picker.css';
import '@toast-ui/editor-plugin-color-syntax/dist/toastui-editor-plugin-color-syntax.css';
import { useDocumentApi } from '../../services/documentApi';

interface DiffBlock {
  type: 'diff';
  content: string;
  startLine: number;
  startOffset: number;
  endLine: number;
  endOffset: number;
  operation: 'insert' | 'delete' | 'equal';
}

interface ChangeCommit {
  action: string;
  userId: string;
  content: string;
  diffBlocks: DiffBlock[];
}

interface DocumentResponse {
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

const userColors: Record<string, string> = {};

function getUserColor(userId: string): string {
  if (!userColors[userId]) {
    const colors = ['#e0f7fa', '#ffebee', '#f3e5f5', '#e8f5e9', '#fff3e0'];
    userColors[userId] = colors[Object.keys(userColors).length % colors.length];
  }
  return userColors[userId];
}

export default function MarkdownFileEditor() {
  const editorRef = useRef<Editor>(null);
  const [error, setError] = useState("");
  const [markdownOutput, setMarkdownOutput] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const { 
    data, 
    error: apiError, 
    loading, 
    fetchDocument, 
    createDocument, 
    checkoutDocument, 
    commitDocument 
  } = useDocumentApi();

  const applyDiffBlocks = (content: string, history: ChangeCommit[]): string => {
    const diffs = history
      .filter((h) => h.diffBlocks.length > 0)
      .flatMap((h) =>
        h.diffBlocks.map((block) => ({ ...block, userId: h.userId }))
      )
      .sort((a, b) => a.startOffset - b.startOffset);

    console.log('diffs got >>>>', diffs)
  
    let result = '';
    let cursor = 0;
  
    diffs.forEach((block) => {
      // Add plain text from current cursor to this block's start
      if (block.startOffset > cursor) {
        result += content.slice(cursor, block.startOffset);
      }
  
      // Skip equal blocks (no highlight)
      if (block.operation === 'equal') {
        result += content.slice(block.startOffset, block.endOffset);
      } else {
        const color =
          block.operation === 'delete'
            ? '#ff9090'
            : getUserColor(block.userId);

  
        const style = `${block.operation === 'delete' ? 'text-decoration:line-through;' : ''} background-color:${color}; padding:2px;`;
  
        result += `<span style="${style}" title="${block.userId}">${block.content}</span>`;
        console.log('looped block >>>>', {block, color, result})

      }
  
      cursor = block.endOffset;
    });
  
    // Add remaining text after last block
    if (cursor < content.length) {
      result += content.slice(cursor);
    }
    console.log('looped block >>>>', result)
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentId.trim()) {
      return;
    }

    try {
      const document = await fetchDocument(documentId);
      const finalContentWithDiffs = document.content;
      editorRef.current?.getInstance().setMarkdown(finalContentWithDiffs);
    } catch (err) {
      // Error is already handled by the hook
    }
  };

  const handleCreateDocument = async () => {
    if (!title.trim() || !userId.trim()) {
      return;
    }

    try {
      const markdown = editorRef.current?.getInstance().getMarkdown() || "";
      const stripedMarkdown = stripHtmlFromMarkdown(markdown);
      const document = await createDocument({
        title,
        content: stripedMarkdown,
        userId
      });
      setDocumentId(document.id);
    } catch (err) {
      // Error is already handled by the hook
    }
  };

  const handleCheckout = async () => {
    if (!documentId.trim() || !userId.trim()) {
      return;
    }

    try {
      await checkoutDocument({
        documentId,
        userId
      });
    } catch (err) {
      // Error is already handled by the hook
    }
  };

  const handleCommit = async () => {
    if (!documentId.trim() || !userId.trim() || !data?.versionHash) {
      return;
    }

    try {
      const markdown = editorRef.current?.getInstance().getMarkdown() || "";
      const stripedMarkdown = stripHtmlFromMarkdown(markdown);
      await commitDocument({
        documentId,
        userId,
        content: stripedMarkdown,
        checkoutVersionHash: data.versionHash
      });
    } catch (err) {
      // Error is already handled by the hook
    }
  };

  function stripHtmlFromMarkdown(markdown: string): string {
    return markdown.replace(/<[^>]*>/g, '');
  }

  const handleExportMarkdown = () => {
    const markdown = editorRef.current?.getInstance().getMarkdown();
    const stripedMarkdown = stripHtmlFromMarkdown(markdown || '');
    console.log('what we got >>>', { markdown, stripedMarkdown });
    setMarkdownOutput(stripedMarkdown);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow rounded-xl space-y-4">
      <h2 className="text-2xl font-bold">📄 Markdown File Editor</h2>

      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter User ID"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter Document Title"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
            placeholder="Enter document ID"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? "Loading..." : "Load Document"}
          </button>
        </form>

        <div className="flex gap-2">
          <button
            onClick={handleCreateDocument}
            disabled={loading || !title.trim() || !userId.trim()}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300"
          >
            Create Document
          </button>
          <button
            onClick={handleCheckout}
            disabled={loading || !documentId.trim() || !userId.trim()}
            className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-yellow-300"
          >
            Checkout Document
          </button>
          <button
            onClick={handleCommit}
            disabled={loading || !documentId.trim() || !userId.trim() || !data?.versionHash}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300"
          >
            Commit Changes
          </button>
        </div>
      </div>

      {apiError && <p className="text-red-500 mb-4">{apiError}</p>}

      <Editor
        ref={editorRef}
        height="500px"
        previewStyle="vertical"
        initialEditType="wysiwyg"
        useCommandShortcut={true}
        hideModeSwitch={true}
        initialValue="Enter a document ID and click 'Load Document' to start editing..."
        toolbarItems={[
          ['heading', 'bold', 'italic', 'strike'],
          ['hr', 'quote'],
          ['ul', 'ol'],
          ['table'],
          ['link'],
          ['code', 'codeblock'],
          ['scrollSync'],
        ]}
        plugins={[colorSyntax]}
      />

      <button
        onClick={handleExportMarkdown}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Export Markdown
      </button>

      {markdownOutput && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">📦 Exported Markdown</h3>
          <pre className="bg-gray-100 p-3 rounded whitespace-pre-wrap">{markdownOutput}</pre>
        </div>
      )}
    </div>
  );
}