import { forwardRef, useImperativeHandle, useRef } from 'react';

// Simple contentEditable-based rich text editor (bold/italic/underline).
// Uncontrolled by design: the DOM is the source of truth while editing, and the
// current HTML is only read out via the ref (getHTML) when the caller saves.
// This avoids re-render/cursor-jump issues that a fully controlled contentEditable would have.
const RichTextEditor = forwardRef(function RichTextEditor({ defaultValue, placeholder, minRows = 3 }, ref) {
  const divRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getHTML: () => divRef.current?.innerHTML || '',
  }));

  const exec = (cmd) => (e) => {
    e.preventDefault();
    document.execCommand(cmd);
    divRef.current?.focus();
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <div className="flex gap-0.5 border-b border-slate-200 bg-slate-50 p-1">
        <button type="button" onMouseDown={exec('bold')} className="w-7 h-7 rounded hover:bg-slate-200 font-bold text-xs text-slate-700" title="Gras">B</button>
        <button type="button" onMouseDown={exec('italic')} className="w-7 h-7 rounded hover:bg-slate-200 italic text-xs text-slate-700" title="Italique">I</button>
        <button type="button" onMouseDown={exec('underline')} className="w-7 h-7 rounded hover:bg-slate-200 underline text-xs text-slate-700" title="Souligné">U</button>
      </div>
      <div
        ref={divRef}
        contentEditable
        suppressContentEditableWarning
        className="p-2.5 text-sm outline-none whitespace-pre-wrap text-slate-700"
        style={{ minHeight: `${minRows * 1.5}em` }}
        dangerouslySetInnerHTML={{ __html: defaultValue || '' }}
        data-placeholder={placeholder}
      />
    </div>
  );
});

export default RichTextEditor;
