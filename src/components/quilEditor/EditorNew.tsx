import React, { useRef, useEffect, useState } from 'react';
import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';
import colorSyntax from '@toast-ui/editor-plugin-color-syntax';
import 'tui-color-picker/dist/tui-color-picker.css';
import '@toast-ui/editor-plugin-color-syntax/dist/toastui-editor-plugin-color-syntax.css';

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

  const fetchDocumentFromAPI = async (): Promise<DocumentResponse> => {
    return {
      id: "aba12b54-0064-4ae2-ab46-32469125cdd4",
      title: "Demo title",
      // content: "Content totally changed by user\nNew content added.",
      content: "",
      version: 3,
      versionHash: "2810fe40aacdfe86ff4eeaf356cf2725ecacd1f0e96d90a8b2a2e259fc9efb2c",
      checkedOutBy: ["user1111", "fe_user_1"],
      lastModifiedBy: "fe_dev_1",
      createdAt: "2025-04-10T06:19:38.210Z",
      updatedAt: "2025-04-10T11:43:29.987Z",
      changeHistory: [
        {
          action: "CREATE",
          userId: "user1111",
          content: "Some random content",
          diffBlocks: []
        },
        {
          action: "CHECKOUT",
          userId: "user1111",
          content: "Some random content",
          diffBlocks: []
        },
        {
          action: "COMMIT",
          userId: "user2222",
          content: "Content totally changed by user",
          diffBlocks: [
            {
              type: "diff",
              content: "Some random content",
              endLine: 0,
              endOffset: 19,
              operation: "delete",
              startLine: 0,
              startOffset: 0
            },
            {
              type: "diff",
              content: "Content totally changed by user",
              endLine: 0,
              endOffset: 50,
              operation: "insert",
              startLine: 0,
              startOffset: 19
            }
          ]
        },
        {
          action: "CHECKOUT",
          userId: "fe_dev_1",
          content: "Content totally changed by user",
          diffBlocks: []
        },
        {
          action: "CHECKOUT",
          userId: "fe_user_1",
          content: "Content totally changed by user",
          diffBlocks: []
        },
        {
          action: "UPDATE",
          userId: "fe_dev_1",
          content: "Content totally changed by user\nNew content added.",
          diffBlocks: [
            {
              type: "diff",
              content: "Content totally changed by user",
              endLine: 0,
              endOffset: 31,
              operation: "equal",
              startLine: 0,
              startOffset: 0
            },
            {
              type: "diff",
              content: "\nNew content added.",
              endLine: 1,
              endOffset: 18,
              operation: "insert",
              startLine: 0,
              startOffset: 31
            }
          ]
        }
      ]
    };
  };

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

  const loadEditorContent = async () => {
    try {
      const document = await fetchDocumentFromAPI();
      const finalContentWithDiffs = applyDiffBlocks(document.content, document.changeHistory);
      editorRef.current?.getInstance().setMarkdown(finalContentWithDiffs);
    } catch (err) {
      setError("Failed to load document");
    }
  };

  function stripHtmlFromMarkdown(markdown: string): string {
    return markdown.replace(/<[^>]*>/g, '');
  }

  const handleExportMarkdown = () => {
    const markdown = editorRef.current?.getInstance().getMarkdown();
    console.log('what we got >>>', markdown);
    setMarkdownOutput(stripHtmlFromMarkdown(markdown) || '');
  };

  useEffect(() => {
    loadEditorContent();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow rounded-xl space-y-4">
      <h2 className="text-2xl font-bold">📄 Markdown File Editor</h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <Editor
        ref={editorRef}
        height="500px"
        previewStyle="vertical"
        initialEditType="wysiwyg"
        useCommandShortcut={true}
        hideModeSwitch={true}
        initialValue="Loading document..."
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