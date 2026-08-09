import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "@hrm-plus/ui";

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  className?: string;
}

const toolbarButtonClass =
  "rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40";

export function RichTextEditor({ value, onChange, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[180px] px-3 py-2 focus:outline-none",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className={cn("rounded-md border border-slate-300 bg-white", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 px-2 py-1">
        <button
          type="button"
          className={cn(toolbarButtonClass, editor.isActive("bold") && "bg-slate-200")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </button>
        <button
          type="button"
          className={cn(toolbarButtonClass, editor.isActive("italic") && "bg-slate-200")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </button>
        <button
          type="button"
          className={cn(toolbarButtonClass, editor.isActive("heading", { level: 2 }) && "bg-slate-200")}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </button>
        <button
          type="button"
          className={cn(toolbarButtonClass, editor.isActive("heading", { level: 3 }) && "bg-slate-200")}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </button>
        <button
          type="button"
          className={cn(toolbarButtonClass, editor.isActive("bulletList") && "bg-slate-200")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          Bullet list
        </button>
        <button
          type="button"
          className={cn(toolbarButtonClass, editor.isActive("orderedList") && "bg-slate-200")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          Numbered list
        </button>
        <button
          type="button"
          className={cn(toolbarButtonClass, editor.isActive("blockquote") && "bg-slate-200")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          Quote
        </button>
        <button type="button" className={toolbarButtonClass} onClick={() => editor.chain().focus().undo().run()}>
          Undo
        </button>
        <button type="button" className={toolbarButtonClass} onClick={() => editor.chain().focus().redo().run()}>
          Redo
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
