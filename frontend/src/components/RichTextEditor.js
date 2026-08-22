import { forwardRef, useImperativeHandle, useRef } from 'react';

const COLORS = [
  { label: 'Noir', value: '#1e293b' },
  { label: 'Rouge', value: '#dc2626' },
  { label: 'Orange', value: '#ea580c' },
  { label: 'Vert', value: '#16a34a' },
  { label: 'Bleu', value: '#2563eb' },
  { label: 'Violet', value: '#7c3aed' },
];

const FONT_SIZES = [
  { label: 'P', title: 'Petit', value: '2' },
  { label: 'N', title: 'Normal', value: '3' },
  { label: 'G', title: 'Grand', value: '5' },
  { label: 'GG', title: 'Très grand', value: '7' },
];

// Simple contentEditable-based rich text editor (bold/italic/underline/color/size).
// Uncontrolled by design: the DOM is the source of truth while editing, and the
// current HTML is only read out via the ref (getHTML) when the caller saves.
// This avoids re-render/cursor-jump issues that a fully controlled contentEditable would have.
// All toolbar actions fire on mousedown+preventDefault (not click) so the current text
// selection in the editable div is never lost before document.execCommand runs.
const RichTextEditor = forwardRef(function RichTextEditor({ defaultValue, placeholder, minRows = 3 }, ref) {
  const divRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getHTML: () => divRef.current?.innerHTML || '',
  }));

  const exec = (cmd, value) => (e) => {
    e.preventDefault();
    document.execCommand(cmd, false, value);
    divRef.current?.focus();
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 p-1">
        <button type="button" onMouseDown={exec('bold')} className="w-7 h-7 rounded hover:bg-slate-200 font-bold text-xs text-slate-700" title="Gras">B</button>
        <button type="button" onMouseDown={exec('italic')} className="w-7 h-7 rounded hover:bg-slate-200 italic text-xs text-slate-700" title="Italique">I</button>
        <button type="button" onMouseDown={exec('underline')} className="w-7 h-7 rounded hover:bg-slate-200 underline text-xs text-slate-700" title="Souligné">U</button>
        <span className="w-px h-5 bg-slate-200 mx-0.5" />
        {FONT_SIZES.map(f => (
          <button
            key={f.value}
            type="button"
            onMouseDown={exec('fontSize', f.value)}
            className="min-w-7 h-7 px-1 rounded hover:bg-slate-200 text-xs font-semibold text-slate-700"
            title={f.title}
          >
            {f.label}
          </button>
        ))}
        <span className="w-px h-5 bg-slate-200 mx-0.5" />
        {COLORS.map(c => (
          <button
            key={c.value}
            type="button"
            onMouseDown={exec('foreColor', c.value)}
            className="w-6 h-6 rounded-full border border-slate-200 shrink-0"
            style={{ backgroundColor: c.value }}
            title={c.label}
          />
        ))}
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
