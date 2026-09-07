import React from "react";

type Props = {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  disabled?: boolean;
};

export default function TextInput({ placeholder = "", value: controlledValue, onChange, onSubmit, disabled = false }: Props) {
  const [internal, setInternal] = React.useState("");
  const value = controlledValue ?? internal

  return (
    <form
      className="text-input"
      onSubmit={(e) => {
        e.preventDefault();
        if (disabled || !value.trim()) return;
        onSubmit?.(value.trim());
        if (controlledValue === undefined) setInternal("");
      }}
    >
      <textarea
        rows={2}
        maxLength={6000}
        disabled={disabled}
        onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault(); event.currentTarget.form?.requestSubmit()
          }
        }}
        value={value}
        onChange={(e) => { onChange?.(e.target.value); if (controlledValue === undefined) setInternal(e.target.value) }}
        placeholder={placeholder}
        aria-label="Message"
      />
    </form>
  );
}
