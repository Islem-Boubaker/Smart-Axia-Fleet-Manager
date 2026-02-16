type InputProps = {
  placeholder?: string;
};

const Input = ({ placeholder }: InputProps) => {
  return <input placeholder={placeholder} />;
};

export default Input;
