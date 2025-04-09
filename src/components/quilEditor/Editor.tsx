// components/MarkdownFileEditor.tsx

import React, { useRef, useState } from 'react';
import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';

export default function MarkdownFileEditor() {
  const editorRef = useRef<any>();
  const [error, setError] = useState("");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError("");

    if (file && file.type === "text/markdown") {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        editorRef.current?.getInstance().setMarkdown(text || "");
      };
      reader.onerror = () => setError("Failed to read file.");
      reader.readAsText(file);
    } else {
      setError("Please upload a valid `.md` Markdown file.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow rounded-xl">
      <h2 className="text-2xl font-bold mb-4">📄 Markdown File Editor</h2>

      <input
        type="file"
        accept=".md"
        onChange={handleFileUpload}
        className="mb-4 block hover:ring"
      />

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <Editor
        ref={editorRef}
        height="500px"
        previewStyle="vertical"
        initialEditType="wysiwyg"
        useCommandShortcut={true}
        hideModeSwitch={true}
        initialValue="### Upload a `.md` file to begin editing..."
        toolbarItems={[
            ['heading', 'bold', 'italic', 'strike'],
            ['hr', 'quote'],
            ['ul', 'ol'],
            ['table'],
            ['link'], // 👈 no 'image' here
            ['code', 'codeblock'],
            ['scrollSync']
          ]}
      />
    </div>
  );
}
