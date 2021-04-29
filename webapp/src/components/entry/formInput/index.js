import { Input } from '../input';

export const FormInput = ({
  className,
  placeholder,
  value,
  onChange,
  error,
}) => {
  return (
    <div className={className}>
      <Input
        placeholder={placeholder}
        isInvalid={Boolean(error)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="text-red-600">{error}</div>
    </div>
  );
};
