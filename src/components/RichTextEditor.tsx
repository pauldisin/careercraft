import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: Props) {
  return (
    <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-200 dark:[&_.ql-toolbar]:border-slate-800 [&_.ql-container]:border-none dark:[&_.ql-stroke]:stroke-slate-400 dark:[&_.ql-fill]:fill-slate-400 dark:[&_.ql-picker]:text-slate-400">
      <ReactQuill 
        theme="snow" 
        value={value} 
        onChange={onChange}
        placeholder={placeholder}
        className="dark:text-white"
        modules={{
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['clean']
          ]
        }}
      />
    </div>
  );
}
