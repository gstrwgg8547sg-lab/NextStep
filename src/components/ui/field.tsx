import { useId } from "react";
export function Field({
  label,
  value,
  onChange,
  multiline = false,
  maxLength = 2000,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const props = {
    id,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
    maxLength,
    placeholder,
    disabled,
    className: "field",
  };
  return (
    <div className="field-group">
      <label htmlFor={id}>{label}</label>
      {multiline ? <textarea {...props} rows={2} /> : <input {...props} />}
    </div>
  );
}
